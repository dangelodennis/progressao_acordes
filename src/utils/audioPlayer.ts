import {
  ChordDefinition,
  InstrumentType,
  TimelineChordItem,
  MelodyNote,
  ChordRhythmPattern,
  BackingTrackStyle,
  ChordTimbre,
  ChordPlaybackStyle,
} from '../types';
import { NOTE_TO_MIDI } from '../data/musicTheory';

class WebAudioEngine {
  private ctx: AudioContext | null = null;

  // Sequence lookahead scheduler state
  private isPlayingSequence = false;
  private seqSchedulerId: number | null = null;
  private sequenceTimeoutIds: number[] = [];
  private currentStepCallback: ((index: number) => void) | null = null;
  private sequenceFinishCallback: (() => void) | null = null;
  private seqGainNode: GainNode | null = null;
  private activeSeqSources: AudioScheduledSourceNode[] = [];

  // Melody playback state
  private isPlayingMelody = false;
  private melodyTimeoutIds: number[] = [];
  private melodyStepCallback: ((noteIndex: number | null, chordIndex: number | null) => void) | null = null;
  private melodyFinishCallback: (() => void) | null = null;
  private melodyGainNode: GainNode | null = null;
  private activeMelodySources: AudioScheduledSourceNode[] = [];

  // Standalone pattern preview state
  private previewGainNode: GainNode | null = null;
  private activePreviewSources: AudioScheduledSourceNode[] = [];

  // Backing track state & master gain
  private backingGainNode: GainNode | null = null;
  private backingVolume: number = 0.75;
  private noiseBuffer: AudioBuffer | null = null;
  private activeBackingSources: AudioScheduledSourceNode[] = [];

  // Chord playback timbre
  private chordTimbre: ChordTimbre = (() => {
    try {
      const saved =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('harmoniq_chord_timbre')
          : null;
      if (saved && ['acoustic', 'synthesized', 'orchestral', 'electric'].includes(saved)) {
        return saved as ChordTimbre;
      }
    } catch {
      // ignore
    }
    return 'acoustic';
  })();

  public setChordTimbre(timbre: ChordTimbre) {
    this.chordTimbre = timbre;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('harmoniq_chord_timbre', timbre);
      }
    } catch {
      // ignore
    }
  }

  public getChordTimbre(): ChordTimbre {
    return this.chordTimbre;
  }

  // Individual chord playback style ('block' vs 'arpeggio')
  private chordPlaybackStyle: ChordPlaybackStyle = (() => {
    try {
      const saved =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('harmoniq_chord_playback_style')
          : null;
      if (saved === 'block' || saved === 'arpeggio') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'block';
  })();

  public setChordPlaybackStyle(style: ChordPlaybackStyle) {
    this.chordPlaybackStyle = style;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('harmoniq_chord_playback_style', style);
      }
    } catch {
      // ignore
    }
  }

  public getChordPlaybackStyle(): ChordPlaybackStyle {
    return this.chordPlaybackStyle;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createBusGain(ctx: AudioContext): GainNode {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    gain.connect(ctx.destination);
    return gain;
  }

  private silenceBusAndSources(
    gainNode: GainNode | null,
    sources: AudioScheduledSourceNode[]
  ) {
    const ctx = this.ctx;
    if (gainNode && ctx) {
      try {
        const now = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      } catch {
        // ignore
      }
    }
    sources.forEach((src) => {
      try {
        src.stop(ctx ? ctx.currentTime + 0.02 : 0);
      } catch {
        // already stopped
      }
    });
  }

  private registerSource(
    src: AudioScheduledSourceNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    if (!registry) return;
    registry.push(src);
    src.onended = () => {
      const idx = registry.indexOf(src);
      if (idx !== -1) registry.splice(idx, 1);
    };
  }

  // Convert MIDI note number to frequency
  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Convert note string like "C4", "Eb4", "F#3" to frequency with optional octave offset
  public noteToFreq(noteStr: string, octaveOffset = 0): number {
    const midi = NOTE_TO_MIDI[noteStr];
    if (midi !== undefined) {
      const shiftedMidi = Math.max(12, Math.min(108, midi + octaveOffset * 12));
      return this.midiToFreq(shiftedMidi);
    }
    const match = noteStr.match(/^([A-G][b#]?)(-?\d+)$/);
    if (match) {
      const noteName = match[1];
      const baseOctave = parseInt(match[2], 10);
      const octave = baseOctave + octaveOffset;
      const noteMap: Record<string, number> = {
        C: 0,
        'C#': 1,
        Db: 1,
        D: 2,
        'D#': 3,
        Eb: 3,
        E: 4,
        F: 5,
        'F#': 6,
        Gb: 6,
        G: 7,
        'G#': 8,
        Ab: 8,
        A: 9,
        'A#': 10,
        Bb: 10,
        B: 11,
      };
      const semitone = noteMap[noteName] ?? 0;
      const calcMidi = (octave + 1) * 12 + semitone;
      return this.midiToFreq(Math.max(12, Math.min(108, calcMidi)));
    }
    return 440 * Math.pow(2, octaveOffset);
  }

  // Play a single note with Piano synthesis (strictly monotonic envelope timestamps)
  private playPianoNote(
    freq: number,
    startTime: number,
    duration: number,
    velocity = 0.7,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    const ctx = this.getContext();
    const target = dest || ctx.destination;
    const safeDur = Math.max(duration, 0.06);
    const tAttack = startTime + Math.min(0.008, safeDur * 0.15);
    const tDecay = Math.max(tAttack + 0.01, startTime + Math.min(0.14, safeDur * 0.45));
    const tReleaseEnd = startTime + safeDur + Math.min(0.08, safeDur * 0.2);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.4), tAttack);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.24), tDecay);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, startTime);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.1, startTime);
    osc3.connect(osc3Gain);
    osc3Gain.connect(noteGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 6, 6000), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, Math.min(freq * 2, 1200)), tReleaseEnd);

    osc1.connect(noteGain);
    noteGain.connect(filter);
    filter.connect(target);

    const stopTime = tReleaseEnd + 0.03;
    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    this.registerSource(osc1, registry);
    this.registerSource(osc2, registry);
    this.registerSource(osc3, registry);
  }

  // Play a single note with Guitar (Violão) synthesis
  private playGuitarNote(
    freq: number,
    startTime: number,
    duration: number,
    velocity = 0.7,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    const ctx = this.getContext();
    const target = dest || ctx.destination;
    const safeDur = Math.max(duration, 0.07);
    const tAttack = startTime + Math.min(0.005, safeDur * 0.1);
    const tDecay = Math.max(tAttack + 0.015, startTime + Math.min(0.18, safeDur * 0.5));
    const tReleaseEnd = startTime + safeDur + Math.min(0.1, safeDur * 0.25);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.45), tAttack);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.16), tDecay);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);

    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(220, startTime);
    bodyFilter.Q.setValueAtTime(2.0, startTime);
    bodyFilter.gain.setValueAtTime(4, startTime);

    const dampingFilter = ctx.createBiquadFilter();
    dampingFilter.type = 'lowpass';
    dampingFilter.frequency.setValueAtTime(Math.min(freq * 8, 7000), startTime);
    dampingFilter.frequency.exponentialRampToValueAtTime(
      Math.max(220, Math.min(freq * 1.8, 900)),
      startTime + safeDur * 0.75
    );

    const mix = ctx.createGain();
    mix.gain.setValueAtTime(0.5, startTime);
    osc1.connect(mix);
    osc2.connect(mix);

    mix.connect(noteGain);
    noteGain.connect(bodyFilter);
    bodyFilter.connect(dampingFilter);
    dampingFilter.connect(target);

    const stopTime = tReleaseEnd + 0.03;
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    this.registerSource(osc1, registry);
    this.registerSource(osc2, registry);
  }

  // Synthesized Analog Pad / Poly-Synth timbre for chords
  private playSynthesizedNote(
    freq: number,
    startTime: number,
    duration: number,
    velocity = 0.65,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    const ctx = this.getContext();
    const target = dest || ctx.destination;
    const effectiveDur = Math.max(duration, 0.08);
    const release = Math.min(0.18, effectiveDur * 0.3);
    const tAttack = startTime + Math.min(0.02, effectiveDur * 0.2);
    const tSustain = Math.max(tAttack + 0.01, startTime + effectiveDur * 0.65);
    const tReleaseEnd = startTime + effectiveDur + release;

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.26), tAttack);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.18), tSustain);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-6, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(6, startTime);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq * 0.5, startTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.28, startTime);
    subOsc.connect(subGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(3.2, startTime);
    filter.frequency.setValueAtTime(Math.min(freq * 9, 4800), startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 2.2, 420),
      startTime + effectiveDur
    );

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    subGain.connect(noteGain);
    noteGain.connect(filter);
    filter.connect(target);

    const stopTime = tReleaseEnd + 0.03;
    osc1.start(startTime);
    osc2.start(startTime);
    subOsc.start(startTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    subOsc.stop(stopTime);
    this.registerSource(osc1, registry);
    this.registerSource(osc2, registry);
    this.registerSource(subOsc, registry);
  }

  // Orchestral Strings & Warm Brass Ensemble timbre for chords
  private playOrchestralNote(
    freq: number,
    startTime: number,
    duration: number,
    velocity = 0.65,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    const ctx = this.getContext();
    const target = dest || ctx.destination;
    const effectiveDur = Math.max(duration, 0.1);
    const attack = Math.min(0.14, effectiveDur * 0.25);
    const release = Math.min(0.24, effectiveDur * 0.35);
    const tAttack = startTime + attack;
    const tHold = Math.max(tAttack + 0.01, startTime + effectiveDur);
    const tReleaseEnd = tHold + release;

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.22), tAttack);
    noteGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.2), tHold);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

    const detunes = [-8, 0, 8];
    const oscs = detunes.map((cents) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(cents, startTime);
      osc.connect(noteGain);
      return osc;
    });

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(freq, startTime);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.35, startTime);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(noteGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.1, startTime);
    filter.frequency.setValueAtTime(Math.max(freq * 2.0, 500), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 5.2, 2600), tAttack);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 2.2, 650),
      tHold + release * 0.8
    );

    noteGain.connect(filter);
    filter.connect(target);

    const stopTime = tReleaseEnd + 0.03;
    oscs.forEach((osc) => {
      osc.start(startTime);
      osc.stop(stopTime);
      this.registerSource(osc, registry);
    });
    bodyOsc.start(startTime);
    bodyOsc.stop(stopTime);
    this.registerSource(bodyOsc, registry);
  }

  // Electric Piano (Rhodes / Tine) timbre for chords
  private playElectricPianoNote(
    freq: number,
    startTime: number,
    duration: number,
    velocity = 0.7,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    const ctx = this.getContext();
    const target = dest || ctx.destination;
    const effectiveDur = Math.max(duration, 0.08);
    const release = Math.min(0.16, effectiveDur * 0.3);
    const tAttack = startTime + Math.min(0.008, effectiveDur * 0.15);
    const tDecay = Math.max(tAttack + 0.015, startTime + Math.min(0.2, effectiveDur * 0.55));
    const tReleaseEnd = startTime + effectiveDur + release;

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.36), tAttack);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.2), tDecay);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(3.5, startTime);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.28, startTime);
    osc2.connect(osc2Gain);

    const tineOsc = ctx.createOscillator();
    tineOsc.type = 'sine';
    tineOsc.frequency.setValueAtTime(freq * 4, startTime);
    const tineGain = ctx.createGain();
    tineGain.gain.setValueAtTime(velocity * 0.22, startTime);
    const tineDecayEnd = startTime + Math.min(0.14, effectiveDur * 0.7);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, tineDecayEnd);
    tineOsc.connect(tineGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 6, 4200), startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(250, Math.min(freq * 2.5, 1400)),
      startTime + effectiveDur
    );

    osc1.connect(noteGain);
    osc2Gain.connect(noteGain);
    tineGain.connect(filter);
    noteGain.connect(filter);
    filter.connect(target);

    const stopTime = tReleaseEnd + 0.03;
    osc1.start(startTime);
    osc2.start(startTime);
    tineOsc.start(startTime);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    tineOsc.stop(tineDecayEnd + 0.03);
    this.registerSource(osc1, registry);
    this.registerSource(osc2, registry);
    this.registerSource(tineOsc, registry);
  }

  // Render a single chord voice using the currently active timbre setting
  private renderChordVoice(
    freq: number,
    startTime: number,
    duration: number,
    instrument: InstrumentType,
    velocity = 0.7,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    switch (this.chordTimbre) {
      case 'synthesized':
        this.playSynthesizedNote(freq, startTime, duration, velocity, dest, registry);
        break;
      case 'orchestral':
        this.playOrchestralNote(freq, startTime, duration, velocity, dest, registry);
        break;
      case 'electric':
        this.playElectricPianoNote(freq, startTime, duration, velocity, dest, registry);
        break;
      case 'acoustic':
      default:
        if (instrument === 'guitar') {
          this.playGuitarNote(freq, startTime, duration, velocity, dest, registry);
        } else {
          this.playPianoNote(freq, startTime, duration, velocity, dest, registry);
        }
        break;
    }
  }

  // Backing Track Master Gain Node
  private getBackingGain(): GainNode {
    const ctx = this.getContext();
    if (!this.backingGainNode) {
      this.backingGainNode = ctx.createGain();
      this.backingGainNode.gain.setValueAtTime(this.backingVolume, ctx.currentTime);
      this.backingGainNode.connect(ctx.destination);
    }
    return this.backingGainNode;
  }

  public setBackingVolume(volume: number) {
    this.backingVolume = Math.max(0, Math.min(1, volume));
    if (this.backingGainNode && this.ctx) {
      this.backingGainNode.gain.setValueAtTime(this.backingVolume, this.ctx.currentTime);
    }
  }

  public getBackingVolume(): number {
    return this.backingVolume;
  }

  private getNoiseBuffer(): AudioBuffer {
    const ctx = this.getContext();
    if (!this.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  public playKick(startTime: number, velocity = 0.85) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, startTime);
      osc.frequency.exponentialRampToValueAtTime(38, startTime + 0.08);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(Math.min(1.0, velocity * 0.95), startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
      this.registerSource(osc, this.activeBackingSources);
    } catch {
      // ignore
    }
  }

  public playSnare(startTime: number, velocity = 0.8) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1200, startTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(velocity * 0.55, startTime + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(startTime);
      noise.stop(startTime + 0.18);
      this.registerSource(noise, this.activeBackingSources);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, startTime);
      osc.frequency.exponentialRampToValueAtTime(95, startTime + 0.06);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, startTime);
      oscGain.gain.exponentialRampToValueAtTime(velocity * 0.45, startTime + 0.003);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

      osc.connect(oscGain);
      oscGain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
      this.registerSource(osc, this.activeBackingSources);
    } catch {
      // ignore
    }
  }

  public playHiHat(startTime: number, isOpen = false, velocity = 0.6) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, startTime);
      filter.Q.setValueAtTime(2.0, startTime);

      const gain = ctx.createGain();
      const dur = isOpen ? 0.32 : 0.045;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(velocity * (isOpen ? 0.42 : 0.32), startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(startTime);
      noise.stop(startTime + dur + 0.02);
      this.registerSource(noise, this.activeBackingSources);
    } catch {
      // ignore
    }
  }

  public playRimshot(startTime: number, velocity = 0.7) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, startTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, startTime);
      filter.Q.setValueAtTime(4.0, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.6, startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.06);
      this.registerSource(osc, this.activeBackingSources);
    } catch {
      // ignore
    }
  }

  public playBassNote(freq: number, startTime: number, duration: number, velocity = 0.75) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();
      const safeDur = Math.max(duration, 0.06);

      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, startTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.25, startTime);
      osc2.connect(osc2Gain);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 6, 850), startTime);
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(freq * 1.6, 110),
        startTime + Math.min(safeDur, 0.35)
      );

      const tAttack = startTime + Math.min(0.005, safeDur * 0.1);
      const tDecay = Math.max(tAttack + 0.01, startTime + Math.min(0.09, safeDur * 0.45));
      const tEnd = startTime + safeDur;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.65), tAttack);
      noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.38), tDecay);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      osc1.connect(noteGain);
      osc2Gain.connect(noteGain);
      noteGain.connect(filter);
      filter.connect(dest);

      osc1.start(startTime);
      osc2.start(startTime);

      const stopTime = tEnd + 0.04;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      this.registerSource(osc1, this.activeBackingSources);
      this.registerSource(osc2, this.activeBackingSources);
    } catch {
      // ignore
    }
  }

  public getBassFrequencies(chord: ChordDefinition): {
    rootFreq: number;
    fifthFreq: number;
    thirdFreq: number;
    octaveFreq: number;
  } {
    const bassName = chord.bassNote || chord.root;
    const rootNoteStr = `${bassName}2`;
    let rootFreq = this.noteToFreq(rootNoteStr, 0);

    while (rootFreq > 115) rootFreq /= 2;
    while (rootFreq < 35) rootFreq *= 2;

    const isMinor =
      chord.quality.includes('minor') || chord.quality.includes('m') || chord.quality === 'dim';
    const fifthFreq = rootFreq * Math.pow(2, 7 / 12);
    const thirdFreq = rootFreq * Math.pow(2, (isMinor ? 3 : 4) / 12);
    const octaveFreq = rootFreq * 2;

    return { rootFreq, fifthFreq, thirdFreq, octaveFreq };
  }

  // Schedules backing groove (drums + bass) accurately on Web Audio clock for the exact beat span
  public scheduleBackingForMeasure(
    measureStartTime: number,
    durationBeats: number,
    secondsPerBeat: number,
    chord: ChordDefinition,
    style: BackingTrackStyle
  ) {
    if (style === 'none' || durationBeats <= 0) return;

    const t = (beatOffset: number) => measureStartTime + beatOffset * secondsPerBeat;
    const { rootFreq, fifthFreq, thirdFreq, octaveFreq } = this.getBassFrequencies(chord);
    const eighthSec = secondsPerBeat / 2;
    const eps = 0.001;

    const playKickIf = (beat: number, vel: number) => {
      if (beat < durationBeats - eps) this.playKick(t(beat), vel);
    };
    const playSnareIf = (beat: number, vel: number) => {
      if (beat < durationBeats - eps) this.playSnare(t(beat), vel);
    };
    const playHatIf = (beat: number, isOpen: boolean, vel: number) => {
      if (beat < durationBeats - eps) this.playHiHat(t(beat), isOpen, vel);
    };
    const playRimshotIf = (beat: number, vel: number) => {
      if (beat < durationBeats - eps) this.playRimshot(t(beat), vel);
    };
    const playBassIf = (freq: number, beat: number, dur: number, vel: number) => {
      if (beat < durationBeats - eps) {
        const maxDur = (durationBeats - beat) * secondsPerBeat * 0.95;
        this.playBassNote(freq, t(beat), Math.min(dur, maxDur), vel);
      }
    };

    switch (style) {
      case 'rock': {
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 0, 0.9);
          playSnareIf(bar + 1, 0.85);
          playKickIf(bar + 2, 0.85);
          playKickIf(bar + 2.5, 0.7);
          playSnareIf(bar + 3, 0.85);
        }

        const total8ths = Math.floor(durationBeats * 2 + eps);
        for (let b = 0; b < total8ths; b++) {
          const beatPos = b * 0.5;
          playHatIf(beatPos, false, b % 2 === 0 ? 0.65 : 0.45);
          if (b === total8ths - 1 && total8ths >= 4) {
            playBassIf(fifthFreq, beatPos, eighthSec * 0.85, 0.75);
          } else {
            playBassIf(rootFreq, beatPos, eighthSec * 0.85, 0.7);
          }
        }
        break;
      }

      case 'funk': {
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 0, 0.95);
          playSnareIf(bar + 1, 0.85);
          playKickIf(bar + 1.75, 0.75);
          playKickIf(bar + 2.5, 0.85);
          playSnareIf(bar + 2.75, 0.35);
          playSnareIf(bar + 3, 0.9);

          playBassIf(rootFreq, bar + 0, secondsPerBeat * 0.35, 0.9);
          playBassIf(octaveFreq, bar + 0.75, secondsPerBeat * 0.22, 0.8);
          playBassIf(rootFreq, bar + 1.5, secondsPerBeat * 0.45, 0.85);
          playBassIf(fifthFreq, bar + 2.5, secondsPerBeat * 0.35, 0.85);
          playBassIf(rootFreq, bar + 3.25, secondsPerBeat * 0.25, 0.75);
        }

        const total16ths = Math.floor(durationBeats * 4 + eps);
        for (let s = 0; s < total16ths; s++) {
          const beatPos = s * 0.25;
          const posInBar = beatPos % 4;
          const isOpen = posInBar === 1.5 || posInBar === 3.5;
          playHatIf(beatPos, isOpen, isOpen ? 0.7 : s % 4 === 0 ? 0.6 : 0.35);
        }
        break;
      }

      case 'reggae': {
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 2, 0.95);
          playRimshotIf(bar + 2, 0.85);
          playBassIf(rootFreq, bar + 0, secondsPerBeat * 0.75, 0.85);
          playBassIf(rootFreq, bar + 1.0, secondsPerBeat * 0.6, 0.8);
          playBassIf(fifthFreq, bar + 3.0, secondsPerBeat * 0.8, 0.85);
        }

        for (let b = 0; b < durationBeats - eps; b++) {
          playHatIf(b + 0.5, false, 0.7);
        }
        break;
      }

      case 'shuffle': {
        const sixthFreq = rootFreq * Math.pow(2, 9 / 12);
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 0, 0.9);
          playSnareIf(bar + 1, 0.85);
          playKickIf(bar + 2, 0.85);
          playSnareIf(bar + 3, 0.85);

          playBassIf(rootFreq, bar + 0, secondsPerBeat * 0.85, 0.85);
          playBassIf(thirdFreq, bar + 1, secondsPerBeat * 0.85, 0.8);
          playBassIf(fifthFreq, bar + 2, secondsPerBeat * 0.85, 0.8);
          playBassIf(sixthFreq, bar + 3, secondsPerBeat * 0.85, 0.8);
        }

        for (let b = 0; b < durationBeats - eps; b++) {
          playHatIf(b, false, 0.6);
          playHatIf(b + 0.667, false, 0.45);
        }
        break;
      }

      case 'disco': {
        for (let b = 0; b < durationBeats - eps; b++) {
          playKickIf(b, 0.95);
          if (b % 4 === 1 || b % 4 === 3) {
            playSnareIf(b, 0.8);
          }
          playHatIf(b, false, 0.4);
          playHatIf(b + 0.5, true, 0.75);

          playBassIf(rootFreq, b, eighthSec * 0.8, 0.8);
          playBassIf(octaveFreq, b + 0.5, eighthSec * 0.8, 0.85);
        }
        break;
      }

      case 'bossa': {
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 0, 0.7);
          playKickIf(bar + 2, 0.65);

          playRimshotIf(bar + 0, 0.75);
          playRimshotIf(bar + 1.5, 0.7);
          playRimshotIf(bar + 2.5, 0.75);
          playRimshotIf(bar + 3.5, 0.7);

          playBassIf(rootFreq, bar + 0, secondsPerBeat * 1.1, 0.75);
          playBassIf(fifthFreq, bar + 1.5, secondsPerBeat * 0.45, 0.7);
          playBassIf(rootFreq, bar + 2.0, secondsPerBeat * 1.1, 0.75);
          playBassIf(fifthFreq, bar + 3.5, secondsPerBeat * 0.45, 0.7);
        }

        const total8ths = Math.floor(durationBeats * 2 + eps);
        for (let b = 0; b < total8ths; b++) {
          playHatIf(b * 0.5, false, 0.32);
        }
        break;
      }

      case 'punk': {
        for (let b = 0; b < durationBeats - eps; b++) {
          playKickIf(b, 0.9);
          if (b % 4 === 1 || b % 4 === 3) {
            playSnareIf(b, 0.95);
          }
        }
        for (let bar = 0; bar < durationBeats - eps; bar += 4) {
          playKickIf(bar + 2.5, 0.8);
        }

        const total8ths = Math.floor(durationBeats * 2 + eps);
        for (let b = 0; b < total8ths; b++) {
          playHatIf(b * 0.5, true, 0.55);
          playBassIf(rootFreq, b * 0.5, eighthSec * 0.9, 0.85);
        }
        break;
      }

      case 'techno': {
        for (let b = 0; b < durationBeats - eps; b++) {
          playKickIf(b, 1.0);
          playHatIf(b + 0.5, true, 0.8);
          playHatIf(b + 0.25, false, 0.35);
          playHatIf(b + 0.75, false, 0.35);
        }

        const total16thSteps = Math.floor(durationBeats * 4 + eps);
        for (let s = 0; s < total16thSteps; s++) {
          if (s % 4 !== 0) {
            playBassIf(rootFreq, s * 0.25, eighthSec * 0.45, 0.8);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // Schedule a single chord strike (block or ascending arpeggio) at an exact Web Audio startTime
  private scheduleChordHit(
    chord: ChordDefinition,
    instrument: InstrumentType,
    startTime: number,
    durationSec: number,
    octaveOffset = 0,
    velocity = 0.7,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[],
    playbackStyle: ChordPlaybackStyle = 'block'
  ) {
    const notes =
      chord.notes && chord.notes.length > 0
        ? chord.notes
        : chord.noteNames.map((n) => `${n}4`);

    if (playbackStyle === 'arpeggio' && notes.length > 1) {
      const arpeggioSpan = Math.min(durationSec * 0.55, notes.length * 0.14);
      const stepDelay = Math.max(0.065, Math.min(0.15, arpeggioSpan / notes.length));

      notes.forEach((noteStr, idx) => {
        const freq = this.noteToFreq(noteStr, octaveOffset);
        const voiceStart = startTime + idx * stepDelay;
        const voiceDur = Math.max(durationSec - idx * stepDelay, 0.28);
        const noteVel =
          idx === 0
            ? Math.min(1, velocity * 1.06)
            : idx === notes.length - 1
            ? velocity
            : velocity * 0.94;
        this.renderChordVoice(
          freq,
          voiceStart,
          voiceDur,
          instrument,
          noteVel,
          dest,
          registry
        );
      });
      return;
    }

    const strumDelay =
      this.chordTimbre === 'orchestral'
        ? 0.008
        : instrument === 'guitar'
        ? Math.min(0.02, durationSec * 0.08)
        : 0.004;

    notes.forEach((noteStr, idx) => {
      const freq = this.noteToFreq(noteStr, octaveOffset);
      const voiceStart = startTime + idx * strumDelay;
      const voiceDur = Math.max(durationSec - idx * strumDelay, 0.06);
      this.renderChordVoice(freq, voiceStart, voiceDur, instrument, velocity, dest, registry);
    });
  }

  // Play full Chord immediately (for clicks / previews) in block or arpeggio mode
  public playChord(
    chord: ChordDefinition,
    instrument: InstrumentType = 'piano',
    duration = 1.4,
    octaveOffset = 0,
    playbackStyleOverride?: ChordPlaybackStyle
  ) {
    try {
      const ctx = this.getContext();
      this.silenceBusAndSources(this.previewGainNode, this.activePreviewSources);
      this.activePreviewSources = [];
      this.previewGainNode = this.createBusGain(ctx);

      const style = playbackStyleOverride ?? this.chordPlaybackStyle;
      this.scheduleChordHit(
        chord,
        instrument,
        ctx.currentTime + 0.015,
        duration,
        octaveOffset,
        0.7,
        this.previewGainNode,
        this.activePreviewSources,
        style
      );
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // Play scale ascending with optional octave offset
  public playScale(
    scaleNotes: string[],
    instrument: InstrumentType = 'piano',
    noteDurationSec = 0.28,
    octaveOffset = 0
  ) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      scaleNotes.forEach((note, idx) => {
        const noteStr = `${note}4`;
        const freq = this.noteToFreq(noteStr, octaveOffset);
        const startTime = now + idx * noteDurationSec;

        if (instrument === 'guitar') {
          this.playGuitarNote(freq, startTime, noteDurationSec * 1.4, 0.6);
        } else {
          this.playPianoNote(freq, startTime, noteDurationSec * 1.4, 0.6);
        }
      });
    } catch (err) {
      console.warn('Scale audio error:', err);
    }
  }

  // Schedule chord rhythmic pattern using exact Web Audio timestamps (zero setTimeout jitter)
  public playChordWithPattern(
    chord: ChordDefinition,
    instrument: InstrumentType,
    totalDurationSec: number,
    octaveOffset = 0,
    pattern: ChordRhythmPattern = 'whole',
    bpm: number = 110,
    scheduledStartTime?: number,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[],
    exactDurationBeats?: number
  ) {
    const ctx = this.getContext();
    const secondsPerBeat = 60 / Math.max(20, bpm);
    const totalBeats =
      exactDurationBeats && exactDurationBeats > 0
        ? exactDurationBeats
        : Math.max(0.5, totalDurationSec / secondsPerBeat);
    const notes =
      chord.notes && chord.notes.length > 0
        ? chord.notes
        : chord.noteNames.map((n) => `${n}4`);

    let startTime = scheduledStartTime;
    let targetBus = dest;
    let targetRegistry = registry;

    // Standalone preview mode (e.g., user changed rhythm dropdown in ChordTimeline)
    if (startTime === undefined) {
      this.silenceBusAndSources(this.previewGainNode, this.activePreviewSources);
      this.activePreviewSources = [];
      this.previewGainNode = this.createBusGain(ctx);
      targetBus = this.previewGainNode;
      targetRegistry = this.activePreviewSources;
      startTime = ctx.currentTime + 0.015;
    }

    const eps = 0.001;

    switch (pattern) {
      case 'quarters': {
        for (let b = 0; b < totalBeats - eps; b += 1) {
          const hitBeats = Math.min(0.85, totalBeats - b);
          this.scheduleChordHit(
            chord,
            instrument,
            startTime + b * secondsPerBeat,
            hitBeats * secondsPerBeat,
            octaveOffset,
            b === 0 ? 0.78 : 0.65,
            targetBus,
            targetRegistry
          );
        }
        break;
      }

      case 'eighths': {
        const eighthSec = secondsPerBeat / 2;
        const totalEighths = Math.floor(totalBeats * 2 + eps);
        for (let e = 0; e < totalEighths; e++) {
          const beatPos = e * 0.5;
          if (beatPos >= totalBeats - eps) break;
          this.scheduleChordHit(
            chord,
            instrument,
            startTime + beatPos * secondsPerBeat,
            eighthSec * 0.78,
            octaveOffset,
            e % 2 === 0 ? 0.75 : 0.58,
            targetBus,
            targetRegistry
          );
        }
        break;
      }

      case 'syncopated': {
        const syncopatedBeats: { start: number; dur: number; vel: number }[] = [];
        if (totalBeats <= 1 + eps) {
          syncopatedBeats.push({ start: 0, dur: totalBeats * 0.85, vel: 0.78 });
        } else if (totalBeats <= 2 + eps) {
          syncopatedBeats.push({ start: 0, dur: 0.9, vel: 0.78 });
          syncopatedBeats.push({ start: 1.0, dur: Math.max(0.4, totalBeats - 1.0) * 0.9, vel: 0.68 });
        } else if (totalBeats <= 3 + eps) {
          syncopatedBeats.push({ start: 0, dur: 1.3, vel: 0.78 });
          syncopatedBeats.push({ start: 1.5, dur: Math.max(0.4, totalBeats - 1.5) * 0.9, vel: 0.7 });
        } else {
          for (let m = 0; m < totalBeats - eps; m += 4) {
            if (m < totalBeats - eps) {
              syncopatedBeats.push({ start: m, dur: Math.min(1.3, totalBeats - m), vel: 0.8 });
            }
            if (m + 1.5 < totalBeats - eps) {
              syncopatedBeats.push({
                start: m + 1.5,
                dur: Math.min(1.3, totalBeats - (m + 1.5)),
                vel: 0.72,
              });
            }
            if (m + 3.0 < totalBeats - eps) {
              syncopatedBeats.push({
                start: m + 3.0,
                dur: Math.min(0.9, totalBeats - (m + 3.0)),
                vel: 0.68,
              });
            }
          }
        }

        syncopatedBeats.forEach(({ start, dur, vel }) => {
          this.scheduleChordHit(
            chord,
            instrument,
            startTime + start * secondsPerBeat,
            dur * secondsPerBeat * 0.92,
            octaveOffset,
            vel,
            targetBus,
            targetRegistry
          );
        });
        break;
      }

      case 'arpeggio': {
        const eighthSec = secondsPerBeat / 2;
        const totalSteps = Math.max(1, Math.floor(totalBeats * 2 + eps));
        for (let i = 0; i < totalSteps; i++) {
          const beatPos = i * 0.5;
          if (beatPos >= totalBeats - eps) break;
          const noteIndex = i % notes.length;
          const noteStr = notes[noteIndex];
          const freq = this.noteToFreq(noteStr, octaveOffset);
          const remainingSec = (totalBeats - beatPos) * secondsPerBeat;
          const noteDur = Math.min(eighthSec * 1.75, remainingSec * 0.95);
          this.renderChordVoice(
            freq,
            startTime + beatPos * secondsPerBeat,
            noteDur,
            instrument,
            i === 0 ? 0.78 : 0.68,
            targetBus,
            targetRegistry
          );
        }
        break;
      }

      case 'waltz': {
        const rootNote = notes[0] || `${chord.root}3`;
        const rootFreq = this.noteToFreq(rootNote, octaveOffset);
        for (let m = 0; m < totalBeats - eps; m += 3) {
          if (m < totalBeats - eps) {
            this.renderChordVoice(
              rootFreq,
              startTime + m * secondsPerBeat,
              secondsPerBeat * 0.88,
              instrument,
              0.84,
              targetBus,
              targetRegistry
            );
          }
          for (let b = 1; b < 3; b++) {
            if (m + b < totalBeats - eps) {
              this.scheduleChordHit(
                chord,
                instrument,
                startTime + (m + b) * secondsPerBeat,
                secondsPerBeat * 0.78,
                octaveOffset,
                0.62,
                targetBus,
                targetRegistry
              );
            }
          }
        }
        break;
      }

      case 'whole':
      default: {
        this.scheduleChordHit(
          chord,
          instrument,
          startTime,
          totalBeats * secondsPerBeat * 0.94,
          octaveOffset,
          0.72,
          targetBus,
          targetRegistry
        );
        break;
      }
    }
  }

  // Play timeline sequence with sample-accurate Web Audio Lookahead Scheduler
  public playSequence(
    items: TimelineChordItem[],
    bpm: number,
    instrument: InstrumentType,
    loop: boolean,
    onStep: (index: number) => void,
    onFinish: () => void,
    globalOctaveOffset = 0,
    backingStyle: BackingTrackStyle = 'none',
    backingVolume = 0.75,
    startIndex = 0
  ) {
    this.clearSequenceTimers();
    if (items.length === 0) return;

    const ctx = this.getContext();
    this.seqGainNode = this.createBusGain(ctx);
    this.isPlayingSequence = true;
    this.currentStepCallback = onStep;
    this.sequenceFinishCallback = onFinish;
    this.setBackingVolume(backingVolume);

    const safeBpm = Math.max(20, Math.min(260, bpm || 110));
    const secondsPerBeat = 60 / safeBpm;

    // Precompute exact beat/second offsets for every chord in one cycle
    let beatCursor = 0;
    const steps = items.map((item, idx) => {
      const durBeats =
        Number.isFinite(item.durationBeats) && item.durationBeats > 0
          ? item.durationBeats
          : 4;
      const startBeat = beatCursor;
      beatCursor += durBeats;
      return {
        index: idx,
        item,
        durationBeats: durBeats,
        startSec: startBeat * secondsPerBeat,
        durationSec: durBeats * secondsPerBeat,
      };
    });

    const cycleDurationSec = beatCursor * secondsPerBeat;
    const safeStartIdx =
      startIndex >= 0 && startIndex < steps.length ? startIndex : 0;

    // Initial audio origin slightly ahead so beat 0 never clips or starts late
    const initialDelay = 0.04;
    let cycleStartTime = ctx.currentTime + initialDelay - steps[safeStartIdx].startSec;
    let nextStepIdx = safeStartIdx;
    let endScheduled = false;

    const LOOKAHEAD_SEC = 0.16; // Schedule 160ms ahead on hardware Web Audio clock
    const TICK_MS = 25;

    const schedulerTick = () => {
      if (!this.isPlayingSequence || endScheduled) return;

      const now = ctx.currentTime;

      while (this.isPlayingSequence && !endScheduled) {
        const step = steps[nextStepIdx];
        const chordAudioTime = cycleStartTime + step.startSec;

        if (chordAudioTime > now + LOOKAHEAD_SEC) {
          break;
        }

        const safeAudioTime = Math.max(now, chordAudioTime);
        const chordOctave = (step.item.octaveOffset ?? 0) + globalOctaveOffset;
        const pattern = step.item.rhythmPattern || 'whole';

        // Schedule chord & backing directly on Web Audio clock
        this.playChordWithPattern(
          step.item.chord,
          instrument,
          step.durationSec,
          chordOctave,
          pattern,
          safeBpm,
          safeAudioTime,
          this.seqGainNode || undefined,
          this.activeSeqSources,
          step.durationBeats
        );

        if (backingStyle && backingStyle !== 'none') {
          this.scheduleBackingForMeasure(
            safeAudioTime,
            step.durationBeats,
            secondsPerBeat,
            step.item.chord,
            backingStyle
          );
        }

        // Schedule visual step highlight in sync with chordAudioTime
        const stepIndexSnapshot = step.index;
        const visualDelayMs = Math.max(0, (safeAudioTime - ctx.currentTime) * 1000);
        const visualTimeoutId = window.setTimeout(() => {
          if (!this.isPlayingSequence) return;
          if (this.currentStepCallback) {
            this.currentStepCallback(stepIndexSnapshot);
          }
        }, visualDelayMs);
        this.sequenceTimeoutIds.push(visualTimeoutId);

        // Advance pointer to next chord or next seamless loop cycle
        nextStepIdx += 1;
        if (nextStepIdx >= steps.length) {
          if (loop) {
            nextStepIdx = 0;
            cycleStartTime += cycleDurationSec;
          } else {
            endScheduled = true;
            const cycleEndTime = cycleStartTime + cycleDurationSec;
            const endDelayMs = Math.max(0, (cycleEndTime - ctx.currentTime) * 1000);
            const endTimeoutId = window.setTimeout(() => {
              if (!this.isPlayingSequence) return;
              const finishCb = this.sequenceFinishCallback;
              this.clearSequenceTimers();
              this.stopBackingTrack();
              if (finishCb) finishCb();
            }, endDelayMs);
            this.sequenceTimeoutIds.push(endTimeoutId);
          }
        }
      }
    };

    schedulerTick();
    this.seqSchedulerId = window.setInterval(schedulerTick, TICK_MS);
  }

  // Play a single note immediately
  public playSingleNote(
    noteStr: string,
    instrument: InstrumentType = 'piano',
    duration = 0.5,
    velocity = 0.75,
    octaveOffset = 0,
    scheduledStartTime?: number,
    dest?: AudioNode,
    registry?: AudioScheduledSourceNode[]
  ) {
    try {
      const ctx = this.getContext();
      const startTime = scheduledStartTime ?? ctx.currentTime;
      const freq = this.noteToFreq(noteStr, octaveOffset);

      if (instrument === 'guitar') {
        this.playGuitarNote(freq, startTime, duration, velocity, dest, registry);
      } else {
        this.playPianoNote(freq, startTime, duration, velocity, dest, registry);
      }
    } catch (err) {
      console.warn('Single note audio error:', err);
    }
  }

  // Play melody sequence solo (sample-accurate Web Audio clock)
  public playMelody(
    notes: MelodyNote[],
    bpm: number,
    instrument: InstrumentType,
    onStep: (noteIndex: number | null) => void,
    onFinish: () => void,
    octaveOffset = 0
  ) {
    this.clearMelodyTimers();
    if (!notes || notes.length === 0) return;

    const ctx = this.getContext();
    this.melodyGainNode = this.createBusGain(ctx);
    this.isPlayingMelody = true;
    this.melodyFinishCallback = onFinish;

    const safeBpm = Math.max(20, Math.min(260, bpm || 110));
    const secondsPerBeat = 60 / safeBpm;
    const startOrigin = ctx.currentTime + 0.04;

    let maxEndSec = 0;
    notes.forEach((item, index) => {
      const startSec = item.startBeat * secondsPerBeat;
      const durationSec = Math.max(item.durationBeats * secondsPerBeat * 0.94, 0.08);
      const endSec = (item.startBeat + item.durationBeats) * secondsPerBeat;
      if (endSec > maxEndSec) maxEndSec = endSec;

      const audioTime = startOrigin + startSec;
      this.playSingleNote(
        item.note,
        instrument,
        durationSec,
        0.8,
        octaveOffset,
        audioTime,
        this.melodyGainNode || undefined,
        this.activeMelodySources
      );

      const visualDelayMs = Math.max(0, (audioTime - ctx.currentTime) * 1000);
      const timeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        onStep(index);
      }, visualDelayMs);

      this.melodyTimeoutIds.push(timeoutId);
    });

    const finishDelayMs = Math.max(0, (startOrigin + maxEndSec - ctx.currentTime) * 1000) + 60;
    const endTimeoutId = window.setTimeout(() => {
      if (!this.isPlayingMelody) return;
      const finishCb = this.melodyFinishCallback;
      this.clearMelodyTimers();
      onStep(null);
      if (finishCb) finishCb();
    }, finishDelayMs);

    this.melodyTimeoutIds.push(endTimeoutId);
  }

  // Play synchronized Melody + Chord progression accompaniment + Backing Track on a single shared audio clock
  public playMelodyWithChords(
    notes: MelodyNote[],
    chords: TimelineChordItem[],
    bpm: number,
    instrumentMelody: InstrumentType,
    instrumentChord: InstrumentType,
    onStep: (noteIndex: number | null, chordIndex: number | null) => void,
    onFinish: () => void,
    melodyOctaveOffset = 0,
    chordOctaveOffset = 0,
    backingStyle: BackingTrackStyle = 'none',
    backingVolume = 0.75
  ) {
    this.clearSequenceTimers();
    this.clearMelodyTimers();
    this.stopBackingTrack();
    if (chords.length === 0 && notes.length === 0) return;

    const ctx = this.getContext();
    this.seqGainNode = this.createBusGain(ctx);
    this.melodyGainNode = this.createBusGain(ctx);
    this.isPlayingMelody = true;
    this.isPlayingSequence = true;
    this.melodyStepCallback = onStep;
    this.melodyFinishCallback = onFinish;
    this.setBackingVolume(backingVolume);

    const safeBpm = Math.max(20, Math.min(260, bpm || 110));
    const secondsPerBeat = 60 / safeBpm;
    const startOrigin = ctx.currentTime + 0.04;

    // Schedule chord accompaniment & backing track directly on startOrigin
    let cumulativeBeat = 0;
    chords.forEach((chordItem, cIdx) => {
      const durBeats =
        Number.isFinite(chordItem.durationBeats) && chordItem.durationBeats > 0
          ? chordItem.durationBeats
          : 4;
      const chordDurationSec = durBeats * secondsPerBeat;
      const chordAudioTime = startOrigin + cumulativeBeat * secondsPerBeat;
      const effectiveOctave = (chordItem.octaveOffset ?? 0) + chordOctaveOffset;
      const pattern = chordItem.rhythmPattern || 'whole';

      this.playChordWithPattern(
        chordItem.chord,
        instrumentChord,
        chordDurationSec,
        effectiveOctave,
        pattern,
        safeBpm,
        chordAudioTime,
        this.seqGainNode || undefined,
        this.activeSeqSources,
        durBeats
      );

      if (backingStyle && backingStyle !== 'none') {
        this.scheduleBackingForMeasure(
          chordAudioTime,
          durBeats,
          secondsPerBeat,
          chordItem.chord,
          backingStyle
        );
      }

      const visualDelayMs = Math.max(0, (chordAudioTime - ctx.currentTime) * 1000);
      const chordTimeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        if (this.melodyStepCallback) {
          this.melodyStepCallback(null, cIdx);
        }
      }, visualDelayMs);

      this.melodyTimeoutIds.push(chordTimeoutId);
      cumulativeBeat += durBeats;
    });

    // Schedule melody notes on the exact same startOrigin
    let maxMelodyEndSec = 0;
    notes.forEach((noteItem, nIdx) => {
      const noteStartSec = noteItem.startBeat * secondsPerBeat;
      const noteDurationSec = Math.max(noteItem.durationBeats * secondsPerBeat * 0.94, 0.08);
      const noteEndSec = (noteItem.startBeat + noteItem.durationBeats) * secondsPerBeat;
      if (noteEndSec > maxMelodyEndSec) maxMelodyEndSec = noteEndSec;

      const noteAudioTime = startOrigin + noteStartSec;
      this.playSingleNote(
        noteItem.note,
        instrumentMelody,
        noteDurationSec,
        0.85,
        melodyOctaveOffset,
        noteAudioTime,
        this.melodyGainNode || undefined,
        this.activeMelodySources
      );

      const visualDelayMs = Math.max(0, (noteAudioTime - ctx.currentTime) * 1000);
      const noteTimeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        if (this.melodyStepCallback) {
          this.melodyStepCallback(nIdx, noteItem.chordIndex);
        }
      }, visualDelayMs);

      this.melodyTimeoutIds.push(noteTimeoutId);
    });

    const totalSec = Math.max(cumulativeBeat * secondsPerBeat, maxMelodyEndSec);
    const finishDelayMs = Math.max(0, (startOrigin + totalSec - ctx.currentTime) * 1000) + 120;
    const finalTimeoutId = window.setTimeout(() => {
      const stepCb = this.melodyStepCallback;
      const finishCb = this.melodyFinishCallback;
      this.clearSequenceTimers();
      this.clearMelodyTimers();
      this.stopBackingTrack();
      if (stepCb) {
        stepCb(null, null);
      }
      if (finishCb) {
        finishCb();
      }
    }, finishDelayMs);

    this.melodyTimeoutIds.push(finalTimeoutId);
  }

  // Stop backing track audio immediately
  public stopBackingTrack() {
    try {
      if (this.backingGainNode && this.ctx) {
        const now = this.ctx.currentTime;
        this.backingGainNode.gain.cancelScheduledValues(now);
        this.backingGainNode.gain.setValueAtTime(0.0001, now);
        const savedVolume = this.backingVolume;
        window.setTimeout(() => {
          if (this.backingGainNode && this.ctx) {
            this.backingGainNode.gain.setValueAtTime(savedVolume, this.ctx.currentTime);
          }
        }, 80);
      }
      this.activeBackingSources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeBackingSources = [];
    } catch {
      // ignore
    }
  }

  private clearSequenceTimers() {
    this.isPlayingSequence = false;
    if (this.seqSchedulerId !== null) {
      window.clearInterval(this.seqSchedulerId);
      this.seqSchedulerId = null;
    }
    this.sequenceTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.sequenceTimeoutIds = [];
    this.silenceBusAndSources(this.seqGainNode, this.activeSeqSources);
    this.seqGainNode = null;
    this.activeSeqSources = [];
    this.currentStepCallback = null;
    this.sequenceFinishCallback = null;
  }

  private clearMelodyTimers() {
    this.isPlayingMelody = false;
    this.melodyTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.melodyTimeoutIds = [];
    this.silenceBusAndSources(this.melodyGainNode, this.activeMelodySources);
    this.melodyGainNode = null;
    this.activeMelodySources = [];
    this.melodyStepCallback = null;
    this.melodyFinishCallback = null;
  }

  public stopMelody() {
    const wasPlaying = this.isPlayingMelody;
    const stepCb = this.melodyStepCallback;
    const finishCb = this.melodyFinishCallback;
    this.clearMelodyTimers();
    this.stopBackingTrack();
    if (stepCb) {
      stepCb(null, null);
    }
    if (wasPlaying && finishCb) {
      finishCb();
    }
  }

  public stopSequence() {
    const wasPlaying = this.isPlayingSequence;
    const finishCb = this.sequenceFinishCallback;
    this.clearSequenceTimers();
    this.stopBackingTrack();
    if (wasPlaying && finishCb) {
      finishCb();
    }
  }

  public stopAll() {
    this.stopSequence();
    this.stopMelody();
    this.stopBackingTrack();
    this.silenceBusAndSources(this.previewGainNode, this.activePreviewSources);
    this.previewGainNode = null;
    this.activePreviewSources = [];
  }

  public isRunning(): boolean {
    return this.isPlayingSequence;
  }

  public isMelodyActive(): boolean {
    return this.isPlayingMelody;
  }
}

export const audioEngine = new WebAudioEngine();

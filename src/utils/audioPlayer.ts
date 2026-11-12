import { ChordDefinition, InstrumentType, TimelineChordItem, MelodyNote, ChordRhythmPattern, BackingTrackStyle } from '../types';
import { NOTE_TO_MIDI } from '../data/musicTheory';

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlayingSequence = false;
  private sequenceTimeoutIds: number[] = [];
  private currentStepCallback: ((index: number) => void) | null = null;

  private isPlayingMelody = false;
  private melodyTimeoutIds: number[] = [];
  private melodyStepCallback: ((noteIndex: number | null, chordIndex: number | null) => void) | null = null;

  // Backing track state & master gain
  private backingGainNode: GainNode | null = null;
  private backingVolume: number = 0.75;
  private noiseBuffer: AudioBuffer | null = null;
  private activeBackingOscillators: OscillatorNode[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
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
    // Fallback parser if note octave format is custom
    const match = noteStr.match(/^([A-G][b#]?)(-?\d+)$/);
    if (match) {
      const noteName = match[1];
      const baseOctave = parseInt(match[2], 10);
      const octave = baseOctave + octaveOffset;
      const noteMap: Record<string, number> = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
        'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
      };
      const semitone = noteMap[noteName] ?? 0;
      const calcMidi = (octave + 1) * 12 + semitone;
      return this.midiToFreq(Math.max(12, Math.min(108, calcMidi)));
    }
    return 440 * Math.pow(2, octaveOffset);
  }

  // Play a single note with Piano synthesis
  private playPianoNote(freq: number, startTime: number, duration: number, velocity = 0.7) {
    const ctx = this.getContext();
    
    // Master gain for this note
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.4, startTime + 0.008); // Quick hammer attack
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.25, startTime + 0.15); // Initial decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(duration, 0.4)); // Release

    // Fundamental oscillator (triangle/sine blend)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // 2nd harmonic (warmth)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, startTime);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    // 3rd harmonic (chime/brightness)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.1, startTime);
    osc3.connect(osc3Gain);
    osc3Gain.connect(noteGain);

    // Dynamic Lowpass Filter (piano sound starts brighter, becomes darker)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 6, 6000), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2, 1200), startTime + duration);

    osc1.connect(noteGain);
    noteGain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    const stopTime = startTime + duration + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }

  // Play a single note with Guitar (Violão) synthesis
  private playGuitarNote(freq: number, startTime: number, duration: number, velocity = 0.7) {
    const ctx = this.getContext();

    // Amplitude envelope for plucked acoustic string
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.45, startTime + 0.005); // Fast pluck attack
    noteGain.gain.exponentialRampToValueAtTime(velocity * 0.15, startTime + 0.2); // Decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(duration, 0.5)); // Damping

    // Pluck timbre using sawtooth and triangle
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, startTime);

    // Bandpass resonator to simulate wooden guitar body resonance (~200Hz - 800Hz)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(220, startTime);
    bodyFilter.Q.setValueAtTime(2.0, startTime);
    bodyFilter.gain.setValueAtTime(4, startTime);

    // Brightness filter that damps high frequencies rapidly like nylon/steel strings
    const dampingFilter = ctx.createBiquadFilter();
    dampingFilter.type = 'lowpass';
    dampingFilter.frequency.setValueAtTime(Math.min(freq * 8, 7000), startTime);
    dampingFilter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.8, 900), startTime + duration * 0.7);

    const mix = ctx.createGain();
    mix.gain.setValueAtTime(0.5, startTime);
    osc1.connect(mix);
    osc2.connect(mix);

    mix.connect(noteGain);
    noteGain.connect(bodyFilter);
    bodyFilter.connect(dampingFilter);
    dampingFilter.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);

    const stopTime = startTime + duration + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
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

  // Pre-generate white noise buffer for crisp percussion (hi-hat, snare)
  private getNoiseBuffer(): AudioBuffer {
    const ctx = this.getContext();
    if (!this.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  // Drum Synthesizer: Kick Drum (Punchy 808/Acoustic style)
  public playKick(startTime: number, velocity = 0.85) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch drop envelope from 150Hz to 38Hz
      osc.frequency.setValueAtTime(150, startTime);
      osc.frequency.exponentialRampToValueAtTime(38, startTime + 0.08);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(Math.min(1.0, velocity * 0.95), startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
      this.activeBackingOscillators.push(osc);
    } catch {
      // ignore
    }
  }

  // Drum Synthesizer: Snare Drum (Dual component: Tonal shell + Noise wires)
  public playSnare(startTime: number, velocity = 0.8) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      // 1. Noise snap
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

      // 2. Tonal body
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
      this.activeBackingOscillators.push(osc);
    } catch {
      // ignore
    }
  }

  // Drum Synthesizer: Hi-Hat (Closed / Open)
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
    } catch {
      // ignore
    }
  }

  // Drum Synthesizer: Rimshot / Cross-Stick (Latin / Bossa / Reggae)
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
      this.activeBackingOscillators.push(osc);
    } catch {
      // ignore
    }
  }

  // Bass Synthesizer: Electric & Synthetic Bass pluck
  public playBassNote(freq: number, startTime: number, duration: number, velocity = 0.75) {
    try {
      const ctx = this.getContext();
      const dest = this.getBackingGain();

      // Fundamental warm body
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      // Harmonics for pluck definition
      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, startTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.25, startTime);
      osc2.connect(osc2Gain);

      // Dynamic lowpass filter (analog filter envelope)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 6, 850), startTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.6, 110), startTime + Math.min(duration, 0.35));

      // Note amplitude envelope
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(velocity * 0.65, startTime + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(velocity * 0.38, startTime + 0.09);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(noteGain);
      osc2Gain.connect(noteGain);
      noteGain.connect(filter);
      filter.connect(dest);

      osc1.start(startTime);
      osc2.start(startTime);

      const stopTime = startTime + duration + 0.05;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      this.activeBackingOscillators.push(osc1, osc2);
    } catch {
      // ignore
    }
  }

  // Calculate bass frequencies for a chord: Root, 5th, 3rd, Octave
  public getBassFrequencies(chord: ChordDefinition): {
    rootFreq: number;
    fifthFreq: number;
    thirdFreq: number;
    octaveFreq: number;
  } {
    // Respect chord bass note for inversions (e.g. C/E -> E, C/G -> G)
    const bassName = chord.bassNote || chord.root;
    const rootNoteStr = `${bassName}2`;
    let rootFreq = this.noteToFreq(rootNoteStr, 0);

    // Keep bass in standard bass range (35Hz - 110Hz)
    while (rootFreq > 115) rootFreq /= 2;
    while (rootFreq < 35) rootFreq *= 2;

    const isMinor = chord.quality.includes('minor') || chord.quality.includes('m') || chord.quality === 'dim';
    const fifthFreq = rootFreq * Math.pow(2, 7 / 12);
    const thirdFreq = rootFreq * Math.pow(2, (isMinor ? 3 : 4) / 12);
    const octaveFreq = rootFreq * 2;

    return { rootFreq, fifthFreq, thirdFreq, octaveFreq };
  }

  // Schedules backing groove (drums + bass) for one measure (4 beats)
  public scheduleBackingForMeasure(
    measureStartTime: number,
    durationBeats: number,
    secondsPerBeat: number,
    chord: ChordDefinition,
    style: BackingTrackStyle
  ) {
    if (style === 'none') return;

    const t = (beatOffset: number) => measureStartTime + beatOffset * secondsPerBeat;
    const { rootFreq, fifthFreq, thirdFreq, octaveFreq } = this.getBassFrequencies(chord);
    const eighthSec = secondsPerBeat / 2;

    const playKickIf = (beat: number, vel: number) => {
      if (beat < durationBeats) this.playKick(t(beat), vel);
    };
    const playSnareIf = (beat: number, vel: number) => {
      if (beat < durationBeats) this.playSnare(t(beat), vel);
    };
    const playRimshotIf = (beat: number, vel: number) => {
      if (beat < durationBeats) this.playRimshot(t(beat), vel);
    };
    const playBassIf = (freq: number, beat: number, dur: number, vel: number) => {
      if (beat < durationBeats) this.playBassNote(freq, t(beat), dur, vel);
    };

    switch (style) {
      case 'rock': {
        // Drums: Rock 8th feel, kick on 1, 3, snare on 2, 4
        this.playKick(t(0), 0.9);
        playSnareIf(1, 0.85);
        playKickIf(2, 0.85);
        playKickIf(2.5, 0.7);
        playSnareIf(3, 0.85);

        // 8th-note Hi-Hats
        for (let b = 0; b < durationBeats * 2; b++) {
          this.playHiHat(t(b * 0.5), false, b % 2 === 0 ? 0.65 : 0.45);
        }

        // Bass: Driving 8th notes (root on beats, 5th pickup on last 8th before measure end)
        const total8ths = Math.floor(durationBeats * 2);
        for (let b = 0; b < total8ths; b++) {
          const beatPos = b * 0.5;
          if (b === total8ths - 1 && total8ths >= 4) {
            this.playBassNote(fifthFreq, t(beatPos), eighthSec * 0.85, 0.75);
          } else {
            this.playBassNote(rootFreq, t(beatPos), eighthSec * 0.85, 0.7);
          }
        }
        break;
      }

      case 'funk': {
        // Drums: Syncopated funk groove, ghost snare on 2.75, open hat on 1.5 & 3.5
        this.playKick(t(0), 0.95);
        playSnareIf(1, 0.85);
        playKickIf(1.75, 0.75);
        playKickIf(2.5, 0.85);
        playSnareIf(2.75, 0.35); // ghost note
        playSnareIf(3, 0.9);

        // 16th hats with open accents
        const total16ths = durationBeats * 4;
        for (let s = 0; s < total16ths; s++) {
          const beatPos = s * 0.25;
          const isOpen = beatPos === 1.5 || beatPos === 3.5;
          this.playHiHat(t(beatPos), isOpen, isOpen ? 0.7 : s % 4 === 0 ? 0.6 : 0.35);
        }

        // Bass: Syncopated slap/groove line
        playBassIf(rootFreq, 0, secondsPerBeat * 0.35, 0.9);
        playBassIf(octaveFreq, 0.75, secondsPerBeat * 0.22, 0.8);
        playBassIf(rootFreq, 1.5, secondsPerBeat * 0.45, 0.85);
        playBassIf(fifthFreq, 2.5, secondsPerBeat * 0.35, 0.85);
        playBassIf(rootFreq, 3.25, secondsPerBeat * 0.25, 0.75);
        break;
      }

      case 'reggae': {
        // Drums: "One Drop" (Kick + Rimshot strictly on beat 3 = beat index 2.0)
        playKickIf(2, 0.95);
        playRimshotIf(2, 0.85);

        // Offbeat Skank Hi-Hats on the "&" of each beat
        for (let b = 0; b < durationBeats; b++) {
          this.playHiHat(t(b + 0.5), false, 0.7);
        }

        // Deep Reggae Sub-Bass (Roots style)
        playBassIf(rootFreq, 0, secondsPerBeat * 0.75, 0.85);
        playBassIf(rootFreq, 1.0, secondsPerBeat * 0.6, 0.8);
        playBassIf(fifthFreq, 3.0, secondsPerBeat * 0.8, 0.85);
        break;
      }

      case 'shuffle': {
        // Swung Blues Triplet Feel (Drums & Walking Bass)
        this.playKick(t(0), 0.9);
        playSnareIf(1, 0.85);
        playKickIf(2, 0.85);
        playSnareIf(3, 0.85);

        // Swung triplet hats: 0, 0.667, 1.0, 1.667, 2.0, 2.667, 3.0, 3.667
        for (let b = 0; b < durationBeats; b++) {
          this.playHiHat(t(b), false, 0.6);
          this.playHiHat(t(b + 0.667), false, 0.45);
        }

        // Walking Bass: Root -> 3rd -> 5th -> 6th
        const sixthFreq = rootFreq * Math.pow(2, 9 / 12);
        playBassIf(rootFreq, 0, secondsPerBeat * 0.85, 0.85);
        playBassIf(thirdFreq, 1, secondsPerBeat * 0.85, 0.8);
        playBassIf(fifthFreq, 2, secondsPerBeat * 0.85, 0.8);
        playBassIf(sixthFreq, 3, secondsPerBeat * 0.85, 0.8);
        break;
      }

      case 'disco': {
        // Drums: Four-on-the-floor kick, open hat on every upbeat
        for (let b = 0; b < durationBeats; b++) {
          this.playKick(t(b), 0.95);
          if (b === 1 || b === 3) {
            this.playSnare(t(b), 0.8);
          }
          this.playHiHat(t(b), false, 0.4);
          this.playHiHat(t(b + 0.5), true, 0.75); // open hat upbeat sizzle
        }

        // Bass: Driving disco octave pulses (root low on beat, root high on upbeat)
        for (let b = 0; b < durationBeats; b++) {
          this.playBassNote(rootFreq, t(b), eighthSec * 0.8, 0.8);
          this.playBassNote(octaveFreq, t(b + 0.5), eighthSec * 0.8, 0.85);
        }
        break;
      }

      case 'bossa': {
        // Drums: Warm soft kick on 0 and 2, authentic syncopated Bossa Nova rimshot
        this.playKick(t(0), 0.7);
        playKickIf(2, 0.65);

        // Clave Rimshot: 0, 1.5, 2.5, 3.5
        this.playRimshot(t(0), 0.75);
        playRimshotIf(1.5, 0.7);
        playRimshotIf(2.5, 0.75);
        playRimshotIf(3.5, 0.7);

        // Gentle continuous shaker/hat 8ths
        for (let b = 0; b < durationBeats * 2; b++) {
          this.playHiHat(t(b * 0.5), false, 0.32);
        }

        // Bass: Smooth acoustic bassline (Root on 1, 5th on upbeat of 2, Root on 3, 5th on upbeat of 4)
        playBassIf(rootFreq, 0, secondsPerBeat * 1.1, 0.75);
        playBassIf(fifthFreq, 1.5, secondsPerBeat * 0.45, 0.7);
        playBassIf(rootFreq, 2.0, secondsPerBeat * 1.1, 0.75);
        playBassIf(fifthFreq, 3.5, secondsPerBeat * 0.45, 0.7);
        break;
      }

      case 'punk': {
        // Fast energetic driving rock
        for (let b = 0; b < durationBeats; b++) {
          this.playKick(t(b), 0.9);
          if (b === 1 || b === 3) {
            this.playSnare(t(b), 0.95);
          }
        }
        playKickIf(2.5, 0.8);

        // Fast open hats
        for (let b = 0; b < durationBeats * 2; b++) {
          this.playHiHat(t(b * 0.5), true, 0.55);
        }

        // Pounding 8th-note root bass
        for (let b = 0; b < durationBeats * 2; b++) {
          this.playBassNote(rootFreq, t(b * 0.5), eighthSec * 0.9, 0.85);
        }
        break;
      }

      case 'techno': {
        // Electronic 4-on-the-floor sub kick + offbeat open hat + rolling 16th bass
        for (let b = 0; b < durationBeats; b++) {
          this.playKick(t(b), 1.0);
          this.playHiHat(t(b + 0.5), true, 0.8); // open hat
          this.playHiHat(t(b + 0.25), false, 0.35);
          this.playHiHat(t(b + 0.75), false, 0.35);
        }

        // Rolling 16th sub-bass on offbeats
        const total16thSteps = durationBeats * 4;
        for (let s = 0; s < total16thSteps; s++) {
          if (s % 4 !== 0) {
            // Bass on the 16th notes between kicks
            this.playBassNote(rootFreq, t(s * 0.25), eighthSec * 0.45, 0.8);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // Play full Chord with optional octave offset
  public playChord(
    chord: ChordDefinition,
    instrument: InstrumentType = 'piano',
    duration = 1.4,
    octaveOffset = 0
  ) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Extract notes to play
      const notes = chord.notes && chord.notes.length > 0
        ? chord.notes
        : chord.noteNames.map(n => `${n}4`);

      // If guitar, add realistic strumming delay between strings (20-30ms)
      const strumDelay = instrument === 'guitar' ? 0.024 : 0.003;

      notes.forEach((noteStr, idx) => {
        const freq = this.noteToFreq(noteStr, octaveOffset);
        const startTime = now + idx * strumDelay;
        const noteDuration = Math.max(duration - idx * strumDelay, 0.4);

        if (instrument === 'guitar') {
          this.playGuitarNote(freq, startTime, noteDuration);
        } else {
          this.playPianoNote(freq, startTime, noteDuration);
        }
      });
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
        // Base octave 4
        const noteStr = `${note}4`;
        const freq = this.noteToFreq(noteStr, octaveOffset);
        const startTime = now + idx * noteDurationSec;

        if (instrument === 'guitar') {
          this.playGuitarNote(freq, startTime, noteDurationSec * 1.5, 0.6);
        } else {
          this.playPianoNote(freq, startTime, noteDurationSec * 1.5, 0.6);
        }
      });
    } catch (err) {
      console.warn('Scale audio error:', err);
    }
  }

  // Play chord according to specific rhythmic pattern
  public playChordWithPattern(
    chord: ChordDefinition,
    instrument: InstrumentType,
    totalDurationSec: number,
    octaveOffset = 0,
    pattern: ChordRhythmPattern = 'whole',
    bpm: number = 110
  ) {
    const secondsPerBeat = 60 / bpm;
    const notes = chord.notes && chord.notes.length > 0
      ? chord.notes
      : chord.noteNames.map(n => `${n}4`);

    const totalBeats = Math.max(1, Math.round(totalDurationSec / secondsPerBeat));

    switch (pattern) {
      case 'quarters': {
        // Quarter note strikes across the duration of the chord
        for (let b = 0; b < totalBeats; b++) {
          const timeoutId = window.setTimeout(() => {
            if (!this.isPlayingSequence && !this.isPlayingMelody) return;
            this.playChord(chord, instrument, secondsPerBeat * 0.85, octaveOffset);
          }, b * secondsPerBeat * 1000);
          this.sequenceTimeoutIds.push(timeoutId);
        }
        break;
      }

      case 'eighths': {
        // Eighth note pulses across the duration of the chord
        const eighthSec = secondsPerBeat / 2;
        const totalEighths = totalBeats * 2;
        for (let e = 0; e < totalEighths; e++) {
          const timeoutId = window.setTimeout(() => {
            if (!this.isPlayingSequence && !this.isPlayingMelody) return;
            this.playChord(chord, instrument, eighthSec * 0.75, octaveOffset);
          }, e * eighthSec * 1000);
          this.sequenceTimeoutIds.push(timeoutId);
        }
        break;
      }

      case 'syncopated': {
        // Syncopated Groove / Pop Pattern scaled to chord duration
        const syncopatedBeats: { start: number; dur: number }[] = [];
        if (totalBeats <= 2) {
          syncopatedBeats.push({ start: 0, dur: Math.min(1.0, totalBeats) });
          if (totalBeats > 1) {
            syncopatedBeats.push({ start: 1.0, dur: 0.9 });
          }
        } else if (totalBeats === 3) {
          syncopatedBeats.push({ start: 0, dur: 1.3 });
          syncopatedBeats.push({ start: 1.5, dur: 1.3 });
        } else {
          for (let m = 0; m < totalBeats; m += 4) {
            if (m < totalBeats) syncopatedBeats.push({ start: m, dur: 1.3 });
            if (m + 1.5 < totalBeats) syncopatedBeats.push({ start: m + 1.5, dur: 1.3 });
            if (m + 3.0 < totalBeats) syncopatedBeats.push({ start: m + 3.0, dur: 0.9 });
          }
        }

        syncopatedBeats.forEach(({ start, dur }) => {
          const timeoutId = window.setTimeout(() => {
            if (!this.isPlayingSequence && !this.isPlayingMelody) return;
            this.playChord(chord, instrument, dur * secondsPerBeat * 0.9, octaveOffset);
          }, start * secondsPerBeat * 1000);
          this.sequenceTimeoutIds.push(timeoutId);
        });
        break;
      }

      case 'arpeggio': {
        // Arpeggiates notes in chord consecutively (8th notes across chord duration)
        const eighthSec = secondsPerBeat / 2;
        const totalSteps = totalBeats * 2;
        for (let i = 0; i < totalSteps; i++) {
          const noteIndex = i % notes.length;
          const noteStr = notes[noteIndex];
          const timeoutId = window.setTimeout(() => {
            if (!this.isPlayingSequence && !this.isPlayingMelody) return;
            this.playSingleNote(noteStr, instrument, eighthSec * 1.8, 0.75, octaveOffset);
          }, i * eighthSec * 1000);
          this.sequenceTimeoutIds.push(timeoutId);
        }
        break;
      }

      case 'waltz': {
        // Waltz: Bass root on beat 1, higher chord triad on beats 2 & 3
        const rootNote = notes[0] || `${chord.root}3`;
        for (let m = 0; m < totalBeats; m += 3) {
          if (m < totalBeats) {
            const t1 = window.setTimeout(() => {
              if (!this.isPlayingSequence && !this.isPlayingMelody) return;
              this.playSingleNote(rootNote, instrument, secondsPerBeat * 0.9, 0.9, octaveOffset);
            }, m * secondsPerBeat * 1000);
            this.sequenceTimeoutIds.push(t1);
          }
          for (let b = 1; b < 3; b++) {
            if (m + b < totalBeats) {
              const tBeat = window.setTimeout(() => {
                if (!this.isPlayingSequence && !this.isPlayingMelody) return;
                this.playChord(chord, instrument, secondsPerBeat * 0.85, octaveOffset);
              }, (m + b) * secondsPerBeat * 1000);
              this.sequenceTimeoutIds.push(tBeat);
            }
          }
        }
        break;
      }

      case 'whole':
      default: {
        // 1 sustained chord across whole measure
        this.playChord(chord, instrument, totalDurationSec * 0.95, octaveOffset);
        break;
      }
    }
  }

  // Play timeline sequence with optional backing track
  public playSequence(
    items: TimelineChordItem[],
    bpm: number,
    instrument: InstrumentType,
    loop: boolean,
    onStep: (index: number) => void,
    onFinish: () => void,
    globalOctaveOffset = 0,
    backingStyle: BackingTrackStyle = 'none',
    backingVolume = 0.75
  ) {
    this.stopSequence();
    if (items.length === 0) return;

    this.isPlayingSequence = true;
    this.currentStepCallback = onStep;
    this.setBackingVolume(backingVolume);

    const secondsPerBeat = 60 / bpm;

    const scheduleTimeline = () => {
      let cumulativeTimeMs = 0;

      items.forEach((item, index) => {
        const durationSec = item.durationBeats * secondsPerBeat;
        const durationMs = durationSec * 1000;
        const chordOctave = (item.octaveOffset ?? 0) + globalOctaveOffset;
        const pattern = item.rhythmPattern || 'whole';

        const timeoutId = window.setTimeout(() => {
          if (!this.isPlayingSequence) return;
          if (this.currentStepCallback) {
            this.currentStepCallback(index);
          }
          this.playChordWithPattern(item.chord, instrument, durationSec, chordOctave, pattern, bpm);
          if (backingStyle && backingStyle !== 'none') {
            this.scheduleBackingForMeasure(this.getContext().currentTime, item.durationBeats, secondsPerBeat, item.chord, backingStyle);
          }
        }, cumulativeTimeMs);

        this.sequenceTimeoutIds.push(timeoutId);
        cumulativeTimeMs += durationMs;
      });

      // After sequence ends
      const endTimeoutId = window.setTimeout(() => {
        if (!this.isPlayingSequence) return;
        if (loop) {
          scheduleTimeline();
        } else {
          this.isPlayingSequence = false;
          this.stopBackingTrack();
          onFinish();
        }
      }, cumulativeTimeMs);

      this.sequenceTimeoutIds.push(endTimeoutId);
    };

    scheduleTimeline();
  }

  // Play a single note immediately
  public playSingleNote(
    noteStr: string,
    instrument: InstrumentType = 'piano',
    duration = 0.5,
    velocity = 0.75,
    octaveOffset = 0
  ) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freq = this.noteToFreq(noteStr, octaveOffset);

      if (instrument === 'guitar') {
        this.playGuitarNote(freq, now, duration, velocity);
      } else {
        this.playPianoNote(freq, now, duration, velocity);
      }
    } catch (err) {
      console.warn('Single note audio error:', err);
    }
  }

  // Play melody sequence solo
  public playMelody(
    notes: MelodyNote[],
    bpm: number,
    instrument: InstrumentType,
    onStep: (noteIndex: number | null) => void,
    onFinish: () => void,
    octaveOffset = 0
  ) {
    this.stopMelody();
    if (!notes || notes.length === 0) return;

    this.isPlayingMelody = true;
    const secondsPerBeat = 60 / bpm;

    notes.forEach((item, index) => {
      const startSec = item.startBeat * secondsPerBeat;
      const durationSec = Math.max(item.durationBeats * secondsPerBeat * 0.95, 0.15);
      const startMs = startSec * 1000;

      const timeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        onStep(index);
        this.playSingleNote(item.note, instrument, durationSec, 0.8, octaveOffset);
      }, startMs);

      this.melodyTimeoutIds.push(timeoutId);
    });

    const totalDurationMs = (notes[notes.length - 1].startBeat + notes[notes.length - 1].durationBeats) * secondsPerBeat * 1000;
    const endTimeoutId = window.setTimeout(() => {
      if (!this.isPlayingMelody) return;
      this.isPlayingMelody = false;
      onStep(null);
      onFinish();
    }, totalDurationMs + 100);

    this.melodyTimeoutIds.push(endTimeoutId);
  }

  // Play synchronized Melody + Chord progression accompaniment + Backing Track
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
    this.stopAll();
    if (chords.length === 0 && notes.length === 0) return;

    this.isPlayingMelody = true;
    this.isPlayingSequence = true;
    this.melodyStepCallback = onStep;
    this.setBackingVolume(backingVolume);

    const secondsPerBeat = 60 / bpm;

    // Schedule chord accompaniment
    let cumulativeChordTimeMs = 0;
    chords.forEach((chordItem, cIdx) => {
      const chordDurationSec = chordItem.durationBeats * secondsPerBeat;
      const chordDurationMs = chordDurationSec * 1000;
      const effectiveOctave = (chordItem.octaveOffset ?? 0) + chordOctaveOffset;

      const chordTimeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        if (this.melodyStepCallback) {
          this.melodyStepCallback(null, cIdx);
        }
        const pattern = chordItem.rhythmPattern || 'whole';
        this.playChordWithPattern(chordItem.chord, instrumentChord, chordDurationSec, effectiveOctave, pattern, bpm);
        if (backingStyle && backingStyle !== 'none') {
          this.scheduleBackingForMeasure(this.getContext().currentTime, chordItem.durationBeats, secondsPerBeat, chordItem.chord, backingStyle);
        }
      }, cumulativeChordTimeMs);

      this.melodyTimeoutIds.push(chordTimeoutId);
      cumulativeChordTimeMs += chordDurationMs;
    });

    // Schedule melody notes
    let maxMelodyEndMs = 0;
    notes.forEach((noteItem, nIdx) => {
      const noteStartSec = noteItem.startBeat * secondsPerBeat;
      const noteDurationSec = Math.max(noteItem.durationBeats * secondsPerBeat * 0.95, 0.15);
      const noteStartMs = noteStartSec * 1000;
      const noteEndMs = (noteItem.startBeat + noteItem.durationBeats) * secondsPerBeat * 1000;
      if (noteEndMs > maxMelodyEndMs) maxMelodyEndMs = noteEndMs;

      const noteTimeoutId = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        if (this.melodyStepCallback) {
          this.melodyStepCallback(nIdx, noteItem.chordIndex);
        }
        this.playSingleNote(noteItem.note, instrumentMelody, noteDurationSec, 0.85, melodyOctaveOffset);
      }, noteStartMs);

      this.melodyTimeoutIds.push(noteTimeoutId);
    });

    // Determine completion time
    const overallEndMs = Math.max(cumulativeChordTimeMs, maxMelodyEndMs) + 200;
    const finalTimeoutId = window.setTimeout(() => {
      this.isPlayingMelody = false;
      this.isPlayingSequence = false;
      this.stopBackingTrack();
      if (this.melodyStepCallback) {
        this.melodyStepCallback(null, null);
      }
      onFinish();
    }, overallEndMs);

    this.melodyTimeoutIds.push(finalTimeoutId);
  }

  // Stop backing track audio immediately
  public stopBackingTrack() {
    try {
      if (this.backingGainNode && this.ctx) {
        this.backingGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.backingGainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        const savedVolume = this.backingVolume;
        setTimeout(() => {
          if (this.backingGainNode && this.ctx) {
            this.backingGainNode.gain.setValueAtTime(savedVolume, this.ctx.currentTime);
          }
        }, 100);
      }
      this.activeBackingOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeBackingOscillators = [];
    } catch {
      // ignore
    }
  }

  // Stop melody playback
  public stopMelody() {
    this.isPlayingMelody = false;
    this.melodyTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.melodyTimeoutIds = [];
    this.stopBackingTrack();
    if (this.melodyStepCallback) {
      this.melodyStepCallback(null, null);
    }
  }

  // Stop sequence playback
  public stopSequence() {
    this.isPlayingSequence = false;
    this.sequenceTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.sequenceTimeoutIds = [];
    this.stopBackingTrack();
  }

  // Stop all active playback
  public stopAll() {
    this.stopSequence();
    this.stopMelody();
    this.stopBackingTrack();
  }

  public isRunning(): boolean {
    return this.isPlayingSequence;
  }

  public isMelodyActive(): boolean {
    return this.isPlayingMelody;
  }
}

export const audioEngine = new WebAudioEngine();

import { ChordDefinition, InstrumentType, TimelineChordItem } from '../types';
import { NOTE_TO_MIDI } from '../data/musicTheory';

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlayingSequence = false;
  private sequenceTimeoutIds: number[] = [];
  private currentStepCallback: ((index: number) => void) | null = null;

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

  // Play timeline sequence
  public playSequence(
    items: TimelineChordItem[],
    bpm: number,
    instrument: InstrumentType,
    loop: boolean,
    onStep: (index: number) => void,
    onFinish: () => void,
    globalOctaveOffset = 0
  ) {
    this.stopSequence();
    if (items.length === 0) return;

    this.isPlayingSequence = true;
    this.currentStepCallback = onStep;

    const secondsPerBeat = 60 / bpm;

    const scheduleTimeline = () => {
      let cumulativeTimeMs = 0;

      items.forEach((item, index) => {
        const durationSec = item.durationBeats * secondsPerBeat;
        const durationMs = durationSec * 1000;
        const chordOctave = (item.octaveOffset ?? 0) + globalOctaveOffset;

        const timeoutId = window.setTimeout(() => {
          if (!this.isPlayingSequence) return;
          if (this.currentStepCallback) {
            this.currentStepCallback(index);
          }
          this.playChord(item.chord, instrument, durationSec * 0.95, chordOctave);
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
          onFinish();
        }
      }, cumulativeTimeMs);

      this.sequenceTimeoutIds.push(endTimeoutId);
    };

    scheduleTimeline();
  }

  // Stop sequence playback
  public stopSequence() {
    this.isPlayingSequence = false;
    this.sequenceTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.sequenceTimeoutIds = [];
  }

  public isRunning(): boolean {
    return this.isPlayingSequence;
  }
}

export const audioEngine = new WebAudioEngine();

import { TimelineChordItem, ChordDefinition, MelodyNote, InstrumentType, BackingTrackStyle } from '../types';
import { NOTE_TO_MIDI } from '../data/musicTheory';

/**
 * Standard MIDI File (SMF Type 0 or Type 1) Generator in Pure TypeScript.
 * Generates valid .mid binary files without any external dependencies,
 * compatible with any DAW (Ableton, FL Studio, Logic, Reaper, GarageBand, Cubase, etc.)
 * or MIDI players.
 */

// Helper to write Big-Endian numbers
function writeUint16(val: number): number[] {
  return [(val >> 8) & 0xff, val & 0xff];
}

function writeUint32(val: number): number[] {
  return [
    (val >> 24) & 0xff,
    (val >> 16) & 0xff,
    (val >> 8) & 0xff,
    val & 0xff,
  ];
}

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/**
 * Encodes variable-length quantity (VLQ) used for MIDI delta times
 */
function writeVarLen(val: number): number[] {
  let buffer = val & 0x7f;
  const bytes: number[] = [];
  let temp = val;

  while ((temp >>= 7)) {
    buffer <<= 8;
    buffer |= (temp & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}

export interface MidiEvent {
  tick: number; // Absolute tick in pulses per quarter note (PPQ)
  type: 'noteOn' | 'noteOff' | 'meta';
  channel: number; // 0-15
  note?: number; // 0-127
  velocity?: number; // 0-127
  metaType?: number;
  metaData?: number[];
}

export interface ExportMidiOptions {
  timeline: TimelineChordItem[];
  melodyNotes?: MelodyNote[] | null;
  tempoBpm: number;
  instrument?: InstrumentType;
  songTitle?: string;
  includeChords?: boolean;
  includeMelody?: boolean;
  includeBackingTrack?: boolean;
  backingStyle?: BackingTrackStyle;
}

/**
 * Resolves a note name/string (e.g. "C4", "G#3", "Eb5") to its MIDI note number (0-127).
 * Also supports octave offsets.
 */
export function noteNameToMidiNumber(noteStr: string, octaveOffset: number = 0): number {
  if (NOTE_TO_MIDI[noteStr] !== undefined) {
    return Math.max(0, Math.min(127, NOTE_TO_MIDI[noteStr] + octaveOffset * 12));
  }

  // Fallback parser if not directly in map (e.g., C2, F#6)
  const match = noteStr.match(/^([A-G][b#]?)(-?\d+)$/);
  if (match) {
    const name = match[1];
    const octave = parseInt(match[2], 10) + octaveOffset;
    const noteMap: Record<string, number> = {
      C: 0, 'C#': 1, Db: 1,
      D: 2, 'D#': 3, Eb: 3,
      E: 4,
      F: 5, 'F#': 6, Gb: 6,
      G: 7, 'G#': 8, Ab: 8,
      A: 9, 'A#': 10, Bb: 10,
      B: 11,
    };
    const semitone = noteMap[name] ?? 0;
    // MIDI: C4 is 60 -> (octave + 1) * 12 + semitone
    const midi = (octave + 1) * 12 + semitone;
    return Math.max(0, Math.min(127, midi));
  }

  return 60; // Default Middle C
}

/**
 * Builds a MIDI track byte array from an array of sorted absolute MIDI events
 */
function createTrackChunk(trackName: string, events: MidiEvent[], ppq: number): number[] {
  const trackBytes: number[] = [];

  // Track name meta event at tick 0
  if (trackName) {
    const nameBytes = stringToBytes(trackName);
    trackBytes.push(...writeVarLen(0));
    trackBytes.push(0xff, 0x03, ...writeVarLen(nameBytes.length), ...nameBytes);
  }

  // Sort events strictly by tick (and noteOff before noteOn if same tick)
  const sorted = [...events].sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'noteOff' && b.type === 'noteOn') return -1;
    if (a.type === 'noteOn' && b.type === 'noteOff') return 1;
    return 0;
  });

  let lastTick = 0;

  for (const ev of sorted) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;

    trackBytes.push(...writeVarLen(delta));

    if (ev.type === 'noteOn') {
      const status = 0x90 | (ev.channel & 0x0f);
      trackBytes.push(status, (ev.note ?? 60) & 0x7f, (ev.velocity ?? 90) & 0x7f);
    } else if (ev.type === 'noteOff') {
      const status = 0x80 | (ev.channel & 0x0f);
      trackBytes.push(status, (ev.note ?? 60) & 0x7f, 0x00);
    } else if (ev.type === 'meta' && ev.metaType !== undefined && ev.metaData) {
      trackBytes.push(0xff, ev.metaType, ...writeVarLen(ev.metaData.length), ...ev.metaData);
    }
  }

  // End of Track Meta Event: 00 FF 2F 00
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Return MTrk chunk: "MTrk" + 4-byte length + track data
  return [
    ...stringToBytes('MTrk'),
    ...writeUint32(trackBytes.length),
    ...trackBytes,
  ];
}

/**
 * Creates a complete Standard MIDI File (Type 1 multi-track) as a Uint8Array
 */
export function generateMidiFile(options: ExportMidiOptions): Uint8Array {
  const {
    timeline,
    melodyNotes,
    tempoBpm,
    songTitle = 'Harmoniq Progression',
    includeChords = true,
    includeMelody = true,
    includeBackingTrack = false,
    backingStyle = 'none',
  } = options;

  const ppq = 480; // Pulses Per Quarter Note (ticks per beat)
  const tracks: number[][] = [];

  // 1. Conductor Track (Tempo, Time Signature, Track Name)
  const conductorBytes: number[] = [];
  // Track Name
  const conductorName = stringToBytes(songTitle);
  conductorBytes.push(...writeVarLen(0));
  conductorBytes.push(0xff, 0x03, ...writeVarLen(conductorName.length), ...conductorName);

  // Time Signature: 4/4 (numerator: 4, denominator: 2^2=4, clocks per click: 24, 32nd notes per 24 clocks: 8)
  conductorBytes.push(...writeVarLen(0));
  conductorBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // Set Tempo Meta Event (microseconds per quarter note = 60,000,000 / BPM)
  const microsecondsPerBeat = Math.round(60000000 / Math.max(30, Math.min(300, tempoBpm)));
  const tempoBytes = [
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff,
  ];
  conductorBytes.push(...writeVarLen(0));
  conductorBytes.push(0xff, 0x51, 0x03, ...tempoBytes);

  // End of Conductor Track
  conductorBytes.push(0x00, 0xff, 0x2f, 0x00);

  tracks.push([
    ...stringToBytes('MTrk'),
    ...writeUint32(conductorBytes.length),
    ...conductorBytes,
  ]);

  // 2. Chords Track (Channel 0: Acoustic Grand Piano or Guitar)
  if (includeChords && timeline.length > 0) {
    const chordEvents: MidiEvent[] = [];
    let currentBeat = 0;

    for (let i = 0; i < timeline.length; i++) {
      const item = timeline[i];
      const durationBeats = item.durationBeats || 4;
      const startTick = Math.round(currentBeat * ppq);
      const octaveOffset = item.octaveOffset ?? 0;
      const pattern = item.rhythmPattern || 'whole';

      // Extract notes from chord definition
      const chordNotes = item.chord.notes && item.chord.notes.length > 0
        ? item.chord.notes
        : item.chord.piano?.keys || [`${item.chord.root}4`];

      // Insert marker/cue for chord name
      const chordNameBytes = stringToBytes(item.chord.name || item.chord.symbol);
      chordEvents.push({
        tick: startTick,
        type: 'meta',
        channel: 0,
        metaType: 0x01, // Text marker
        metaData: chordNameBytes,
      });

      const noteMidiNumbers = chordNotes.map((n) => noteNameToMidiNumber(n, octaveOffset));

      if (pattern === 'quarters') {
        // 4 strikes per 4/4 measure (each beat)
        for (let b = 0; b < durationBeats; b++) {
          const strikeTick = Math.round((currentBeat + b) * ppq);
          const strikeEnd = Math.round((currentBeat + b + 0.85) * ppq);
          for (const midiNum of noteMidiNumbers) {
            chordEvents.push({ tick: strikeTick, type: 'noteOn', channel: 0, note: midiNum, velocity: 84 });
            chordEvents.push({ tick: strikeEnd, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
          }
        }
      } else if (pattern === 'eighths') {
        // 8 strikes per 4/4 measure (each 0.5 beat)
        const totalEighths = durationBeats * 2;
        for (let e = 0; e < totalEighths; e++) {
          const strikeTick = Math.round((currentBeat + e * 0.5) * ppq);
          const strikeEnd = Math.round((currentBeat + e * 0.5 + 0.4) * ppq);
          for (const midiNum of noteMidiNumbers) {
            chordEvents.push({ tick: strikeTick, type: 'noteOn', channel: 0, note: midiNum, velocity: 80 });
            chordEvents.push({ tick: strikeEnd, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
          }
        }
      } else if (pattern === 'syncopated') {
        // Syncopated Groove: Beat 0 (dur 1.3), Beat 1.5 (dur 1.3), Beat 3.0 (dur 0.9)
        const strikes = [
          { beat: 0, dur: 1.3 },
          { beat: 1.5, dur: 1.3 },
          { beat: 3.0, dur: 0.9 },
        ];
        strikes.forEach(({ beat, dur }) => {
          const strikeTick = Math.round((currentBeat + beat) * ppq);
          const strikeEnd = Math.round((currentBeat + beat + dur) * ppq);
          for (const midiNum of noteMidiNumbers) {
            chordEvents.push({ tick: strikeTick, type: 'noteOn', channel: 0, note: midiNum, velocity: 86 });
            chordEvents.push({ tick: strikeEnd, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
          }
        });
      } else if (pattern === 'arpeggio') {
        // 8 notes arpeggiated across measure
        const totalSteps = durationBeats * 2;
        for (let s = 0; s < totalSteps; s++) {
          const noteIdx = s % noteMidiNumbers.length;
          const midiNum = noteMidiNumbers[noteIdx];
          const strikeTick = Math.round((currentBeat + s * 0.5) * ppq);
          const strikeEnd = Math.round((currentBeat + s * 0.5 + 0.48) * ppq);
          chordEvents.push({ tick: strikeTick, type: 'noteOn', channel: 0, note: midiNum, velocity: 82 });
          chordEvents.push({ tick: strikeEnd, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
        }
      } else if (pattern === 'waltz') {
        // Beat 1: Bass note
        const bassMidi = noteMidiNumbers[0];
        const t1 = Math.round(currentBeat * ppq);
        const t1End = Math.round((currentBeat + 0.9) * ppq);
        chordEvents.push({ tick: t1, type: 'noteOn', channel: 0, note: bassMidi, velocity: 90 });
        chordEvents.push({ tick: t1End, type: 'noteOff', channel: 0, note: bassMidi, velocity: 0 });

        // Beat 2 & 3: Strum
        [1, 2].forEach((b) => {
          const tBeat = Math.round((currentBeat + b) * ppq);
          const tBeatEnd = Math.round((currentBeat + b + 0.85) * ppq);
          for (const midiNum of noteMidiNumbers) {
            chordEvents.push({ tick: tBeat, type: 'noteOn', channel: 0, note: midiNum, velocity: 80 });
            chordEvents.push({ tick: tBeatEnd, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
          }
        });
      } else {
        // Whole note (default): 1 sustained chord
        const durationTicks = Math.round((durationBeats - 0.05) * ppq);
        const endTick = startTick + Math.max(ppq / 2, durationTicks);
        for (const midiNum of noteMidiNumbers) {
          chordEvents.push({ tick: startTick, type: 'noteOn', channel: 0, note: midiNum, velocity: 86 });
          chordEvents.push({ tick: endTick, type: 'noteOff', channel: 0, note: midiNum, velocity: 0 });
        }
      }

      currentBeat += durationBeats;
    }

    const chordTrackChunk = createTrackChunk('Harmonia (Acordes)', chordEvents, ppq);
    tracks.push(chordTrackChunk);
  }

  // 3. Melody Track (Channel 1: Lead Instrument)
  if (includeMelody && melodyNotes && melodyNotes.length > 0) {
    const melodyEvents: MidiEvent[] = [];

    for (const note of melodyNotes) {
      const startTick = Math.round(note.startBeat * ppq);
      const noteDurationTicks = Math.max(
        Math.round(ppq * 0.25),
        Math.round((note.durationBeats * 0.9) * ppq)
      );
      const endTick = startTick + noteDurationTicks;
      const midiNum = note.midi ?? noteNameToMidiNumber(note.note, 0);

      // Add lyric / degree text metadata for educational / DAW inspection
      if (note.degree) {
        const degreeBytes = stringToBytes(`${note.noteName} (${note.degree})`);
        melodyEvents.push({
          tick: startTick,
          type: 'meta',
          channel: 1,
          metaType: 0x05, // Lyric meta event
          metaData: degreeBytes,
        });
      }

      melodyEvents.push({
        tick: startTick,
        type: 'noteOn',
        channel: 1,
        note: midiNum,
        velocity: 100, // Melody slightly louder than chords
      });
      melodyEvents.push({
        tick: endTick,
        type: 'noteOff',
        channel: 1,
        note: midiNum,
        velocity: 0,
      });
    }

    const melodyTrackChunk = createTrackChunk('Linha Melódica (Lead)', melodyEvents, ppq);
    tracks.push(melodyTrackChunk);
  }

  // 4. Bass & Drums Backing Tracks (Channel 2: Bass, Channel 9: GM Drums)
  if (includeBackingTrack && backingStyle && backingStyle !== 'none' && timeline.length > 0) {
    const bassEvents: MidiEvent[] = [];
    const drumEvents: MidiEvent[] = [];
    let currentBeat = 0;

    for (let i = 0; i < timeline.length; i++) {
      const item = timeline[i];
      const durationBeats = item.durationBeats || 4;
      const bassNoteName = item.chord.bassNote || item.chord.root;

      // Bass octave 1 or 2 (MIDI range ~36 to 48: C2 is 36, C3 is 48)
      let rootMidi = noteNameToMidiNumber(`${bassNoteName}2`, 0);
      while (rootMidi > 48) rootMidi -= 12;
      while (rootMidi < 28) rootMidi += 12;

      const fifthMidi = rootMidi + 7;
      const isMinor = item.chord.quality.includes('minor') || item.chord.quality.includes('m') || item.chord.quality === 'dim';
      const thirdMidi = rootMidi + (isMinor ? 3 : 4);
      const octaveMidi = rootMidi + 12;

      // Helper to push bass note
      const addBass = (beatOffset: number, durBeats: number, midi: number, vel = 90) => {
        const start = Math.round((currentBeat + beatOffset) * ppq);
        const end = Math.round((currentBeat + beatOffset + durBeats * 0.9) * ppq);
        bassEvents.push({ tick: start, type: 'noteOn', channel: 2, note: midi, velocity: vel });
        bassEvents.push({ tick: end, type: 'noteOff', channel: 2, note: midi, velocity: 0 });
      };

      // Helper to push drum hit (Channel 9 = General MIDI standard drum channel)
      const addDrum = (beatOffset: number, note: number, vel = 95) => {
        const start = Math.round((currentBeat + beatOffset) * ppq);
        const end = start + Math.round(ppq * 0.25);
        drumEvents.push({ tick: start, type: 'noteOn', channel: 9, note, velocity: vel });
        drumEvents.push({ tick: end, type: 'noteOff', channel: 9, note, velocity: 0 });
      };

      // GM Drum Map constants:
      const KICK = 36;
      const SNARE = 38;
      const CLOSED_HAT = 42;
      const OPEN_HAT = 46;
      const RIMSHOT = 37;

      switch (backingStyle) {
        case 'rock': {
          addDrum(0, KICK, 105);
          addDrum(1, SNARE, 100);
          addDrum(2, KICK, 100);
          addDrum(2.5, KICK, 85);
          addDrum(3, SNARE, 100);
          for (let b = 0; b < durationBeats * 2; b++) {
            addDrum(b * 0.5, CLOSED_HAT, b % 2 === 0 ? 80 : 65);
          }
          for (let b = 0; b < 7; b++) {
            addBass(b * 0.5, 0.45, rootMidi, 90);
          }
          addBass(3.5, 0.45, fifthMidi, 95);
          break;
        }
        case 'funk': {
          addDrum(0, KICK, 110);
          addDrum(1, SNARE, 100);
          addDrum(1.75, KICK, 90);
          addDrum(2.5, KICK, 100);
          addDrum(2.75, SNARE, 50); // ghost
          addDrum(3, SNARE, 105);
          for (let s = 0; s < durationBeats * 4; s++) {
            const beatPos = s * 0.25;
            const isOpen = beatPos === 1.5 || beatPos === 3.5;
            addDrum(beatPos, isOpen ? OPEN_HAT : CLOSED_HAT, isOpen ? 90 : 65);
          }
          addBass(0, 0.4, rootMidi, 100);
          addBass(0.75, 0.25, octaveMidi, 85);
          addBass(1.5, 0.5, rootMidi, 95);
          addBass(2.5, 0.4, fifthMidi, 95);
          addBass(3.25, 0.3, rootMidi, 85);
          break;
        }
        case 'reggae': {
          addDrum(2, KICK, 110);
          addDrum(2, RIMSHOT, 100);
          for (let b = 0; b < durationBeats; b++) {
            addDrum(b + 0.5, CLOSED_HAT, 85);
          }
          addBass(0, 0.8, rootMidi, 100);
          addBass(1.0, 0.7, rootMidi, 90);
          addBass(3.0, 0.8, fifthMidi, 95);
          break;
        }
        case 'shuffle': {
          addDrum(0, KICK, 100);
          addDrum(1, SNARE, 100);
          addDrum(2, KICK, 100);
          addDrum(3, SNARE, 100);
          for (let b = 0; b < durationBeats; b++) {
            addDrum(b, CLOSED_HAT, 80);
            addDrum(b + 0.667, CLOSED_HAT, 65);
          }
          const sixthMidi = rootMidi + 9;
          addBass(0, 0.9, rootMidi, 95);
          addBass(1, 0.9, thirdMidi, 90);
          addBass(2, 0.9, fifthMidi, 90);
          addBass(3, 0.9, sixthMidi, 90);
          break;
        }
        case 'disco': {
          for (let b = 0; b < durationBeats; b++) {
            addDrum(b, KICK, 110);
            if (b === 1 || b === 3) addDrum(b, SNARE, 95);
            addDrum(b, CLOSED_HAT, 60);
            addDrum(b + 0.5, OPEN_HAT, 90);
            addBass(b, 0.45, rootMidi, 95);
            addBass(b + 0.5, 0.45, octaveMidi, 100);
          }
          break;
        }
        case 'bossa': {
          addDrum(0, KICK, 80);
          addDrum(2, KICK, 75);
          addDrum(0, RIMSHOT, 90);
          addDrum(1.5, RIMSHOT, 85);
          addDrum(2.5, RIMSHOT, 90);
          addDrum(3.5, RIMSHOT, 85);
          for (let b = 0; b < durationBeats * 2; b++) {
            addDrum(b * 0.5, CLOSED_HAT, 55);
          }
          addBass(0, 1.2, rootMidi, 85);
          addBass(1.5, 0.5, fifthMidi, 80);
          addBass(2.0, 1.2, rootMidi, 85);
          addBass(3.5, 0.5, fifthMidi, 80);
          break;
        }
        case 'punk': {
          for (let b = 0; b < durationBeats; b++) {
            addDrum(b, KICK, 105);
            if (b === 1 || b === 3) addDrum(b, SNARE, 110);
          }
          addDrum(2.5, KICK, 95);
          for (let b = 0; b < durationBeats * 2; b++) {
            addDrum(b * 0.5, OPEN_HAT, 85);
            addBass(b * 0.5, 0.48, rootMidi, 100);
          }
          break;
        }
        case 'techno': {
          for (let b = 0; b < durationBeats; b++) {
            addDrum(b, KICK, 115);
            addDrum(b + 0.5, OPEN_HAT, 95);
            addDrum(b + 0.25, CLOSED_HAT, 55);
            addDrum(b + 0.75, CLOSED_HAT, 55);
          }
          for (let s = 0; s < durationBeats * 4; s++) {
            if (s % 4 !== 0) {
              addBass(s * 0.25, 0.22, rootMidi, 95);
            }
          }
          break;
        }
        default:
          break;
      }

      currentBeat += durationBeats;
    }

    if (bassEvents.length > 0) {
      tracks.push(createTrackChunk('Contrabaixo (Bass)', bassEvents, ppq));
    }
    if (drumEvents.length > 0) {
      tracks.push(createTrackChunk('Bateria (Drums GM)', drumEvents, ppq));
    }
  }

  // SMF Header Chunk: "MThd" + length 6 + format (1) + numTracks + ppq (ticks per quarter)
  const header: number[] = [
    ...stringToBytes('MThd'),
    ...writeUint32(6),
    ...writeUint16(1), // Type 1: Multi-track synchronous
    ...writeUint16(tracks.length),
    ...writeUint16(ppq),
  ];

  // Combine all chunks into one flat array
  const totalLength = header.length + tracks.reduce((acc, t) => acc + t.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  result.set(header, offset);
  offset += header.length;

  for (const track of tracks) {
    result.set(track, offset);
    offset += track.length;
  }

  return result;
}

/**
 * Triggers a file download in the browser with the generated MIDI data
 */
export function downloadMidiFile(
  options: ExportMidiOptions,
  filename: string = 'harmoniq-progressao.mid'
): void {
  const midiBytes = generateMidiFile(options);
  const blob = new Blob([midiBytes], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Sanitize filename
  let cleanName = filename.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!cleanName.endsWith('.mid')) {
    cleanName += '.mid';
  }

  link.href = url;
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

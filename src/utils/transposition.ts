import { ChordDefinition, TimelineChordItem, SavedMelodyConfig, MelodyNote } from '../types';
import { CHORD_DATABASE } from '../data/musicTheory';
import { NOTE_TO_SEMITONE, getSemitone } from './melodyGenerator';
import { findGuitarVoicingForInversion } from './chordInversions';

// Chromatic scale sharp and flat spelling tables
export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Standard circle-of-fifths / popular harmonic enharmonic preference
// Semitones: 0=C, 1=Db/C#, 2=D, 3=Eb, 4=E, 5=F, 6=F#, 7=G, 8=Ab, 9=A, 10=Bb, 11=B
export const PREFERRED_ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Transpose a single note name (e.g. "C", "F#", "Eb") by a given number of semitones
 */
export function transposeNoteName(
  noteName: string,
  deltaSemitones: number,
  preferFlats?: boolean
): string {
  const currentSt = getSemitone(noteName);
  const targetSt = ((currentSt + deltaSemitones) % 12 + 12) % 12;

  if (preferFlats !== undefined) {
    return preferFlats ? FLAT_NAMES[targetSt] : SHARP_NAMES[targetSt];
  }

  // Check if original note used flats or sharps to preserve context
  const originalHadFlat = noteName.includes('b');
  const originalHadSharp = noteName.includes('#');

  if (originalHadFlat && !originalHadSharp) {
    return FLAT_NAMES[targetSt];
  }
  if (originalHadSharp && !originalHadFlat) {
    return SHARP_NAMES[targetSt];
  }

  return PREFERRED_ROOT_NAMES[targetSt];
}

/**
 * Transpose an absolute pitch string with octave (e.g. "C4", "G#3", "Eb5") by delta semitones
 */
export function transposePitch(
  pitchStr: string,
  deltaSemitones: number,
  preferFlats?: boolean
): string {
  const match = pitchStr.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return pitchStr;

  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_TO_SEMITONE[noteName] ?? 0;

  // Calculate absolute MIDI note number (C4 is 60 -> (4 + 1) * 12 + 0 = 60)
  const currentMidi = (octave + 1) * 12 + semitone;
  const newMidi = Math.max(12, Math.min(108, currentMidi + deltaSemitones));

  const newOctave = Math.floor(newMidi / 12) - 1;
  const newSemitone = ((newMidi % 12) + 12) % 12;

  const newNoteName = preferFlats !== undefined
    ? (preferFlats ? FLAT_NAMES[newSemitone] : SHARP_NAMES[newSemitone])
    : (noteName.includes('b') ? FLAT_NAMES[newSemitone] : (noteName.includes('#') ? SHARP_NAMES[newSemitone] : PREFERRED_ROOT_NAMES[newSemitone]));

  return `${newNoteName}${newOctave}`;
}

/**
 * Guitar open string tuning semitones (String 6: E2 to String 1: E4)
 */
const GUITAR_OPEN_ST = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

/**
 * Transposes guitar fret diagram by delta semitones
 */
function transposeGuitarVoicing(
  baseGuitar: ChordDefinition['guitar'],
  deltaSemitones: number,
  chordNotes: string[],
  bassNote: string
): ChordDefinition['guitar'] {
  const newBaseFret = Math.max(1, Math.min(12, baseGuitar.baseFret + deltaSemitones));

  // If simple shift fits on guitar neck
  const shiftedFrets = baseGuitar.frets.map((fret) => {
    if (fret < 0) return -1;
    const shifted = fret + deltaSemitones;
    return shifted >= 0 && shifted <= 15 ? shifted : fret;
  });

  // Calculate lowest fret above 0 to set baseFret accurately
  const activeFrets = shiftedFrets.filter((f) => f > 0);
  const minActiveFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const calculatedBase = minActiveFret > 3 ? minActiveFret : 1;

  const baseVoicing: ChordDefinition['guitar'] = {
    frets: shiftedFrets,
    fingers: baseGuitar.fingers ? [...baseGuitar.fingers] : [null, null, null, null, null, null],
    baseFret: calculatedBase,
    barre: baseGuitar.barre
      ? {
          fret: Math.max(1, baseGuitar.barre.fret + deltaSemitones),
          fromString: baseGuitar.barre.fromString,
          toString: baseGuitar.barre.toString,
        }
      : undefined,
  };

  // If an inverted bass note is needed, ensure bass voicing is sound
  return findGuitarVoicingForInversion(baseVoicing, bassNote, chordNotes);
}

/**
 * Transpose a single ChordDefinition by delta semitones while preserving quality,
 * voicings, inversions and harmonic integrity.
 */
export function transposeChord(
  chord: ChordDefinition,
  deltaSemitones: number,
  preferFlats?: boolean
): ChordDefinition {
  if (deltaSemitones === 0) return chord;

  const originalHadFlat = chord.root.includes('b') || chord.symbol.includes('b');
  const originalHadSharp = chord.root.includes('#') || chord.symbol.includes('#');

  const useFlats = preferFlats !== undefined
    ? preferFlats
    : (originalHadFlat && !originalHadSharp ? true : false);

  const newRoot = transposeNoteName(chord.root, deltaSemitones, useFlats);

  // Transpose bass note if chord is inverted (e.g. C/E -> D/F#)
  const isCurrentlyInverted = Boolean(chord.bassNote && chord.bassNote !== chord.root);
  const newBassNote = isCurrentlyInverted && chord.bassNote
    ? transposeNoteName(chord.bassNote, deltaSemitones, useFlats)
    : newRoot;

  // Reconstruct quality symbol suffix (e.g. "m", "7", "maj7", "add9", "5", "sus4")
  let qualitySuffix = '';
  switch (chord.quality) {
    case 'minor': qualitySuffix = 'm'; break;
    case '7': qualitySuffix = '7'; break;
    case 'maj7': qualitySuffix = 'maj7'; break;
    case 'm7': qualitySuffix = 'm7'; break;
    case 'sus2': qualitySuffix = 'sus2'; break;
    case 'sus4': qualitySuffix = 'sus4'; break;
    case 'add9': qualitySuffix = 'add9'; break;
    case 'dim': qualitySuffix = 'dim'; break;
    case 'aug': qualitySuffix = 'aug'; break;
    case '5': qualitySuffix = '5'; break;
    case 'major':
    default:
      qualitySuffix = '';
      break;
  }

  const baseSymbol = `${newRoot}${qualitySuffix}`;
  const finalSymbol = isCurrentlyInverted ? `${baseSymbol}/${newBassNote}` : baseSymbol;

  // 1. Check if the non-inverted chord exists directly in the pre-defined database
  const directDbChord = CHORD_DATABASE[baseSymbol];

  if (directDbChord) {
    if (!isCurrentlyInverted) {
      return {
        ...directDbChord,
        degree: chord.degree, // maintain original Roman numeral scale degree
      };
    } else {
      // Inverted version of a known database chord
      const invertedVoicing = findGuitarVoicingForInversion(directDbChord.guitar, newBassNote, directDbChord.notes);
      const invertedPianoKeys = [
        `${newBassNote}3`,
        ...directDbChord.piano.keys.filter((k) => !k.startsWith(newBassNote)),
      ];

      return {
        ...directDbChord,
        id: finalSymbol,
        name: `${finalSymbol} (${newRoot} com baixo em ${newBassNote})`,
        symbol: finalSymbol,
        bassNote: newBassNote,
        inversion: chord.inversion,
        guitar: invertedVoicing,
        piano: {
          keys: invertedPianoKeys,
          rootKey: directDbChord.piano.rootKey,
        },
        degree: chord.degree,
      };
    }
  }

  // 2. Transpose dynamically for chords not in static database (e.g. C#m, Abmaj7, etc.)
  const newNotes = (chord.notes || []).map((n) => transposePitch(n, deltaSemitones, useFlats));
  const newNoteNames = (chord.noteNames || []).map((n) => transposeNoteName(n, deltaSemitones, useFlats));

  const newGuitar = transposeGuitarVoicing(chord.guitar, deltaSemitones, newNotes, newBassNote);

  const newPianoKeys = (chord.piano?.keys || []).map((k) => transposePitch(k, deltaSemitones, useFlats));
  const newPianoRoot = chord.piano?.rootKey
    ? transposePitch(chord.piano.rootKey, deltaSemitones, useFlats)
    : `${newRoot}4`;

  const newScaleNotes = (chord.scale?.notes || []).map((n) => transposeNoteName(n, deltaSemitones, useFlats));
  const newScaleName = `${newRoot} ${chord.scale?.mode || 'Maior'}`;

  return {
    id: finalSymbol,
    name: `${finalSymbol}${isCurrentlyInverted ? ` (${newRoot} com baixo em ${newBassNote})` : ''}`,
    root: newRoot,
    quality: chord.quality,
    symbol: finalSymbol,
    bassNote: isCurrentlyInverted ? newBassNote : undefined,
    inversion: chord.inversion,
    degree: chord.degree,
    notes: newNotes,
    noteNames: newNoteNames,
    guitar: newGuitar,
    piano: {
      keys: newPianoKeys,
      rootKey: newPianoRoot,
    },
    scale: {
      name: newScaleName,
      mode: chord.scale?.mode || 'Jônio',
      notes: newScaleNotes,
      description: chord.scale?.description || `Acorde transposto para a tonalidade de ${newRoot}.`,
      soloingTips: `Improvise utilizando a escala de ${newRoot} (${chord.scale?.mode || 'Pentatônica'}).`,
    },
  };
}

/**
 * Transpose an entire timeline sequence of chords by deltaSemitones
 */
export function transposeTimeline(
  timeline: TimelineChordItem[],
  deltaSemitones: number
): TimelineChordItem[] {
  if (deltaSemitones === 0) return timeline;

  return timeline.map((item) => ({
    ...item,
    chord: transposeChord(item.chord, deltaSemitones),
  }));
}

/**
 * Transpose all notes of a SavedMelodyConfig by deltaSemitones to match the transposed chords
 */
export function transposeMelody(
  melody: SavedMelodyConfig,
  deltaSemitones: number
): SavedMelodyConfig {
  if (deltaSemitones === 0) return melody;

  const transposedNotes: MelodyNote[] = melody.notes.map((note) => {
    const newPitch = transposePitch(note.note, deltaSemitones);
    const newNoteName = transposeNoteName(note.noteName, deltaSemitones);
    const newMidi = Math.max(12, Math.min(108, note.midi + deltaSemitones));
    const newOctave = Math.floor(newMidi / 12) - 1;

    return {
      ...note,
      note: newPitch,
      noteName: newNoteName,
      octave: newOctave,
      midi: newMidi,
    };
  });

  return {
    ...melody,
    notes: transposedNotes,
  };
}

/**
 * Detect primary tonic / key root note from timeline
 */
export function getTimelineKeyRoot(timeline: TimelineChordItem[]): string {
  if (timeline.length === 0) return 'C';
  return timeline[0].chord.root;
}

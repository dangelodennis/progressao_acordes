import { ChordDefinition, Genre, MelodyNote, MelodyStyle, MelodySuggestion, TimelineChordItem } from '../types';

// Semitone mapping (C = 0)
export const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

export const SEMITONE_TO_SHARP_NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const SEMITONE_TO_FLAT_NAME = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function getSemitone(noteStr: string): number {
  const match = noteStr.match(/^([A-G][b#]?)/);
  if (!match) return 0;
  return NOTE_TO_SEMITONE[match[1]] ?? 0;
}

export function getNoteName(noteStr: string): string {
  const match = noteStr.match(/^([A-G][b#]?)/);
  return match ? match[1] : noteStr;
}

export function normalizeNoteName(name: string, preferFlats = false): string {
  const st = getSemitone(name);
  return preferFlats ? SEMITONE_TO_FLAT_NAME[st] : SEMITONE_TO_SHARP_NAME[st];
}

// Scale interval formulas
export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export type ScalePresetType = keyof typeof SCALE_INTERVALS;

export const SCALE_LABELS: Record<ScalePresetType, string> = {
  major: 'Maior Natural (Jônio)',
  minor: 'Menor Natural (Eólio)',
  pentatonic_major: 'Pentatônica Maior',
  pentatonic_minor: 'Pentatônica Menor',
  blues: 'Escala Blues',
  dorian: 'Dórico',
  mixolydian: 'Mixolídio',
};

// Returns scale semitones relative to 0-11
export function getScaleSemitones(rootNote: string, scaleType: ScalePresetType): number[] {
  const rootSt = getSemitone(rootNote);
  const intervals = SCALE_INTERVALS[scaleType] || SCALE_INTERVALS.major;
  return intervals.map((int) => (rootSt + int) % 12);
}

// Degree label relative to root
export function getDegreeLabel(semitone: number, rootSemitone: number): string {
  const diff = (semitone - rootSemitone + 12) % 12;
  switch (diff) {
    case 0: return 'T';
    case 1: return 'b2';
    case 2: return '2ª';
    case 3: return '3ªm';
    case 4: return '3ª';
    case 5: return '4ª';
    case 6: return 'b5';
    case 7: return '5ª';
    case 8: return '6ªm';
    case 9: return '6ª';
    case 10: return '7ªm';
    case 11: return '7ªM';
    default: return '';
  }
}

// Check if a note is in scale notes array
export function isNoteInScaleList(noteName: string, scaleNoteNames: string[]): boolean {
  const targetSt = getSemitone(noteName);
  return scaleNoteNames.some((n) => getSemitone(n) === targetSt);
}

// Determine best global key from a chord progression
export function detectKeyFromChords(chords: ChordDefinition[]): { root: string; isMinor: boolean; scaleType: ScalePresetType } {
  if (chords.length === 0) {
    return { root: 'C', isMinor: false, scaleType: 'major' };
  }
  const first = chords[0];
  const isMinor = first.quality === 'minor' || first.quality === 'm7';
  return {
    root: first.root,
    isMinor,
    scaleType: isMinor ? 'minor' : 'major',
  };
}

// Helper to construct a MelodyNote
function createMelodyNote(
  noteName: string,
  octave: number,
  durationBeats: number,
  startBeat: number,
  chordIndex: number,
  role: MelodyNote['role'],
  rootSemitone: number
): MelodyNote {
  const st = getSemitone(noteName);
  const midi = (octave + 1) * 12 + st;
  const noteStr = `${noteName}${octave}`;
  const degree = getDegreeLabel(st, rootSemitone);

  return {
    id: `m-note-${chordIndex}-${startBeat.toFixed(2)}-${Math.random().toString(36).substr(2, 4)}`,
    note: noteStr,
    noteName,
    octave,
    midi,
    durationBeats,
    startBeat,
    chordIndex,
    role,
    degree,
  };
}

// Main generator for suggestions
export function generateMelodySuggestions(
  timeline: TimelineChordItem[],
  genre: Genre = 'pop',
  variationSeed = 0
): MelodySuggestion[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  const chords = timeline.map((t) => t.chord);
  const { root: keyRoot, isMinor } = detectKeyFromChords(chords);
  const keyRootSt = getSemitone(keyRoot);

  const defaultOctave = isMinor ? 4 : 4;

  // Helper to add notes strictly within the chord item's beat boundary
  const addFitted = (
    list: MelodyNote[],
    noteName: string,
    octave: number,
    dur: number,
    start: number,
    chordIndex: number,
    role: 'root' | 'third' | 'fifth' | 'seventh' | 'passing' | 'accent',
    measureEnd: number
  ) => {
    if (start >= measureEnd) return;
    const available = measureEnd - start;
    if (available < 0.2) return;
    list.push(createMelodyNote(noteName, octave, Math.min(dur, available), start, chordIndex, role, keyRootSt));
  };

  // 1. Estilo Lírico / Cantável (Pop & Vocal)
  const lyricalNotes: MelodyNote[] = [];
  let currentBeat = 0;

  timeline.forEach((item, cIdx) => {
    const chord = item.chord;
    const chordNotes = chord.noteNames;
    const rootN = chordNotes[0];
    const thirdN = chordNotes.length > 1 ? chordNotes[1] : rootN;
    const fifthN = chordNotes.length > 2 ? chordNotes[2] : rootN;
    const seventhN = chordNotes.length > 3 ? chordNotes[3] : undefined;
    const measureEnd = currentBeat + item.durationBeats;

    // Phrase contours based on chord position and variationSeed
    const patternVariant = (cIdx + variationSeed) % 4;

    if (item.durationBeats <= 2) {
      addFitted(lyricalNotes, thirdN, defaultOctave, 1.0, currentBeat, cIdx, 'third', measureEnd);
      addFitted(lyricalNotes, fifthN, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
    } else if (patternVariant === 0) {
      // 3ª (1.5 beats) -> 5ª (1.5 beats) -> 3ª (1 beat)
      addFitted(lyricalNotes, thirdN, defaultOctave, 1.5, currentBeat, cIdx, 'third', measureEnd);
      addFitted(lyricalNotes, fifthN, defaultOctave, 1.5, currentBeat + 1.5, cIdx, 'fifth', measureEnd);
      addFitted(lyricalNotes, thirdN, defaultOctave, 1.0, currentBeat + 3.0, cIdx, 'third', measureEnd);
    } else if (patternVariant === 1) {
      // Root (1 beat) -> 2ª/Passagem (1 beat) -> 3ª (2 beats sustentados)
      const scaleNotes = chord.scale.notes;
      const passing = scaleNotes[(scaleNotes.indexOf(rootN) + 1) % scaleNotes.length] || fifthN;
      addFitted(lyricalNotes, rootN, defaultOctave, 1.0, currentBeat, cIdx, 'root', measureEnd);
      addFitted(lyricalNotes, passing, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'passing', measureEnd);
      addFitted(lyricalNotes, thirdN, defaultOctave, 2.0, currentBeat + 2.0, cIdx, 'third', measureEnd);
    } else if (patternVariant === 2) {
      // 5ª (2 beats) -> 7ª ou 3ª (1 beat) -> Tônica (1 beat)
      const targetTone = seventhN || thirdN;
      addFitted(lyricalNotes, fifthN, defaultOctave, 2.0, currentBeat, cIdx, 'fifth', measureEnd);
      addFitted(lyricalNotes, targetTone, defaultOctave, 1.0, currentBeat + 2.0, cIdx, seventhN ? 'seventh' : 'third', measureEnd);
      addFitted(lyricalNotes, rootN, defaultOctave, 1.0, currentBeat + 3.0, cIdx, 'root', measureEnd);
    } else {
      // 3ª (1 beat) -> 5ª (1 beat) -> Tônica aguda (2 beats com repouso lírico)
      addFitted(lyricalNotes, thirdN, defaultOctave, 1.0, currentBeat, cIdx, 'third', measureEnd);
      addFitted(lyricalNotes, fifthN, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
      addFitted(lyricalNotes, rootN, defaultOctave + 1, 2.0, currentBeat + 2.0, cIdx, 'root', measureEnd);
    }

    currentBeat += item.durationBeats;
  });

  // 2. Estilo Riff Marcante (Hook / Pop-Rock)
  const riffNotes: MelodyNote[] = [];
  currentBeat = 0;

  timeline.forEach((item, cIdx) => {
    const chord = item.chord;
    const chordNotes = chord.noteNames;
    const rootN = chordNotes[0];
    const fifthN = chordNotes.length > 2 ? chordNotes[2] : rootN;
    const scale = chord.scale.notes;
    const measureEnd = currentBeat + item.durationBeats;

    const rVariant = (cIdx + variationSeed * 2) % 3;

    if (item.durationBeats <= 2) {
      addFitted(riffNotes, rootN, defaultOctave, 0.5, currentBeat, cIdx, 'root', measureEnd);
      addFitted(riffNotes, fifthN, defaultOctave, 1.0, currentBeat + 0.5, cIdx, 'fifth', measureEnd);
    } else if (rVariant === 0) {
      const thirdN = chordNotes.length > 1 ? chordNotes[1] : rootN;
      addFitted(riffNotes, rootN, defaultOctave, 0.5, currentBeat, cIdx, 'root', measureEnd);
      addFitted(riffNotes, rootN, defaultOctave, 0.5, currentBeat + 0.5, cIdx, 'root', measureEnd);
      addFitted(riffNotes, fifthN, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
      addFitted(riffNotes, thirdN, defaultOctave, 1.0, currentBeat + 2.0, cIdx, 'third', measureEnd);
      addFitted(riffNotes, rootN, defaultOctave, 1.0, currentBeat + 3.0, cIdx, 'root', measureEnd);
    } else if (rVariant === 1) {
      const thirdN = chordNotes.length > 1 ? chordNotes[1] : rootN;
      addFitted(riffNotes, fifthN, defaultOctave, 0.75, currentBeat, cIdx, 'fifth', measureEnd);
      addFitted(riffNotes, rootN, defaultOctave + 1, 0.75, currentBeat + 0.75, cIdx, 'root', measureEnd);
      addFitted(riffNotes, thirdN, defaultOctave, 1.0, currentBeat + 1.5, cIdx, 'third', measureEnd);
      addFitted(riffNotes, rootN, defaultOctave, 1.5, currentBeat + 2.5, cIdx, 'root', measureEnd);
    } else {
      const p1 = scale[0] || rootN;
      const p2 = scale[2] || rootN;
      const p3 = scale[4] || fifthN;
      addFitted(riffNotes, p1, defaultOctave, 0.5, currentBeat, cIdx, 'root', measureEnd);
      addFitted(riffNotes, p2, defaultOctave, 0.5, currentBeat + 0.5, cIdx, 'third', measureEnd);
      addFitted(riffNotes, p3, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
      addFitted(riffNotes, p2, defaultOctave, 1.0, currentBeat + 2.0, cIdx, 'third', measureEnd);
      addFitted(riffNotes, p1, defaultOctave, 1.0, currentBeat + 3.0, cIdx, 'root', measureEnd);
    }

    currentBeat += item.durationBeats;
  });

  // 3. Estilo Arpejo Fluido (Dedilhado / Violão e Piano)
  const arpeggioNotes: MelodyNote[] = [];
  currentBeat = 0;

  timeline.forEach((item, cIdx) => {
    const chord = item.chord;
    const chordNotes = chord.noteNames;
    const rootN = chordNotes[0];
    const thirdN = chordNotes.length > 1 ? chordNotes[1] : rootN;
    const fifthN = chordNotes.length > 2 ? chordNotes[2] : rootN;
    const upperRoot = rootN;
    const measureEnd = currentBeat + item.durationBeats;

    for (let b = 0; b < item.durationBeats; b++) {
      const n = b % 4 === 0 ? rootN : b % 4 === 1 ? thirdN : b % 4 === 2 ? fifthN : upperRoot;
      const oct = b % 4 === 3 ? defaultOctave + 1 : defaultOctave;
      const role = b % 4 === 0 ? 'root' : b % 4 === 1 ? 'third' : b % 4 === 2 ? 'fifth' : 'root';
      addFitted(arpeggioNotes, n, oct, 1.0, currentBeat + b, cIdx, role, measureEnd);
    }

    currentBeat += item.durationBeats;
  });

  // 4. Estilo Solo Blues / Expressivo
  const bluesNotes: MelodyNote[] = [];
  currentBeat = 0;

  timeline.forEach((item, cIdx) => {
    const chord = item.chord;
    const chordNotes = chord.noteNames;
    const rootN = chordNotes[0];
    const thirdN = chordNotes.length > 1 ? chordNotes[1] : rootN;
    const fifthN = chordNotes.length > 2 ? chordNotes[2] : rootN;
    const measureEnd = currentBeat + item.durationBeats;

    const bVariant = (cIdx + variationSeed) % 3;

    if (item.durationBeats <= 2) {
      addFitted(bluesNotes, thirdN, defaultOctave, 1.0, currentBeat, cIdx, 'third', measureEnd);
      addFitted(bluesNotes, rootN, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'root', measureEnd);
    } else if (bVariant === 0) {
      addFitted(bluesNotes, thirdN, defaultOctave, 1.0, currentBeat, cIdx, 'third', measureEnd);
      addFitted(bluesNotes, fifthN, defaultOctave, 2.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
      addFitted(bluesNotes, rootN, defaultOctave, 1.0, currentBeat + 3.0, cIdx, 'root', measureEnd);
    } else if (bVariant === 1) {
      addFitted(bluesNotes, fifthN, defaultOctave, 1.5, currentBeat, cIdx, 'fifth', measureEnd);
      addFitted(bluesNotes, thirdN, defaultOctave, 0.5, currentBeat + 1.5, cIdx, 'third', measureEnd);
      addFitted(bluesNotes, rootN, defaultOctave, 2.0, currentBeat + 2.0, cIdx, 'root', measureEnd);
    } else {
      addFitted(bluesNotes, rootN, defaultOctave, 1.0, currentBeat, cIdx, 'root', measureEnd);
      addFitted(bluesNotes, fifthN, defaultOctave, 1.0, currentBeat + 1.0, cIdx, 'fifth', measureEnd);
      addFitted(bluesNotes, thirdN, defaultOctave, 2.0, currentBeat + 2.0, cIdx, 'third', measureEnd);
    }

    currentBeat += item.durationBeats;
  });

  // 5. Estilo Linha Aérea (Balada / Sustentada / Condução de Vozes)
  const ambientNotes: MelodyNote[] = [];
  currentBeat = 0;

  timeline.forEach((item, cIdx) => {
    const chord = item.chord;
    const chordNotes = chord.noteNames;
    const thirdN = chordNotes.length > 1 ? chordNotes[1] : chordNotes[0];
    const fifthN = chordNotes.length > 2 ? chordNotes[2] : chordNotes[0];
    const measureEnd = currentBeat + item.durationBeats;

    if (item.durationBeats <= 2) {
      addFitted(ambientNotes, thirdN, defaultOctave, item.durationBeats, currentBeat, cIdx, 'third', measureEnd);
    } else if (cIdx % 2 === 0) {
      const halfDur = item.durationBeats / 2;
      addFitted(ambientNotes, thirdN, defaultOctave, halfDur, currentBeat, cIdx, 'third', measureEnd);
      addFitted(ambientNotes, fifthN, defaultOctave, halfDur, currentBeat + halfDur, cIdx, 'fifth', measureEnd);
    } else {
      addFitted(ambientNotes, fifthN, defaultOctave, item.durationBeats, currentBeat, cIdx, 'fifth', measureEnd);
    }

    currentBeat += item.durationBeats;
  });

  const totalBeats = timeline.reduce((acc, it) => acc + it.durationBeats, 0);

  return [
    {
      id: 'sug-lyrical',
      name: 'Lírica Cantável (Pop / Vocal)',
      description: 'Frases suaves e fluidas com ênfase nas terças e quintas dos acordes. Perfeita para cantar ou tocar com violão.',
      style: 'lyrical',
      notes: lyricalNotes,
      totalBeats,
      tags: ['Pop', 'Voz', 'Harmônico'],
    },
    {
      id: 'sug-riff',
      name: 'Riff Chiclete (Hook Marcante)',
      description: 'Motivo melódico rítmico e cativante na pentatônica, que gruda na cabeça e define a identidade da música.',
      style: 'riff',
      notes: riffNotes,
      totalBeats,
      tags: ['Rock / Pop', 'Enérgico', 'Rítmico'],
    },
    {
      id: 'sug-arpeggio',
      name: 'Arpejo Fluido (Dedilhado Contínuo)',
      description: 'Desenha as notas da harmonia em cascata elegante, ideal para introduções, estrofes e fingerstyle.',
      style: 'arpeggio',
      notes: arpeggioNotes,
      totalBeats,
      tags: ['Acústico', 'Piano', 'Fingerstyle'],
    },
    {
      id: 'sug-blues',
      name: 'Solo Expressivo (Blues / Rock)',
      description: 'Fraseado emotivo com pausas de respiração e notas de tensão/repouso para improvisar solos com sentimento.',
      style: 'blues',
      notes: bluesNotes,
      totalBeats,
      tags: ['Blues', 'Solo', 'Expressivo'],
    },
    {
      id: 'sug-ambient',
      name: 'Linha Aérea (Balada / Sustentada)',
      description: 'Notas longas e etéreas que conectam suavemente um acorde ao outro através da condução de vozes (voice leading).',
      style: 'ambient',
      notes: ambientNotes,
      totalBeats,
      tags: ['Balada', 'Ambiente', 'Condução'],
    },
  ];
}

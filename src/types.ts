export type Genre =
  | 'rock'
  | 'pop'
  | 'ballad'
  | 'blues'
  | 'acoustic'
  | 'jazz'
  | 'electronic'
  | 'techno'
  | 'punk';

export type BackingTrackStyle =
  | 'none'
  | 'rock'
  | 'funk'
  | 'reggae'
  | 'shuffle'
  | 'disco'
  | 'bossa'
  | 'punk'
  | 'techno';

export interface BackingTrackOption {
  id: BackingTrackStyle;
  name: string;
  genreTag: string;
  icon: string;
  description: string;
  drumPatternDescription: string;
  bassPatternDescription: string;
}

export type InstrumentType = 'piano' | 'guitar';

export type DisplayMode = 'guitar' | 'piano' | 'both';

export interface ChordDefinition {
  id: string;
  name: string; // e.g. "C", "Am", "G7", "Fmaj7"
  root: string; // "C", "D", "E", etc.
  quality: 'major' | 'minor' | '7' | 'maj7' | 'm7' | 'sus2' | 'sus4' | 'add9' | 'dim' | 'aug' | '5';
  symbol: string; // "C", "Am", "G7", "C/E", "C/G"
  bassNote?: string; // e.g. "E" for C/E, "G" for C/G
  inversion?: number; // 0: Root position, 1: 1st inversion (3rd in bass), 2: 2nd inversion (5th in bass), 3: 3rd inversion (7th in bass)
  degree?: string; // "I", "ii", "IV", "V", "vi" relative to current key
  notes: string[]; // e.g. ["C4", "E4", "G4"]
  noteNames: string[]; // e.g. ["C", "E", "G"]
  
  // Guitar diagram representation
  // 6 strings from low E (6th) to high E (1st): [string6, string5, string4, string3, string2, string1]
  // -1 = mute (X), 0 = open (O), 1..12 = fret number
  guitar: {
    frets: number[];
    fingers?: (number | null)[]; // 1: Index, 2: Middle, 3: Ring, 4: Pinky, null/0: none
    baseFret: number;
    barre?: {
      fret: number;
      fromString: number;
      toString: number;
    };
  };

  // Piano diagram representation: MIDI note numbers (60 = Middle C) or note indices in octave
  piano: {
    keys: string[]; // e.g. ["C4", "E4", "G4"]
    rootKey: string; // "C4"
  };

  // Corresponding Scale / Mode
  scale: {
    name: string; // e.g. "Dó Maior (Jônio) / Pentatônica Maior"
    mode: string; // "Jônio", "Eólio", "Dórico", "Mixolídio", "Pentatônica"
    notes: string[]; // ["C", "D", "E", "F", "G", "A", "B"]
    description: string; // Explanation of why it fits and how to solo/improvise
    soloingTips: string; // Portuguese tips for melody/solo creation
  };
}

export type ChordRhythmPattern =
  | 'whole' // Sustenido por 1 compasso inteiro (padrão)
  | 'quarters' // 4 batidas por compasso (semínimas: 1, 2, 3, 4)
  | 'eighths' // 8 batidas por compasso (colcheias constantes: 1 & 2 & 3 & 4 &)
  | 'syncopated' // Sincopado Pop/Groove (1, e-do-2, 4)
  | 'arpeggio' // Arpejo ascendente nota por nota
  | 'waltz' // Valsa / Balada (Baixo no 1, acorde no 2 e 3);

export interface TimelineChordItem {
  id: string;
  chord: ChordDefinition;
  durationBeats: number; // usually 4 beats (1 measure) or 2 beats
  genreContext?: Genre;
  octaveOffset?: number; // e.g. -2, -1, 0, +1, +2 (default 0)
  rhythmPattern?: ChordRhythmPattern; // Rhythm strumming/playing pattern
}

export interface ChordSuggestion {
  chord: ChordDefinition;
  reason: string; // e.g. "Cadência dominante padrão no Pop (V)"
  tag: string; // e.g. "Mais Popular", "Resolução", "Transição Emocional", "Tensão"
  genreMatch: Genre[];
  score: number; // 0 - 100 recommendation weight
  moodDescription: string;
}

export interface SavedMelodyConfig {
  id?: string;
  name: string;
  style: MelodyStyle;
  instrument: InstrumentType;
  octaveOffset: number;
  variationSeed: number;
  notes: MelodyNote[];
  totalBeats: number;
  tags?: string[];
  scaleType?: string;
}

export interface ChordDurationOption {
  beats: number;
  label: string;
  shortLabel: string;
  noteFigure: string;
  measureText: string;
  description: string;
}

export const CHORD_DURATION_OPTIONS: ChordDurationOption[] = [
  { beats: 1, label: '1 Tempo (1/4 Compasso)', shortLabel: '1t', noteFigure: '♩', measureText: '1/4 comp.', description: 'Semínima - rápida transição harmônica' },
  { beats: 2, label: '2 Tempos (1/2 Compasso)', shortLabel: '2t', noteFigure: '𝅗𝅥', measureText: '1/2 comp.', description: 'Mínima - divide o compasso em 2 acordes' },
  { beats: 3, label: '3 Tempos (3/4 Compasso)', shortLabel: '3t', noteFigure: '𝅗𝅥.', measureText: '3/4 comp.', description: 'Mínima pontuada - valsa ou síncope' },
  { beats: 4, label: '4 Tempos (1 Compasso Inteiro)', shortLabel: '4t', noteFigure: '𝅝', measureText: '1 comp.', description: 'Semibreve - compasso completo padrão 4/4' },
  { beats: 6, label: '6 Tempos (1.5 Compassos)', shortLabel: '6t', noteFigure: '𝅝+𝅗𝅥', measureText: '1.5 comp.', description: 'Compasso composto / prolongado' },
  { beats: 8, label: '8 Tempos (2 Compassos Inteiros)', shortLabel: '8t', noteFigure: '2×𝅝', measureText: '2 comp.', description: 'Dois compassos - acorde de repouso ou introdução' },
];

export interface SavedProgression {
  id: string;
  name: string;
  description?: string;
  genre: Genre;
  chords: ChordDefinition[];
  tempoBpm: number;
  instrument: InstrumentType;
  createdAt: number;
  updatedAt?: number;
  isPreset?: boolean;
  melody?: SavedMelodyConfig;
  chordDurations?: number[];
}

export type MelodyStyle = 'lyrical' | 'riff' | 'arpeggio' | 'blues' | 'ambient';

export interface MelodyNote {
  id: string;
  note: string; // e.g. "C4", "E4", "G4"
  noteName: string; // e.g. "C", "E", "G"
  octave: number; // e.g. 4
  midi: number;
  durationBeats: number; // 0.5 (8th), 1 (quarter), 1.5, 2 (half)
  startBeat: number; // beat position in the sequence (0, 1, 2...)
  chordIndex: number; // which chord measure in the timeline this note belongs to
  role: 'root' | 'third' | 'fifth' | 'seventh' | 'passing' | 'accent';
  degree?: string; // e.g. "T", "3ª", "5ª", "7ª", "2ª", "4ª", "6ª"
}

export interface MelodySuggestion {
  id: string;
  name: string;
  description: string;
  style: MelodyStyle;
  notes: MelodyNote[];
  totalBeats: number;
  tags: string[];
}

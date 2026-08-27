export type Genre = 'rock' | 'pop' | 'ballad' | 'blues' | 'acoustic' | 'jazz';

export type InstrumentType = 'piano' | 'guitar';

export type DisplayMode = 'guitar' | 'piano' | 'both';

export interface ChordDefinition {
  id: string;
  name: string; // e.g. "C", "Am", "G7", "Fmaj7"
  root: string; // "C", "D", "E", etc.
  quality: 'major' | 'minor' | '7' | 'maj7' | 'm7' | 'sus2' | 'sus4' | 'add9' | 'dim' | 'aug' | '5';
  symbol: string; // "C", "Am", "G7"
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

export interface TimelineChordItem {
  id: string;
  chord: ChordDefinition;
  durationBeats: number; // usually 4 beats (1 measure) or 2 beats
  genreContext?: Genre;
  octaveOffset?: number; // e.g. -2, -1, 0, +1, +2 (default 0)
}

export interface ChordSuggestion {
  chord: ChordDefinition;
  reason: string; // e.g. "Cadência dominante padrão no Pop (V)"
  tag: string; // e.g. "Mais Popular", "Resolução", "Transição Emocional", "Tensão"
  genreMatch: Genre[];
  score: number; // 0 - 100 recommendation weight
  moodDescription: string;
}

export interface SavedProgression {
  id: string;
  name: string;
  description?: string;
  genre: Genre;
  chords: ChordDefinition[];
  tempoBpm: number;
  instrument: InstrumentType;
  createdAt: number;
  isPreset?: boolean;
}

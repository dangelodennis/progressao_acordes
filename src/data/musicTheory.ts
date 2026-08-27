import { ChordDefinition, Genre, ChordSuggestion, SavedProgression } from '../types';

// Map of note names to MIDI note numbers (Middle C = C4 = 60)
export const NOTE_TO_MIDI: Record<string, number> = {
  'C3': 48, 'C#3': 49, 'Db3': 49, 'D3': 50, 'D#3': 51, 'Eb3': 51, 'E3': 52, 'F3': 53, 'F#3': 54, 'Gb3': 54, 'G3': 55, 'G#3': 56, 'Ab3': 56, 'A3': 57, 'A#3': 58, 'Bb3': 58, 'B3': 59,
  'C4': 60, 'C#4': 61, 'Db4': 61, 'D4': 62, 'D#4': 63, 'Eb4': 63, 'E4': 64, 'F4': 65, 'F#4': 66, 'Gb4': 66, 'G4': 67, 'G#4': 68, 'Ab4': 68, 'A4': 69, 'A#4': 70, 'Bb4': 70, 'B4': 71,
  'C5': 72, 'C#5': 73, 'Db5': 73, 'D5': 74, 'D#5': 75, 'Eb5': 75, 'E5': 76, 'F5': 77, 'F#5': 78, 'Gb5': 78, 'G5': 79, 'G#5': 80, 'Ab5': 80, 'A5': 81, 'A#5': 82, 'Bb5': 82, 'B5': 83,
};

export const CHORD_DATABASE: Record<string, ChordDefinition> = {
  // C CHORDS
  'C': {
    id: 'C',
    name: 'C (Dó Maior)',
    root: 'C',
    quality: 'major',
    symbol: 'C',
    notes: ['C3', 'E3', 'G3', 'C4', 'E4'],
    noteNames: ['C', 'E', 'G'],
    guitar: {
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [null, 3, 2, 0, 1, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['C4', 'E4', 'G4'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Dó Maior (Jônio) & Pentatônica Maior',
      mode: 'Jônio / Pentatônica Maior',
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      description: 'Som brilhante, alegre, estável e conclusivo. É o acorde tônico (centro tonal padrão).',
      soloingTips: 'Use a Pentatônica Maior de Dó (C D E G A) para melodias suaves e diretas ou a Escala de Dó Maior completa.',
    },
  },
  'Cmaj7': {
    id: 'Cmaj7',
    name: 'Cmaj7 (Dó com Sétima Maior)',
    root: 'C',
    quality: 'maj7',
    symbol: 'Cmaj7',
    notes: ['C3', 'E3', 'G3', 'B3', 'E4'],
    noteNames: ['C', 'E', 'G', 'B'],
    guitar: {
      frets: [-1, 3, 2, 0, 0, 0],
      fingers: [null, 3, 2, 0, 0, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['C4', 'E4', 'G4', 'B4'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Dó Maior (Jônio) / Dó Lídio',
      mode: 'Jônio / Lídio',
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      description: 'Clima etéreo, sofisticado, nostálgico e calmo. Muito utilizado em baladas e pop acústico.',
      soloingTips: 'Destaque a 7ª maior (B) e a 9ª (D) para criar frases relaxantes e sofisticadas.',
    },
  },
  'Cadd9': {
    id: 'Cadd9',
    name: 'Cadd9 (Dó com Nona)',
    root: 'C',
    quality: 'add9',
    symbol: 'Cadd9',
    notes: ['C3', 'E3', 'G3', 'D4', 'E4'],
    noteNames: ['C', 'E', 'G', 'D'],
    guitar: {
      frets: [-1, 3, 2, 0, 3, 0],
      fingers: [null, 2, 1, 0, 3, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['C4', 'D4', 'E4', 'G4'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Dó Maior / Pentatônica de Dó',
      mode: 'Jônio',
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      description: 'Acorde pop e balada moderno por excelência, acrescenta brilho e cor sem complexidade excessiva.',
      soloingTips: 'A nota D (nona) sustenta a melodia sobre a harmonia com grande expressividade.',
    },
  },
  'Cm': {
    id: 'Cm',
    name: 'Cm (Dó Menor)',
    root: 'C',
    quality: 'minor',
    symbol: 'Cm',
    notes: ['C3', 'G3', 'C4', 'Eb4', 'G4'],
    noteNames: ['C', 'Eb', 'G'],
    guitar: {
      frets: [-1, 3, 5, 5, 4, 3],
      fingers: [null, 1, 3, 4, 2, 1],
      baseFret: 3,
      barre: { fret: 3, fromString: 5, toString: 1 },
    },
    piano: {
      keys: ['C4', 'Eb4', 'G4'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Dó Menor Natural (Eólio) & Pentatônica Menor',
      mode: 'Eólio / Pentatônica Menor',
      notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      description: 'Atmosfera dramática, intensa, séria e emotiva.',
      soloingTips: 'Explore a Pentatônica de Cm (C Eb F G Bb) com bends expressivos.',
    },
  },
  'C7': {
    id: 'C7',
    name: 'C7 (Dó com Sétima)',
    root: 'C',
    quality: '7',
    symbol: 'C7',
    notes: ['C3', 'E3', 'Bb3', 'C4', 'E4'],
    noteNames: ['C', 'E', 'G', 'Bb'],
    guitar: {
      frets: [-1, 3, 2, 3, 1, 0],
      fingers: [null, 3, 2, 4, 1, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['C4', 'E4', 'G4', 'Bb4'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Dó Mixolídio & Blues de Dó',
      mode: 'Mixolídio',
      notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
      description: 'Acorde dominante que prepara tensão rumo ao F (Fá Maior). Essencial no Rock e Blues.',
      soloingTips: 'Use a escala Mixolídia ou a Escala Blues de C (C Eb F F# G Bb).',
    },
  },

  // D CHORDS
  'D': {
    id: 'D',
    name: 'D (Ré Maior)',
    root: 'D',
    quality: 'major',
    symbol: 'D',
    notes: ['D3', 'A3', 'D4', 'F#4'],
    noteNames: ['D', 'F#', 'A'],
    guitar: {
      frets: [-1, -1, 0, 2, 3, 2],
      fingers: [null, null, 0, 1, 3, 2],
      baseFret: 1,
    },
    piano: {
      keys: ['D4', 'F#4', 'A4'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Ré Maior (Jônio) & Pentatônica Maior',
      mode: 'Jônio / Pentatônica',
      notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      description: 'Sensação aberta, triunfante e energética.',
      soloingTips: 'Pentatônica de Ré Maior (D E F# A B) encaixa perfeitamente no pop e rock.',
    },
  },
  'Dm': {
    id: 'Dm',
    name: 'Dm (Ré Menor)',
    root: 'D',
    quality: 'minor',
    symbol: 'Dm',
    notes: ['D3', 'A3', 'D4', 'F4'],
    noteNames: ['D', 'F', 'A'],
    guitar: {
      frets: [-1, -1, 0, 2, 3, 1],
      fingers: [null, null, 0, 2, 3, 1],
      baseFret: 1,
    },
    piano: {
      keys: ['D4', 'F4', 'A4'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Ré Dórico / Ré Menor Natural (Eólio)',
      mode: 'Dórico / Eólio',
      notes: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
      description: 'Melancólico com toque elegante (grau ii em Dó Maior ou i em Ré Menor).',
      soloingTips: 'Modo Dórico (com B natural) dá um sabor sofisticado de balada e jazz-pop.',
    },
  },
  'Dm7': {
    id: 'Dm7',
    name: 'Dm7 (Ré Menor com Sétima)',
    root: 'D',
    quality: 'm7',
    symbol: 'Dm7',
    notes: ['D3', 'A3', 'C4', 'F4'],
    noteNames: ['D', 'F', 'A', 'C'],
    guitar: {
      frets: [-1, -1, 0, 2, 1, 1],
      fingers: [null, null, 0, 2, 1, 1],
      baseFret: 1,
      barre: { fret: 1, fromString: 2, toString: 1 },
    },
    piano: {
      keys: ['D4', 'F4', 'A4', 'C5'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Ré Dórico & Pentatônica Menor',
      mode: 'Dórico',
      notes: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
      description: 'Super suave, excelente como 2º grau preparador (ii-V-I).',
      soloingTips: 'Arpeje Dm7 e explore notas de passagem cromáticas para G7.',
    },
  },
  'D7': {
    id: 'D7',
    name: 'D7 (Ré com Sétima)',
    root: 'D',
    quality: '7',
    symbol: 'D7',
    notes: ['D3', 'A3', 'C4', 'F#4'],
    noteNames: ['D', 'F#', 'A', 'C'],
    guitar: {
      frets: [-1, -1, 0, 2, 1, 2],
      fingers: [null, null, 0, 2, 1, 3],
      baseFret: 1,
    },
    piano: {
      keys: ['D4', 'F#4', 'A4', 'C5'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Ré Mixolídio',
      mode: 'Mixolídio',
      notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'],
      description: 'Dominante secundário perfeito para preparar Sol (G). Muito usado em baladas e rock.',
      soloingTips: 'Enfatize a nota F# resolvendo no G do próximo acorde.',
    },
  },
  'Dsus4': {
    id: 'Dsus4',
    name: 'Dsus4 (Ré Suspenso)',
    root: 'D',
    quality: 'sus4',
    symbol: 'Dsus4',
    notes: ['D3', 'A3', 'D4', 'G4'],
    noteNames: ['D', 'G', 'A'],
    guitar: {
      frets: [-1, -1, 0, 2, 3, 3],
      fingers: [null, null, 0, 1, 2, 3],
      baseFret: 1,
    },
    piano: {
      keys: ['D4', 'G4', 'A4'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Ré Mixolídio / Pentatônica de Ré',
      mode: 'Suspenso',
      notes: ['D', 'E', 'G', 'A', 'B'],
      description: 'Cria suspense instantâneo que pede resolução no acorde D (Ré Maior).',
      soloingTips: 'Alterne entre a nota G e F# para criar o clássico ornamento de violão rock.',
    },
  },

  // E CHORDS
  'E': {
    id: 'E',
    name: 'E (Mi Maior)',
    root: 'E',
    quality: 'major',
    symbol: 'E',
    notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
    noteNames: ['E', 'G#', 'B'],
    guitar: {
      frets: [0, 2, 2, 1, 0, 0],
      fingers: [0, 2, 3, 1, 0, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['E4', 'G#4', 'B4'],
      rootKey: 'E4',
    },
    scale: {
      name: 'Mi Maior (Jônio) & Pentatônica Maior',
      mode: 'Jônio',
      notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      description: 'Potente, ressonante nas cordas graves, um dos acordes pilares do Rock.',
      soloingTips: 'Aproveite a ressonância do bordão grave de Mi para riffs de guitarra.',
    },
  },
  'Em': {
    id: 'Em',
    name: 'Em (Mi Menor)',
    root: 'E',
    quality: 'minor',
    symbol: 'Em',
    notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
    noteNames: ['E', 'G', 'B'],
    guitar: {
      frets: [0, 2, 2, 0, 0, 0],
      fingers: [0, 2, 3, 0, 0, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['E4', 'G4', 'B4'],
      rootKey: 'E4',
    },
    scale: {
      name: 'Mi Menor Natural (Eólio) & Pentatônica Menor',
      mode: 'Eólio / Pentatônica Menor',
      notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
      description: 'Profundo, contemplativo e introspectivo (grau iii em Dó ou vi em Sol).',
      soloingTips: 'A lendária escala Pentatônica de Mi Menor (E G A B D) para solos expressivos.',
    },
  },
  'Em7': {
    id: 'Em7',
    name: 'Em7 (Mi Menor com Sétima)',
    root: 'E',
    quality: 'm7',
    symbol: 'Em7',
    notes: ['E2', 'B2', 'D3', 'G3', 'B3', 'E4'],
    noteNames: ['E', 'G', 'B', 'D'],
    guitar: {
      frets: [0, 2, 2, 0, 3, 0],
      fingers: [0, 1, 2, 0, 3, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['E4', 'G4', 'B4', 'D5'],
      rootKey: 'E4',
    },
    scale: {
      name: 'Mi Dórico / Mi Eólio',
      mode: 'Dórico / Eólio',
      notes: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
      description: 'Rico e moderno, comum em canções pop acústicas e baladas suaves.',
      soloingTips: 'Use a 7ª (D) mantendo sustentação melodiosa.',
    },
  },
  'E7': {
    id: 'E7',
    name: 'E7 (Mi com Sétima)',
    root: 'E',
    quality: '7',
    symbol: 'E7',
    notes: ['E2', 'B2', 'D3', 'G#3', 'B3', 'E4'],
    noteNames: ['E', 'G#', 'B', 'D'],
    guitar: {
      frets: [0, 2, 0, 1, 0, 0],
      fingers: [0, 2, 0, 1, 0, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['E4', 'G#4', 'B4', 'D5'],
      rootKey: 'E4',
    },
    scale: {
      name: 'Mi Mixolídio / Mi Harmônico Menor',
      mode: 'Mixolídio / Harmônica',
      notes: ['E', 'F#', 'G#', 'A', 'B', 'C', 'D'],
      description: 'Dominante que resolve dramaticamente em Lá Menor (Am). Tensão apaixonada em baladas.',
      soloingTips: 'A nota G# cria a tensão magnética perfeita antes de cair em Am.',
    },
  },

  // F CHORDS
  'F': {
    id: 'F',
    name: 'F (Fá Maior)',
    root: 'F',
    quality: 'major',
    symbol: 'F',
    notes: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
    noteNames: ['F', 'A', 'C'],
    guitar: {
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      baseFret: 1,
      barre: { fret: 1, fromString: 6, toString: 1 },
    },
    piano: {
      keys: ['F4', 'A4', 'C5'],
      rootKey: 'F4',
    },
    scale: {
      name: 'Fá Maior (Lídio em Dó / Jônio em Fá)',
      mode: 'Lídio / Jônio',
      notes: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
      description: 'Subdominante (grau IV em C). Sensação de expansão, abertura e esperança.',
      soloingTips: 'Em tom de C, a escala Lídia de Fá (com B natural) soa mágica e cinematográfica.',
    },
  },
  'Fmaj7': {
    id: 'Fmaj7',
    name: 'Fmaj7 (Fá com Sétima Maior)',
    root: 'F',
    quality: 'maj7',
    symbol: 'Fmaj7',
    notes: ['F3', 'A3', 'C4', 'E4'],
    noteNames: ['F', 'A', 'C', 'E'],
    guitar: {
      frets: [-1, -1, 3, 2, 1, 0],
      fingers: [null, null, 3, 2, 1, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['F4', 'A4', 'C5', 'E5'],
      rootKey: 'F4',
    },
    scale: {
      name: 'Fá Lídio (Modo IV de Dó)',
      mode: 'Lídio',
      notes: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
      description: 'Doce, nostálgico e fácil de tocar no violão com cordas soltas.',
      soloingTips: 'Deixe a corda Mi aguda solta ressoar para um timbre brilhante.',
    },
  },
  'Fm': {
    id: 'Fm',
    name: 'Fm (Fá Menor)',
    root: 'F',
    quality: 'minor',
    symbol: 'Fm',
    notes: ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4'],
    noteNames: ['F', 'Ab', 'C'],
    guitar: {
      frets: [1, 3, 3, 1, 1, 1],
      fingers: [1, 3, 4, 1, 1, 1],
      baseFret: 1,
      barre: { fret: 1, fromString: 6, toString: 1 },
    },
    piano: {
      keys: ['F4', 'Ab4', 'C5'],
      rootKey: 'F4',
    },
    scale: {
      name: 'Fá Menor Natural / Empréstimo Modal (iv menor)',
      mode: 'Eólio / Menor',
      notes: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
      description: 'O famoso "iv menor" (empréstimo modal em C), produz o som mais comovente e emocionante do Pop e Baladas.',
      soloingTips: 'Destaque a nota Ab caindo suavemente para a nota G no acorde seguinte (C ou G).',
    },
  },

  // G CHORDS
  'G': {
    id: 'G',
    name: 'G (Sol Maior)',
    root: 'G',
    quality: 'major',
    symbol: 'G',
    notes: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'],
    noteNames: ['G', 'B', 'D'],
    guitar: {
      frets: [3, 2, 0, 0, 3, 3],
      fingers: [2, 1, 0, 0, 3, 4],
      baseFret: 1,
    },
    piano: {
      keys: ['G4', 'B4', 'D5'],
      rootKey: 'G4',
    },
    scale: {
      name: 'Sol Maior (Mixolídio em Dó / Jônio em Sol)',
      mode: 'Mixolídio / Jônio',
      notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
      description: 'Dominante principal (grau V em C). Cria expectativa e impulso energético para frente.',
      soloingTips: 'Pentatônica Maior de Sol (G A B D E) ou Escala Maior.',
    },
  },
  'G7': {
    id: 'G7',
    name: 'G7 (Sol com Sétima)',
    root: 'G',
    quality: '7',
    symbol: 'G7',
    notes: ['G2', 'B2', 'D3', 'F3', 'B3', 'G4'],
    noteNames: ['G', 'B', 'D', 'F'],
    guitar: {
      frets: [3, 2, 0, 0, 0, 1],
      fingers: [3, 2, 0, 0, 0, 1],
      baseFret: 1,
    },
    piano: {
      keys: ['G4', 'B4', 'D5', 'F5'],
      rootKey: 'G4',
    },
    scale: {
      name: 'Sol Mixolídio (Tensão Dominante)',
      mode: 'Mixolídio',
      notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
      description: 'A tensão máxima da harmonia funcional que implora por resolver no Dó Maior (C).',
      soloingTips: 'Toque o trítono B-F e resolva em C-E no próximo compasso.',
    },
  },
  'Gsus4': {
    id: 'Gsus4',
    name: 'Gsus4 (Sol Suspenso)',
    root: 'G',
    quality: 'sus4',
    symbol: 'Gsus4',
    notes: ['G2', 'C3', 'D3', 'G3', 'C4', 'G4'],
    noteNames: ['G', 'C', 'D'],
    guitar: {
      frets: [3, 3, 0, 0, 1, 3],
      fingers: [3, 4, 0, 0, 1, 2],
      baseFret: 1,
    },
    piano: {
      keys: ['G4', 'C5', 'D5'],
      rootKey: 'G4',
    },
    scale: {
      name: 'Sol Mixolídio / Pentatônica',
      mode: 'Suspenso',
      notes: ['G', 'A', 'C', 'D', 'F'],
      description: 'Suspende a tensão antes do G, prolongando a expectativa em baladas.',
      soloingTips: 'Segure a nota C e solte-a para a nota B ao resolver no G.',
    },
  },
  'Gm': {
    id: 'Gm',
    name: 'Gm (Sol Menor)',
    root: 'G',
    quality: 'minor',
    symbol: 'Gm',
    notes: ['G2', 'D3', 'G3', 'Bb3', 'D4', 'G4'],
    noteNames: ['G', 'Bb', 'D'],
    guitar: {
      frets: [3, 5, 5, 3, 3, 3],
      fingers: [1, 3, 4, 1, 1, 1],
      baseFret: 3,
      barre: { fret: 3, fromString: 6, toString: 1 },
    },
    piano: {
      keys: ['G4', 'Bb4', 'D5'],
      rootKey: 'G4',
    },
    scale: {
      name: 'Sol Menor Natural (Eólio) & Pentatônica Menor',
      mode: 'Eólio',
      notes: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
      description: 'Misterioso e envolvente, comum no Rock clássico e Pop moderno.',
      soloingTips: 'Pentatônica de Gm (G Bb C D F) com vibrato sustentado.',
    },
  },

  // A CHORDS
  'Am': {
    id: 'Am',
    name: 'Am (Lá Menor)',
    root: 'A',
    quality: 'minor',
    symbol: 'Am',
    notes: ['A2', 'E3', 'A3', 'C4', 'E4'],
    noteNames: ['A', 'C', 'E'],
    guitar: {
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: [null, 0, 2, 3, 1, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'C5', 'E5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Lá Menor Natural (Eólio) & Pentatônica Menor',
      mode: 'Eólio / Pentatônica Menor',
      notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      description: 'Relativo menor de C (grau vi). O acorde mais amado do Rock, Pop e Baladas.',
      soloingTips: 'A clássica Pentatônica de Lá Menor (A C D E G) é o padrão ouro para solos de guitarra e violão.',
    },
  },
  'Am7': {
    id: 'Am7',
    name: 'Am7 (Lá Menor com Sétima)',
    root: 'A',
    quality: 'm7',
    symbol: 'Am7',
    notes: ['A2', 'E3', 'G3', 'C4', 'E4'],
    noteNames: ['A', 'C', 'E', 'G'],
    guitar: {
      frets: [-1, 0, 2, 0, 1, 0],
      fingers: [null, 0, 2, 0, 1, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'C5', 'E5', 'G5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Lá Dórico / Lá Eólio',
      mode: 'Dórico / Eólio',
      notes: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'],
      description: 'Suave, com textura aberta e moderna, ideal para arranjos lentos e intimistas.',
      soloingTips: 'O tom aberto da 7ª (G) permite cantar notas sustentadas com conforto.',
    },
  },
  'A': {
    id: 'A',
    name: 'A (Lá Maior)',
    root: 'A',
    quality: 'major',
    symbol: 'A',
    notes: ['A2', 'E3', 'A3', 'C#4', 'E4'],
    noteNames: ['A', 'C#', 'E'],
    guitar: {
      frets: [-1, 0, 2, 2, 2, 0],
      fingers: [null, 0, 1, 2, 3, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'C#5', 'E5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Lá Maior (Jônio) & Pentatônica Maior',
      mode: 'Jônio',
      notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      description: 'Enérgico, aberto e brilhante, excelente para refrões marcantes no Rock e Pop.',
      soloingTips: 'Pentatônica de Lá Maior (A B C# E F#) traz vivacidade imediata.',
    },
  },
  'A7': {
    id: 'A7',
    name: 'A7 (Lá com Sétima)',
    root: 'A',
    quality: '7',
    symbol: 'A7',
    notes: ['A2', 'E3', 'G3', 'C#4', 'E4'],
    noteNames: ['A', 'C#', 'E', 'G'],
    guitar: {
      frets: [-1, 0, 2, 0, 2, 0],
      fingers: [null, 0, 2, 0, 3, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'C#5', 'E5', 'G5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Lá Mixolídio',
      mode: 'Mixolídio',
      notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G'],
      description: 'Dominante que conduz diretamente para Dm ou D.',
      soloingTips: 'A nota C# conduz com precisão para o Ré.',
    },
  },
  'Asus4': {
    id: 'Asus4',
    name: 'Asus4 (Lá Suspenso)',
    root: 'A',
    quality: 'sus4',
    symbol: 'Asus4',
    notes: ['A2', 'E3', 'A3', 'D4', 'E4'],
    noteNames: ['A', 'D', 'E'],
    guitar: {
      frets: [-1, 0, 2, 2, 3, 0],
      fingers: [null, 0, 1, 2, 4, 0],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'D5', 'E5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Lá Mixolídio / Pentatônica',
      mode: 'Suspenso',
      notes: ['A', 'B', 'D', 'E', 'G'],
      description: 'Movimento melódico clássico alternando Asus4 e A ou Am.',
      soloingTips: 'Enfatize a descida da nota D para C# (ou C natural).',
    },
  },

  // B CHORDS
  'B': {
    id: 'B',
    name: 'B (Si Maior)',
    root: 'B',
    quality: 'major',
    symbol: 'B',
    notes: ['B2', 'F#3', 'B3', 'D#4', 'F#4'],
    noteNames: ['B', 'D#', 'F#'],
    guitar: {
      frets: [-1, 2, 4, 4, 4, 2],
      fingers: [null, 1, 2, 3, 4, 1],
      baseFret: 2,
      barre: { fret: 2, fromString: 5, toString: 1 },
    },
    piano: {
      keys: ['B4', 'D#5', 'F#5'],
      rootKey: 'B4',
    },
    scale: {
      name: 'Si Maior (Jônio)',
      mode: 'Jônio',
      notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
      description: 'Luminoso e intenso, dominante no tom de Mi Maior (E).',
      soloingTips: 'Arpejos de B maior e escala maior de B.',
    },
  },
  'Bm': {
    id: 'Bm',
    name: 'Bm (Si Menor)',
    root: 'B',
    quality: 'minor',
    symbol: 'Bm',
    notes: ['B2', 'F#3', 'B3', 'D4', 'F#4'],
    noteNames: ['B', 'D', 'F#'],
    guitar: {
      frets: [-1, 2, 4, 4, 3, 2],
      fingers: [null, 1, 3, 4, 2, 1],
      baseFret: 2,
      barre: { fret: 2, fromString: 5, toString: 1 },
    },
    piano: {
      keys: ['B4', 'D5', 'F#5'],
      rootKey: 'B4',
    },
    scale: {
      name: 'Si Menor Natural (Eólio) & Pentatônica Menor',
      mode: 'Eólio / Pentatônica',
      notes: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
      description: 'Tristeza profunda e elegante (grau vi em Ré Maior ou iii em Sol).',
      soloingTips: 'Pentatônica de Si Menor (B D E F# A).',
    },
  },
  'B7': {
    id: 'B7',
    name: 'B7 (Si com Sétima)',
    root: 'B',
    quality: '7',
    symbol: 'B7',
    notes: ['B2', 'D#3', 'A3', 'B3', 'F#4'],
    noteNames: ['B', 'D#', 'F#', 'A'],
    guitar: {
      frets: [-1, 2, 1, 2, 0, 2],
      fingers: [null, 2, 1, 3, 0, 4],
      baseFret: 1,
    },
    piano: {
      keys: ['B4', 'D#5', 'F#5', 'A5'],
      rootKey: 'B4',
    },
    scale: {
      name: 'Si Mixolídio / Si Harmônico Menor',
      mode: 'Mixolídio / Harmônica',
      notes: ['B', 'C', 'D#', 'E', 'F#', 'G', 'A'],
      description: 'Dominante de Mi Menor (Em). Essencial no Rock acústico e baladas.',
      soloingTips: 'A nota D# resolve com força na tônica E.',
    },
  },

  // Bb / Eb / Ab ADDITIONAL POPULAR CHORDS
  'Bb': {
    id: 'Bb',
    name: 'Bb (Si Bemol Maior)',
    root: 'Bb',
    quality: 'major',
    symbol: 'Bb',
    notes: ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
    noteNames: ['Bb', 'D', 'F'],
    guitar: {
      frets: [-1, 1, 3, 3, 3, 1],
      fingers: [null, 1, 2, 3, 4, 1],
      baseFret: 1,
      barre: { fret: 1, fromString: 5, toString: 1 },
    },
    piano: {
      keys: ['Bb4', 'D5', 'F5'],
      rootKey: 'Bb4',
    },
    scale: {
      name: 'Si Bemol Maior / Mixolídio em Fá',
      mode: 'Jônio / Mixolídio',
      notes: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
      description: 'O famoso acorde bVII no Rock (Subtônica em C), dá peso e estilo rock 70s/90s.',
      soloingTips: 'Use a escala Mixolídia de Dó ou Pentatônica de Bb para riffs clássicos.',
    },
  },
  'C5': {
    id: 'C5',
    name: 'C5 (Power Chord Dó)',
    root: 'C',
    quality: '5',
    symbol: 'C5',
    notes: ['C3', 'G3', 'C4'],
    noteNames: ['C', 'G'],
    guitar: {
      frets: [-1, 3, 5, 5, -1, -1],
      fingers: [null, 1, 3, 4, null, null],
      baseFret: 3,
    },
    piano: {
      keys: ['C4', 'G4', 'C5'],
      rootKey: 'C4',
    },
    scale: {
      name: 'Pentatônica de Dó & Modo Dórico/Mixolídio',
      mode: 'Power Chord / Pentatônica',
      notes: ['C', 'D', 'Eb', 'E', 'F', 'G', 'A', 'Bb'],
      description: 'Sem terça (neutro), puro peso e distorção ideal para riffs de Rock enérgicos.',
      soloingTips: 'Funciona perfeitamente tanto com pentatônica maior quanto menor de Dó!',
    },
  },
  'G5': {
    id: 'G5',
    name: 'G5 (Power Chord Sol)',
    root: 'G',
    quality: '5',
    symbol: 'G5',
    notes: ['G2', 'D3', 'G3'],
    noteNames: ['G', 'D'],
    guitar: {
      frets: [3, 5, 5, -1, -1, -1],
      fingers: [1, 3, 4, null, null, null],
      baseFret: 3,
    },
    piano: {
      keys: ['G4', 'D5', 'G5'],
      rootKey: 'G4',
    },
    scale: {
      name: 'Pentatônica de Sol & Modo Mixolídio',
      mode: 'Power Chord',
      notes: ['G', 'A', 'Bb', 'B', 'C', 'D', 'F'],
      description: 'Base sólida e pesada para rock moderno e alternativo.',
      soloingTips: 'Alterne entre palhetadas abafadas (palm mute) e abertas.',
    },
  },
  'A5': {
    id: 'A5',
    name: 'A5 (Power Chord Lá)',
    root: 'A',
    quality: '5',
    symbol: 'A5',
    notes: ['A2', 'E3', 'A3'],
    noteNames: ['A', 'E'],
    guitar: {
      frets: [-1, 0, 2, 2, -1, -1],
      fingers: [null, 0, 1, 2, null, null],
      baseFret: 1,
    },
    piano: {
      keys: ['A4', 'E5', 'A5'],
      rootKey: 'A4',
    },
    scale: {
      name: 'Pentatônica Menor de Lá (Blues / Rock)',
      mode: 'Power Chord',
      notes: ['A', 'C', 'D', 'D#', 'E', 'G'],
      description: 'O power chord mais clássico da história do Rock.',
      soloingTips: 'Adicione a "blue note" (D# / Eb) para dar agressividade ao solo.',
    },
  },
  'E5': {
    id: 'E5',
    name: 'E5 (Power Chord Mi)',
    root: 'E',
    quality: '5',
    symbol: 'E5',
    notes: ['E2', 'B2', 'E3'],
    noteNames: ['E', 'B'],
    guitar: {
      frets: [0, 2, 2, -1, -1, -1],
      fingers: [0, 1, 2, null, null, null],
      baseFret: 1,
    },
    piano: {
      keys: ['E4', 'B4', 'E5'],
      rootKey: 'E4',
    },
    scale: {
      name: 'Pentatônica de Mi Menor / Blues de Mi',
      mode: 'Power Chord',
      notes: ['E', 'G', 'A', 'Bb', 'B', 'D'],
      description: 'Máximo peso com corda grave solta, sustentação pura de Rock.',
      soloingTips: 'Riffs pesados com a corda E solta e puxadas na 3ª casa (G).',
    },
  },
  'D5': {
    id: 'D5',
    name: 'D5 (Power Chord Ré)',
    root: 'D',
    quality: '5',
    symbol: 'D5',
    notes: ['D3', 'A3', 'D4'],
    noteNames: ['D', 'A'],
    guitar: {
      frets: [-1, -1, 0, 2, 3, -1],
      fingers: [null, null, 0, 1, 2, null],
      baseFret: 1,
    },
    piano: {
      keys: ['D4', 'A4', 'D5'],
      rootKey: 'D4',
    },
    scale: {
      name: 'Pentatônica de Ré / Dórico',
      mode: 'Power Chord',
      notes: ['D', 'F', 'G', 'A', 'C'],
      description: 'Power chord firme, ótimo elo de ligação entre C5 e E5.',
      soloingTips: 'Solos diretos na pentatônica de Ré.',
    },
  },
};

export const GENRE_PRESETS: Record<Genre, SavedProgression[]> = {
  pop: [
    {
      id: 'pop-1',
      name: 'Os 4 Acordes Mágicos do Pop',
      description: 'A progressão mais famosa da história do Pop mundial (I - V - vi - IV).',
      genre: 'pop',
      chords: [CHORD_DATABASE['C'], CHORD_DATABASE['G'], CHORD_DATABASE['Am'], CHORD_DATABASE['F']],
      tempoBpm: 118,
      instrument: 'piano',
      createdAt: Date.now() - 100000,
      isPreset: true,
    },
    {
      id: 'pop-2',
      name: 'Pop Moderno & Emocional',
      description: 'Sequência envolvente com Nona e 7ª Maior (vi - IV - I - V).',
      genre: 'pop',
      chords: [CHORD_DATABASE['Am'], CHORD_DATABASE['Fmaj7'], CHORD_DATABASE['Cadd9'], CHORD_DATABASE['G']],
      tempoBpm: 105,
      instrument: 'guitar',
      createdAt: Date.now() - 90000,
      isPreset: true,
    },
    {
      id: 'pop-3',
      name: 'Doo-Wop & Pop Clássico',
      description: 'A marcha clássica dos sucessos dos anos 50 e 60 (I - vi - IV - V).',
      genre: 'pop',
      chords: [CHORD_DATABASE['C'], CHORD_DATABASE['Am'], CHORD_DATABASE['F'], CHORD_DATABASE['G7']],
      tempoBpm: 112,
      instrument: 'piano',
      createdAt: Date.now() - 80000,
      isPreset: true,
    },
  ],
  rock: [
    {
      id: 'rock-1',
      name: 'Rock Clássico Energético',
      description: 'A base atemporal de hinos do Rock mundial (I - IV - V - IV).',
      genre: 'rock',
      chords: [CHORD_DATABASE['A'], CHORD_DATABASE['D'], CHORD_DATABASE['E'], CHORD_DATABASE['D']],
      tempoBpm: 132,
      instrument: 'guitar',
      createdAt: Date.now() - 70000,
      isPreset: true,
    },
    {
      id: 'rock-2',
      name: 'Grunge & Rock Alternativo',
      description: 'Power chords com sensação pesada e agressiva (i - VI - III - VII).',
      genre: 'rock',
      chords: [CHORD_DATABASE['E5'], CHORD_DATABASE['C5'], CHORD_DATABASE['G5'], CHORD_DATABASE['D5']],
      tempoBpm: 126,
      instrument: 'guitar',
      createdAt: Date.now() - 60000,
      isPreset: true,
    },
    {
      id: 'rock-3',
      name: 'Rock com Subtônica bVII',
      description: 'O som britânico clássico com o acorde Bb (I - bVII - IV - I).',
      genre: 'rock',
      chords: [CHORD_DATABASE['C'], CHORD_DATABASE['Bb'], CHORD_DATABASE['F'], CHORD_DATABASE['C']],
      tempoBpm: 120,
      instrument: 'guitar',
      createdAt: Date.now() - 50000,
      isPreset: true,
    },
  ],
  ballad: [
    {
      id: 'ballad-1',
      name: 'Balada Romântica Emocional',
      description: 'Harmonia rica e profunda com o surpreendente "iv menor" (I - V/B - vi - iv menor).',
      genre: 'ballad',
      chords: [CHORD_DATABASE['Cmaj7'], CHORD_DATABASE['G'], CHORD_DATABASE['Am7'], CHORD_DATABASE['Fm']],
      tempoBpm: 76,
      instrument: 'piano',
      createdAt: Date.now() - 40000,
      isPreset: true,
    },
    {
      id: 'ballad-2',
      name: 'Balada Acústica Intimista',
      description: 'Perfeita para violão de dedo com acordes abertos com Nona (I - iii - vi - IV).',
      genre: 'ballad',
      chords: [CHORD_DATABASE['Cadd9'], CHORD_DATABASE['Em7'], CHORD_DATABASE['Am7'], CHORD_DATABASE['Fmaj7']],
      tempoBpm: 82,
      instrument: 'guitar',
      createdAt: Date.now() - 30000,
      isPreset: true,
    },
    {
      id: 'ballad-3',
      name: 'Cadência Elegante Jazz-Ballad',
      description: 'A clássica progressão circular com sétimas suaves (ii - V - I - vi).',
      genre: 'ballad',
      chords: [CHORD_DATABASE['Dm7'], CHORD_DATABASE['G7'], CHORD_DATABASE['Cmaj7'], CHORD_DATABASE['Am7']],
      tempoBpm: 72,
      instrument: 'piano',
      createdAt: Date.now() - 20000,
      isPreset: true,
    },
  ],
  blues: [
    {
      id: 'blues-1',
      name: 'Blues Tradicional de 12 Compassos',
      description: 'A estrutura base do Blues e R&B com acordes dominantes de 7ª.',
      genre: 'blues',
      chords: [CHORD_DATABASE['A7'], CHORD_DATABASE['D7'], CHORD_DATABASE['A7'], CHORD_DATABASE['E7']],
      tempoBpm: 96,
      instrument: 'guitar',
      createdAt: Date.now() - 10000,
      isPreset: true,
    },
  ],
  acoustic: [
    {
      id: 'acoustic-1',
      name: 'Folk Acústico Suave',
      description: 'Dedilhados abertos e fáceis de tocar (I - V - vi - IV).',
      genre: 'acoustic',
      chords: [CHORD_DATABASE['G'], CHORD_DATABASE['D'], CHORD_DATABASE['Em7'], CHORD_DATABASE['Cadd9']],
      tempoBpm: 88,
      instrument: 'guitar',
      createdAt: Date.now() - 5000,
      isPreset: true,
    },
  ],
  jazz: [
    {
      id: 'jazz-1',
      name: 'Jazz ii - V - I Essencial',
      description: 'O pilar fundamental da harmonia moderna com sétimas sofisticadas.',
      genre: 'jazz',
      chords: [CHORD_DATABASE['Dm7'], CHORD_DATABASE['G7'], CHORD_DATABASE['Cmaj7'], CHORD_DATABASE['A7']],
      tempoBpm: 110,
      instrument: 'piano',
      createdAt: Date.now(),
      isPreset: true,
    },
  ],
};

// Initial starter chord recommendations per genre when timeline is empty
export function getStarterChordsForGenre(genre: Genre): ChordDefinition[] {
  switch (genre) {
    case 'rock':
      return [
        CHORD_DATABASE['E5'],
        CHORD_DATABASE['A'],
        CHORD_DATABASE['C'],
        CHORD_DATABASE['E'],
        CHORD_DATABASE['G'],
        CHORD_DATABASE['D'],
      ];
    case 'ballad':
      return [
        CHORD_DATABASE['Cmaj7'],
        CHORD_DATABASE['Am'],
        CHORD_DATABASE['Cadd9'],
        CHORD_DATABASE['Em7'],
        CHORD_DATABASE['Dm7'],
        CHORD_DATABASE['Fmaj7'],
      ];
    case 'pop':
    default:
      return [
        CHORD_DATABASE['C'],
        CHORD_DATABASE['G'],
        CHORD_DATABASE['Am'],
        CHORD_DATABASE['F'],
        CHORD_DATABASE['Cadd9'],
        CHORD_DATABASE['Em'],
      ];
  }
}

// Transition Matrix for next chord recommendations based on current chord and genre
interface TransitionRule {
  target: string;
  score: number;
  reason: string;
  tag: string;
  genres: Genre[];
  mood: string;
}

const TRANSITION_RULES: Record<string, TransitionRule[]> = {
  'C': [
    { target: 'G', score: 98, reason: 'Dominante principal (V) - o caminho natural do Pop e Rock', tag: 'Mais Popular', genres: ['pop', 'rock', 'ballad'], mood: 'Energético e Conduzente' },
    { target: 'Am', score: 95, reason: 'Relativo Menor (vi) - cria transição emocional e melancólica', tag: 'Variação Emocional', genres: ['pop', 'ballad'], mood: 'Nostálgico e Suave' },
    { target: 'F', score: 92, reason: 'Subdominante (IV) - abre a sonoridade com esperança', tag: 'Abertura Harmônica', genres: ['pop', 'rock', 'ballad'], mood: 'Luminoso e Aberto' },
    { target: 'Em', score: 85, reason: 'Grau iii - movimento suave que mantém a calma', tag: 'Ponte Serena', genres: ['ballad', 'pop'], mood: 'Introspectivo' },
    { target: 'Bb', score: 82, reason: 'Subtônica (bVII) - o clássico acorde de impacto do Rock', tag: 'Efeito Rock', genres: ['rock'], mood: 'Pesado e Marcante' },
    { target: 'C7', score: 80, reason: 'Transforma a tônica em dominante para chamar o Fá (F)', tag: 'Tensão Dinâmica', genres: ['blues', 'rock', 'pop'], mood: 'Expectativa Forte' },
  ],
  'G': [
    { target: 'Am', score: 96, reason: 'Resolução Deceptiva (V -> vi) - surpresa emocional que continua a canção', tag: 'Surpresa Emocional', genres: ['pop', 'ballad'], mood: 'Sensível e Envolvente' },
    { target: 'C', score: 95, reason: 'Resolução Tônica Perfeita (V -> I) - sensação de volta ao lar', tag: 'Resolução Perfeita', genres: ['pop', 'rock', 'ballad'], mood: 'Estável e Finalizador' },
    { target: 'Em', score: 90, reason: 'Cai no baixo relativo menor de Sol', tag: 'Descida Suave', genres: ['pop', 'ballad', 'acoustic'], mood: 'Aconchegante' },
    { target: 'F', score: 88, reason: 'Recuo de tom no Rock (V -> IV) característico dos anos 70 e 90', tag: 'Groove Rock', genres: ['rock', 'pop'], mood: 'Descontraído' },
    { target: 'D', score: 80, reason: 'Movimento ascendente de quinta (G -> D)', tag: 'Elevação', genres: ['rock'], mood: 'Triunfante' },
    { target: 'Gsus4', score: 78, reason: 'Suspende a tensão antes da resolução final', tag: 'Ornamento', genres: ['ballad', 'pop'], mood: 'Expectativa' },
  ],
  'Am': [
    { target: 'F', score: 98, reason: 'Subdominante (vi -> IV) - a transição mais marcante e épica do Pop', tag: 'Mais Popular', genres: ['pop', 'ballad', 'rock'], mood: 'Épico e Emocionante' },
    { target: 'G', score: 92, reason: 'Condução harmônica (vi -> V) subindo a energia do refrão', tag: 'Subida de Energia', genres: ['rock', 'pop'], mood: 'Impulso Forte' },
    { target: 'Em', score: 88, reason: 'Descida menor profunda (vi -> iii)', tag: 'Melancolia Profunda', genres: ['ballad', 'rock'], mood: 'Sombrio e Belo' },
    { target: 'Dm', score: 85, reason: 'Movimento para o grau ii menor (vi -> ii)', tag: 'Caminho Circular', genres: ['ballad', 'pop'], mood: 'Introspectivo' },
    { target: 'C', score: 84, reason: 'Retorno ao centro maior (vi -> I)', tag: 'Retorno ao Maior', genres: ['pop', 'ballad'], mood: 'Esperançoso' },
    { target: 'E7', score: 82, reason: 'Dominante menor harmônica preparando o retorno triunfal ao Am', tag: 'Tensão Dramática', genres: ['ballad', 'rock', 'acoustic'], mood: 'Dramático' },
  ],
  'F': [
    { target: 'G', score: 98, reason: 'Condução clássica Subdominante -> Dominante (IV -> V) que prepara o clímax', tag: 'Subida ao Clímax', genres: ['pop', 'rock', 'ballad'], mood: 'Crescendo Emocionante' },
    { target: 'C', score: 95, reason: 'Cadência Plagal (IV -> I) - o som clássico do "Amém" e baladas suaves', tag: 'Resolução Serena', genres: ['pop', 'ballad', 'rock'], mood: 'Paz e Finalização' },
    { target: 'Fm', score: 89, reason: 'O famoso "iv menor" - empréstimo modal que causa arrepio emocional', tag: 'Empréstimo Modal', genres: ['ballad', 'pop'], mood: 'Super Comovente' },
    { target: 'Am', score: 86, reason: 'Passagem menor (IV -> vi)', tag: 'Contraste Menor', genres: ['pop', 'rock'], mood: 'Misterioso' },
    { target: 'G7', score: 84, reason: 'Acelera a tensão rumo ao Dó', tag: 'Ponte Direta', genres: ['pop', 'ballad'], mood: 'Condução' },
  ],
  'Fm': [
    { target: 'C', score: 99, reason: 'Resolução mágica do iv menor -> I (o ápice emotivo de baladas românticas)', tag: 'Resolução Mágica', genres: ['ballad', 'pop'], mood: 'Arrebatador e Doce' },
    { target: 'Cmaj7', score: 95, reason: 'Cai na sétima maior com extrema elegância', tag: 'Resolução Jazz/Pop', genres: ['ballad'], mood: 'Sofisticado' },
    { target: 'G', score: 82, reason: 'Retorno ao dominante com choque dramático', tag: 'Tensão', genres: ['rock', 'ballad'], mood: 'Intenso' },
  ],
  'Cmaj7': [
    { target: 'Am7', score: 95, reason: 'Transição aveludada mantendo a nota Sol e Mi', tag: 'Fluidez Total', genres: ['ballad', 'pop'], mood: 'Relaxante' },
    { target: 'Fmaj7', score: 94, reason: 'Movimento lídio deslumbrante (Imaj7 -> IVmaj7)', tag: 'Atmosfera dos Sonhos', genres: ['ballad', 'pop'], mood: 'Etéreo e Aéreo' },
    { target: 'Dm7', score: 88, reason: 'Inicia cadência circular suave', tag: 'Suavidade', genres: ['ballad', 'jazz'], mood: 'Charmoso' },
    { target: 'G', score: 85, reason: 'Retorno ao dominante', tag: 'Pilar', genres: ['pop', 'ballad'], mood: 'Firme' },
  ],
  'Cadd9': [
    { target: 'G', score: 96, reason: 'Mantém as duas notas agudas presas no violão (dedilhado moderno)', tag: 'Toque Moderno', genres: ['pop', 'acoustic', 'ballad'], mood: 'Brilhante' },
    { target: 'Em7', score: 92, reason: 'Perfeita continuidade de dedilhado acústico', tag: 'Acústico Puro', genres: ['acoustic', 'pop', 'ballad'], mood: 'Íntimo' },
    { target: 'Am7', score: 90, reason: 'Movimento com notas pedal', tag: 'Elegância', genres: ['pop', 'ballad'], mood: 'Aconchegante' },
    { target: 'Fmaj7', score: 88, reason: 'Abertura para o refrão', tag: 'Expansão', genres: ['pop', 'ballad'], mood: 'Grandioso' },
  ],
  'Dm': [
    { target: 'G', score: 97, reason: 'Cadência padrão ii -> V: o motor harmônico de praticamente toda música ocidental', tag: 'Motor Harmônico', genres: ['pop', 'ballad', 'rock'], mood: 'Direcionado e Natural' },
    { target: 'G7', score: 94, reason: 'Prepara resolução com sétima dominante', tag: 'Tensão Padrão', genres: ['ballad', 'pop', 'blues'], mood: 'Expectativa Forte' },
    { target: 'Am', score: 88, reason: 'Subida em graus conjuntos para o relativo menor', tag: 'Crescente', genres: ['rock', 'ballad'], mood: 'Determinado' },
    { target: 'Bb', score: 84, reason: 'Subida de meio tom para a subtônica no Rock', tag: 'Passagem Rock', genres: ['rock'], mood: 'Enérgico' },
    { target: 'C', score: 80, reason: 'Resolução direta no centro', tag: 'Retorno', genres: ['pop'], mood: 'Tranquilo' },
  ],
  'Dm7': [
    { target: 'G7', score: 99, reason: 'O lendário ii7 -> V7 do Jazz, Balada e Soul', tag: 'Padrão Ouro', genres: ['ballad', 'pop', 'jazz'], mood: 'Aveludado e Seguro' },
    { target: 'Cmaj7', score: 91, reason: 'Salto direto para a tônica com 7ª', tag: 'Resolução Direta', genres: ['ballad'], mood: 'Calmo' },
    { target: 'Em7', score: 86, reason: 'Subida suave em terças', tag: 'Passo a Passo', genres: ['ballad'], mood: 'Leve' },
  ],
  'Em': [
    { target: 'F', score: 95, reason: 'Passagem de meio tom (iii -> IV) criando elevação imediata', tag: 'Elevação Instantânea', genres: ['pop', 'rock', 'ballad'], mood: 'Esperançoso' },
    { target: 'Am', score: 94, reason: 'Salto de quarta para o vi menor', tag: 'Conexão Menor', genres: ['pop', 'rock', 'ballad'], mood: 'Firme' },
    { target: 'C', score: 89, reason: 'Retorno ao centro tonal de Dó Maior', tag: 'Base Tônica', genres: ['pop', 'rock'], mood: 'Seguro' },
    { target: 'D', score: 85, reason: 'Descida de tom típica do Rock clássico', tag: 'Rock Clássico', genres: ['rock'], mood: 'Estradeiro' },
    { target: 'B7', score: 82, reason: 'Dominante secundário que energiza o Mi Menor', tag: 'Tensão Forte', genres: ['ballad', 'acoustic'], mood: 'Passional' },
  ],
  'Em7': [
    { target: 'A7', score: 92, reason: 'Condução secundária ii -> V rumo a D', tag: 'Transição Chique', genres: ['ballad', 'pop'], mood: 'Sofisticado' },
    { target: 'Am7', score: 90, reason: 'Movimento em graus conjuntos de menores', tag: 'Fluidez', genres: ['ballad', 'pop'], mood: 'Sereno' },
    { target: 'Cadd9', score: 88, reason: 'Retorno ao brilho de Dó', tag: 'Abertura', genres: ['acoustic', 'ballad'], mood: 'Doce' },
  ],
  'E': [
    { target: 'A', score: 98, reason: 'Dominante -> Tônica no tom de Lá Maior (V -> I)', tag: 'Resolução Triunfal', genres: ['rock', 'pop', 'blues'], mood: 'Explosivo' },
    { target: 'D', score: 90, reason: 'O famoso movimento de Rock (V -> IV)', tag: 'Riff Clássico', genres: ['rock'], mood: 'Energia Pura' },
    { target: 'Am', score: 86, reason: 'Resolução menor dramática', tag: 'Reviravolta', genres: ['ballad', 'rock'], mood: 'Tenso' },
  ],
  'A': [
    { target: 'D', score: 97, reason: 'Condução para o IV grau (A -> D), a espinha dorsal do Rock e Pop', tag: 'Mais Popular', genres: ['rock', 'pop'], mood: 'Aberto e Triunfal' },
    { target: 'E', score: 95, reason: 'Subida ao dominante (I -> V) para criar o ápice', tag: 'Construção', genres: ['rock', 'pop'], mood: 'Vibrante' },
    { target: 'F#m', score: 90, reason: 'Queda no relativo menor (vi)', tag: 'Contraste', genres: ['pop', 'ballad'], mood: 'Emotivo' },
    { target: 'G', score: 84, reason: 'Subtônica bVII no Rock', tag: 'Groove Rock', genres: ['rock'], mood: 'Despojado' },
  ],
  'D': [
    { target: 'G', score: 97, reason: 'Condução I -> IV ou V -> I', tag: 'Mais Popular', genres: ['pop', 'rock', 'acoustic'], mood: 'Alegre e Solar' },
    { target: 'A', score: 95, reason: 'Subida ao dominante (IV -> V)', tag: 'Subida Forte', genres: ['rock', 'pop'], mood: 'Grandioso' },
    { target: 'Bm', score: 90, reason: 'Queda no relativo menor de Ré', tag: 'Toque Romântico', genres: ['ballad', 'pop'], mood: 'Emocionante' },
    { target: 'C', score: 82, reason: 'Acorde bVII no tom de Ré (estilo Beatles / Rock)', tag: 'Som Vintage', genres: ['rock'], mood: 'Inovador' },
  ],
  'Bm': [
    { target: 'G', score: 96, reason: 'Movimento vi -> IV no tom de Ré Maior', tag: 'Mais Popular', genres: ['pop', 'ballad', 'rock'], mood: 'Aberto e Livre' },
    { target: 'A', score: 92, reason: 'Subida ao dominante', tag: 'Energia', genres: ['rock', 'pop'], mood: 'Determinado' },
    { target: 'Em', score: 88, reason: 'Passagem menor suave', tag: 'Serenidade', genres: ['ballad'], mood: 'Profundo' },
    { target: 'F#7', score: 84, reason: 'Dominante de Si Menor', tag: 'Dramático', genres: ['ballad', 'rock'], mood: 'Intenso' },
  ],
  // Power chords
  'E5': [
    { target: 'C5', score: 96, reason: 'Salto pesado de terça menor (estilo Metallica/Nirvana)', tag: 'Riff Pesado', genres: ['rock'], mood: 'Agressivo e Enérgico' },
    { target: 'G5', score: 94, reason: 'Subida de terça menor para Sol', tag: 'Impulso Rock', genres: ['rock'], mood: 'Poderoso' },
    { target: 'A5', score: 92, reason: 'Quarta justa ascendente', tag: 'Dinâmico', genres: ['rock'], mood: 'Veloz' },
    { target: 'D5', score: 88, reason: 'Passagem descendente', tag: 'Contínuo', genres: ['rock'], mood: 'Firme' },
  ],
  'C5': [
    { target: 'G5', score: 97, reason: 'Quinta justa dominante de peso', tag: 'Mais Popular', genres: ['rock'], mood: 'Grandioso' },
    { target: 'A5', score: 94, reason: 'Queda no relativo menor de peso', tag: 'Contraste Rock', genres: ['rock'], mood: 'Marcante' },
    { target: 'D5', score: 90, reason: 'Subida de tom firme', tag: 'Aceleração', genres: ['rock'], mood: 'Determinado' },
  ],
  'A5': [
    { target: 'D5', score: 98, reason: 'Condução para o IV grau (A5 -> D5)', tag: 'Mais Popular', genres: ['rock'], mood: 'Potente' },
    { target: 'E5', score: 95, reason: 'Subida para o dominante com grave solto', tag: 'Ápice', genres: ['rock'], mood: 'Explosivo' },
    { target: 'G5', score: 92, reason: 'Descida de tom para a subtônica', tag: 'Groove', genres: ['rock'], mood: 'Marcante' },
    { target: 'C5', score: 90, reason: 'Terça menor (som anos 90)', tag: 'Rock Alternativo', genres: ['rock'], mood: 'Sombrio' },
  ],
  'G5': [
    { target: 'D5', score: 96, reason: 'Descida de quarta / quinta invertida', tag: 'Mais Popular', genres: ['rock'], mood: 'Poderoso' },
    { target: 'C5', score: 94, reason: 'Resolução para Dó', tag: 'Base Tônica', genres: ['rock'], mood: 'Firme' },
    { target: 'A5', score: 91, reason: 'Subida de tom enérgica', tag: 'Condução', genres: ['rock'], mood: 'Rápido' },
  ],
  'D5': [
    { target: 'G5', score: 96, reason: 'Resolução ou abertura', tag: 'Mais Popular', genres: ['rock'], mood: 'Aberto' },
    { target: 'A5', score: 95, reason: 'Subida ao dominante A5', tag: 'Crescendo', genres: ['rock'], mood: 'Firme' },
    { target: 'C5', score: 91, reason: 'Descida de tom no rock clássico', tag: 'Retorno', genres: ['rock'], mood: 'Pesado' },
    { target: 'E5', score: 88, reason: 'Subida ao Mi grave', tag: 'Graves', genres: ['rock'], mood: 'Pesadíssimo' },
  ],
};

// Compute smart suggestions for the next chord
export function getNextChordSuggestions(
  currentChords: ChordDefinition[],
  genre: Genre
): ChordSuggestion[] {
  if (currentChords.length === 0) {
    // Return starter chords for this genre
    const starters = getStarterChordsForGenre(genre);
    return starters.map((chord, idx) => ({
      chord,
      reason: idx === 0 ? 'Excelente acorde inicial para ' + getGenreLabel(genre) : 'Opção de abertura tonal sólida',
      tag: idx === 0 ? 'Recomendado' : 'Opção Inicial',
      genreMatch: [genre],
      score: 100 - idx * 5,
      moodDescription: chord.scale.description,
    }));
  }

  const lastChord = currentChords[currentChords.length - 1];
  const rules = TRANSITION_RULES[lastChord.id] || [];

  // Filter and sort rules
  const suggestions: ChordSuggestion[] = [];
  const addedIds = new Set<string>();

  // First pass: rules tailored for the selected genre
  rules.forEach((rule) => {
    const chord = CHORD_DATABASE[rule.target];
    if (chord && !addedIds.has(chord.id)) {
      const isGenreMatch = rule.genres.includes(genre);
      const score = rule.score + (isGenreMatch ? 10 : -10);
      suggestions.push({
        chord,
        reason: rule.reason,
        tag: rule.tag,
        genreMatch: rule.genres,
        score,
        moodDescription: rule.mood,
      });
      addedIds.add(chord.id);
    }
  });

  // If we don't have enough suggestions, add common fallback chords
  const fallbackList = ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'Cadd9', 'Fmaj7', 'D', 'A', 'E5', 'C5', 'G5'];
  fallbackList.forEach((id) => {
    if (!addedIds.has(id) && CHORD_DATABASE[id]) {
      const chord = CHORD_DATABASE[id];
      suggestions.push({
        chord,
        reason: `Combinação harmônica versátil com ${lastChord.name}`,
        tag: 'Alternativa Criativa',
        genreMatch: [genre],
        score: 60,
        moodDescription: chord.scale.description,
      });
      addedIds.add(id);
    }
  });

  // Sort by highest score first
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function getGenreLabel(genre: Genre): string {
  switch (genre) {
    case 'rock':
      return 'Rock';
    case 'pop':
      return 'Pop';
    case 'ballad':
      return 'Ballad';
    case 'blues':
      return 'Blues';
    case 'acoustic':
      return 'Acústico';
    case 'jazz':
      return 'Jazz';
    default:
      return genre;
  }
}

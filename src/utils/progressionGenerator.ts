import { ChordDefinition, Genre, InstrumentType, TimelineChordItem, ChordRhythmPattern } from '../types';
import { CHORD_DATABASE, getGenreLabel } from '../data/musicTheory';

export interface GeneratedProgression {
  title: string;
  description: string;
  genre: Genre;
  tempoBpm: number;
  instrument: InstrumentType;
  chords: TimelineChordItem[];
  keyCenter: string;
  cadenceDescription: string;
}

interface ProgressionTemplate {
  name: string;
  description: string;
  chordSymbols: string[];
  keyCenter: string;
  suggestedBpm: number;
  suggestedInstrument: InstrumentType;
  suggestedRhythm: ChordRhythmPattern;
}

// Rich procedural pool of progressions organized by musical genre
const GENRE_PROGRESSION_TEMPLATES: Record<Genre, ProgressionTemplate[]> = {
  pop: [
    {
      name: 'Os 4 Acordes Mágicos',
      description: 'A fórmula mais bem-sucedida do pop mundial (I - V - vi - IV). Usada em centenas de hits.',
      chordSymbols: ['C', 'G', 'Am', 'F'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 118,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Pop Emocional Moderno',
      description: 'Cadência com início melancólico no grau menor e explosão esperançosa (vi - IV - I - V).',
      chordSymbols: ['Am', 'F', 'C', 'G'],
      keyCenter: 'Lá Menor (Am) / Dó Maior (C)',
      suggestedBpm: 120,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Brilho Acústico Pop com Nona',
      description: 'Acordes abertos com adição de nona (add9) para sonoridade moderna e cristalina.',
      chordSymbols: ['Cadd9', 'G', 'Em7', 'F'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 112,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Refrão Eufórico Anthemic',
      description: 'Elevação harmônica com subdominante inicial conduzindo para a tônica (IV - I - vi - V).',
      chordSymbols: ['F', 'C', 'Am', 'G'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 122,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Pop Clássico Retrô 50s',
      description: 'A lendária cadência circular das baladas e rocks dos anos 50 e 60 (I - vi - IV - V).',
      chordSymbols: ['C', 'Am', 'F', 'G'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 108,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Groove Pop em Sol Maior',
      description: 'Caminho harmônico aberto e solar ideal para violão e teclado pop (I - V - vi - IV).',
      chordSymbols: ['G', 'D', 'Em', 'C'],
      keyCenter: 'Sol Maior (G)',
      suggestedBpm: 116,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'syncopated',
    },
  ],

  rock: [
    {
      name: 'Mixolídio Rock & Riff',
      description: 'A alma do Classic Rock com o impacto do acorde bVII (I - bVII - IV - I).',
      chordSymbols: ['A', 'G', 'D', 'A'],
      keyCenter: 'Lá Mixolídio (A)',
      suggestedBpm: 128,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Rock de Estádio Eufórico',
      description: 'Cadência poderosa para refrões grandiosos com overdrive e guitarras abertas.',
      chordSymbols: ['E', 'B', 'C#m', 'A'],
      keyCenter: 'Mi Maior (E)',
      suggestedBpm: 130,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Hard Rock Andaluz Descendente',
      description: 'Tensão épica e dramática descendo em semitons e tons da escala menor.',
      chordSymbols: ['Am', 'G', 'F', 'E'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 124,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Power Chords Rápido 90s',
      description: 'Pegada direta do Grunge e Hard Rock com power chords pesados.',
      chordSymbols: ['E5', 'G5', 'A5', 'C5'],
      keyCenter: 'Mi Menor (E5)',
      suggestedBpm: 136,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Rock Blues Riff em Ré',
      description: 'Cadência de atitude crua alternando tônica e quarta (I - IV - bVII - I).',
      chordSymbols: ['D', 'G', 'C', 'D'],
      keyCenter: 'Ré Maior (D)',
      suggestedBpm: 126,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
  ],

  ballad: [
    {
      name: 'O Mágico "iv Menor" de Balada',
      description: 'Empréstimo modal conmovedor (I - IV - iv - I) que cria arrepio emocional imediato.',
      chordSymbols: ['C', 'F', 'Fm', 'C'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 76,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'whole',
    },
    {
      name: 'Balada Romântica com 7ª Maior',
      description: 'Clima etéreo, aconchegante e suave com acordes maj7 e sétimas menores (Imaj7 - vim7 - iim7 - V).',
      chordSymbols: ['Cmaj7', 'Am7', 'Dm7', 'G'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 78,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'arpeggio',
    },
    {
      name: 'Valsa / Balada em 3/4 Serena',
      description: 'Balanço ternário clássico de baladas românticas e canções nostálgicas.',
      chordSymbols: ['C', 'Em', 'F', 'G'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 84,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'waltz',
    },
    {
      name: 'Descida Emocionante de Baixo',
      description: 'Passagem melancólica suave perfeita para solo lírico e dedilhado de piano.',
      chordSymbols: ['Am', 'Em', 'F', 'C'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 80,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'arpeggio',
    },
  ],

  blues: [
    {
      name: 'Turnaround Blues Clássico de 4 Compassos',
      description: 'A cadência dominante tradicional com sétimas blues em Mi (I7 - IV7 - I7 - V7).',
      chordSymbols: ['E7', 'A7', 'E7', 'B7'],
      keyCenter: 'Mi Blues (E7)',
      suggestedBpm: 96,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Shuffle Blues em Lá',
      description: 'Groove quente de shuffle blues americano com acordes com sétima dominante.',
      chordSymbols: ['A7', 'D7', 'A7', 'E7'],
      keyCenter: 'Lá Blues (A7)',
      suggestedBpm: 104,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Slow Blues Menor Intenso',
      description: 'Blues menor profundo e expressivo com alta carga dramática (B.B. King style).',
      chordSymbols: ['Am', 'Dm', 'Am', 'E7'],
      keyCenter: 'Lá Menor Blues (Am)',
      suggestedBpm: 86,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'waltz',
    },
    {
      name: 'Blues Jazzístico Sofisticado',
      description: 'Sétimas dominantes encadeadas com resolução rápida em cadência de Blues.',
      chordSymbols: ['C7', 'F7', 'C7', 'G7'],
      keyCenter: 'Dó Blues (C7)',
      suggestedBpm: 100,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
  ],

  acoustic: [
    {
      name: 'Folk Acústico em Sol Maior',
      description: 'Dedilhados suaves e acordes abertos fáceis de cantar e tocar (I - V - vi - IV).',
      chordSymbols: ['G', 'D', 'Em', 'C'],
      keyCenter: 'Sol Maior (G)',
      suggestedBpm: 88,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'arpeggio',
    },
    {
      name: 'Campfire Acústico em Dó',
      description: 'Harmonia límpida e acolhedora com transição de terça menor relaxante.',
      chordSymbols: ['C', 'G', 'Am', 'Em'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 92,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Acústico Introspectivo em Ré',
      description: 'Riqueza de harmônicos nas cordas soltas com condução suave.',
      chordSymbols: ['D', 'A', 'G', 'D'],
      keyCenter: 'Ré Maior (D)',
      suggestedBpm: 84,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Bossa Acústica Suave',
      description: 'Balanço sincopado brasileiro com acordes com sétima menor e maior.',
      chordSymbols: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 94,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'syncopated',
    },
  ],

  jazz: [
    {
      name: 'ii - V - I com Dominante Secundário',
      description: 'A cadência definitiva do Jazz e da Bossa Nova (Dm7 -> G7 -> Cmaj7 -> A7).',
      chordSymbols: ['Dm7', 'G7', 'Cmaj7', 'A7'],
      keyCenter: 'Dó Maior (Cmaj7)',
      suggestedBpm: 110,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Turnaround Circular Maior (I - vi - ii - V)',
      description: 'O ciclo harmônico do Bebop e Swing americano com encadeamento suave de sétimas.',
      chordSymbols: ['Cmaj7', 'Am7', 'Dm7', 'G7'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 116,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Jazz Menor Elegante (ii° - V7 - im7)',
      description: 'Tensão e requinte de temas noturnos de Jazz com acorde dominante alterado.',
      chordSymbols: ['Dm7', 'E7', 'Am7', 'Am'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 98,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Bossa & Samba Jazz em Sol',
      description: 'Harmonia sedutora e rica em tensões naturais do jazz brasileiro.',
      chordSymbols: ['G', 'E7', 'Am7', 'D7'],
      keyCenter: 'Sol Maior (G)',
      suggestedBpm: 112,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
  ],

  electronic: [
    {
      name: 'EDM & House Melódico Anthemic',
      description: 'Progressão eufórica com cadência menor para maior épica (vi - IV - I - V).',
      chordSymbols: ['Am', 'F', 'C', 'G'],
      keyCenter: 'Lá Menor (Am) / Dó Maior (C)',
      suggestedBpm: 126,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Synthwave & Retrowave 80s',
      description: 'Atmosfera nostálgica com sintetizadores e acordes suspensos (vi - V - IV - V).',
      chordSymbols: ['Am', 'G', 'F', 'Em'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 118,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Future Bass & Progressive Melodic',
      description: 'Acordes abertos com 7ª e 9ª com grande impacto sonoro e energia.',
      chordSymbols: ['Fmaj7', 'Cadd9', 'G', 'Am7'],
      keyCenter: 'Fá Maior (F) / Dó Maior (C)',
      suggestedBpm: 130,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'syncopated',
    },
    {
      name: 'Tropical House & Deep Melodic',
      description: 'Clima solar, refrescante e dançante com cadência envolvente.',
      chordSymbols: ['C', 'Am', 'Em', 'F'],
      keyCenter: 'Dó Maior (C)',
      suggestedBpm: 122,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
  ],

  techno: [
    {
      name: 'Hypnotic Peak-Time Techno (i - bVI)',
      description: 'Tensão pulsante e hipnótica em tom menor com oscilação semidireta.',
      chordSymbols: ['Am', 'F', 'Am', 'Em'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 134,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Dark Industrial Techno Driving Loop',
      description: 'Power chords sombrios e enérgicos com drive constante em alta velocidade.',
      chordSymbols: ['E5', 'C5', 'E5', 'D5'],
      keyCenter: 'Mi Menor (E5)',
      suggestedBpm: 138,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Melodic Techno & Afterlife Vibe',
      description: 'Clima espacial e transcendental em cadência eólica sombria.',
      chordSymbols: ['Am7', 'G', 'Fmaj7', 'Em7'],
      keyCenter: 'Lá Menor (Am)',
      suggestedBpm: 124,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Acid & Raw Techno Minimal Loop',
      description: 'Oscilação tensa de 2 graus gerando sensação de hipnose contínua na pista.',
      chordSymbols: ['A5', 'G5', 'A5', 'F5'],
      keyCenter: 'Lá (A5)',
      suggestedBpm: 136,
      suggestedInstrument: 'piano',
      suggestedRhythm: 'eighths',
    },
  ],

  punk: [
    {
      name: 'Pop Punk Clássico (Blink/Green Day)',
      description: 'Os 3 acordes lendários e velozes do punk pop mundial (I - IV - V - IV).',
      chordSymbols: ['A5', 'D5', 'E5', 'D5'],
      keyCenter: 'Lá (A5)',
      suggestedBpm: 165,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Skate Punk & Hardcore Melódico',
      description: 'Velocidade frenética com cadência emotiva em power chords (vi - IV - I - V).',
      chordSymbols: ['A5', 'F5', 'C5', 'G5'],
      keyCenter: 'Lá Menor (A5) / Dó (C5)',
      suggestedBpm: 178,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'eighths',
    },
    {
      name: 'Post-Punk & New Wave Garage',
      description: 'Riffs secos e angulares com tensão crua e ritmo acelerado.',
      chordSymbols: ['E5', 'G5', 'A5', 'C5'],
      keyCenter: 'Mi (E5)',
      suggestedBpm: 155,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'quarters',
    },
    {
      name: 'Punk Rock 77 Cru & Direto',
      description: 'O som original de Nova York e Londres em 1977 com 3 acordes crus.',
      chordSymbols: ['C5', 'F5', 'G5', 'F5'],
      keyCenter: 'Dó (C5)',
      suggestedBpm: 160,
      suggestedInstrument: 'guitar',
      suggestedRhythm: 'eighths',
    },
  ],
};

/**
 * Procedurally generates a random chord progression specifically tailored
 * to the given genre, with musical variety, proper voicing, tempo, and rhythm.
 */
export function generateRandomProgressionForGenre(
  genre: Genre,
  currentChordsInTimeline?: ChordDefinition[]
): GeneratedProgression {
  const templates = GENRE_PROGRESSION_TEMPLATES[genre] || GENRE_PROGRESSION_TEMPLATES.pop;

  // If there are existing chords, avoid generating the exact same first chord if possible
  const currentFirstSymbol = currentChordsInTimeline?.[0]?.symbol;
  let pool = templates;
  if (currentFirstSymbol && templates.length > 1) {
    const diversePool = templates.filter((t) => t.chordSymbols[0] !== currentFirstSymbol);
    if (diversePool.length > 0) {
      pool = diversePool;
    }
  }

  // Select a random template from the pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedTemplate = pool[randomIndex];

  // Resolve chord definitions safely from CHORD_DATABASE
  const timelineItems: TimelineChordItem[] = selectedTemplate.chordSymbols.map((sym, idx) => {
    const chordDef = CHORD_DATABASE[sym] || CHORD_DATABASE['C'];
    return {
      id: `gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      chord: chordDef,
      durationBeats: 4,
      genreContext: genre,
      octaveOffset: 0,
      rhythmPattern: selectedTemplate.suggestedRhythm,
    };
  });

  return {
    title: `${selectedTemplate.name} (${getGenreLabel(genre)})`,
    description: selectedTemplate.description,
    genre,
    tempoBpm: selectedTemplate.suggestedBpm,
    instrument: selectedTemplate.suggestedInstrument,
    chords: timelineItems,
    keyCenter: selectedTemplate.keyCenter,
    cadenceDescription: selectedTemplate.chordSymbols.join(' - '),
  };
}

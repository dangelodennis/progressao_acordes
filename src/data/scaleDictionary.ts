import { getSemitone, SEMITONE_TO_SHARP_NAME, SEMITONE_TO_FLAT_NAME } from '../utils/melodyGenerator';

export type ScaleCategory =
  | 'greek' // Modos Gregos (Jônio, Dórico, Frígio, Lídio, Mixolídio, Eólio, Lócrio)
  | 'minor_variants' // Menor Harmônica, Menor Melódica, Frígio Dominante, etc.
  | 'pentatonic_blues' // Pentatônicas e Blues
  | 'symmetric_jazz'; // Diminutas, Tons Inteiros, Bebop

export interface ScaleDefinition {
  id: string;
  name: string; // e.g. "Lídio"
  englishName: string; // "Lydian"
  category: ScaleCategory;
  categoryLabel: string;
  intervals: number[]; // semitone offsets from root: e.g. [0, 2, 4, 6, 7, 9, 11]
  intervalNames: string[]; // e.g. ['T', '2M', '3M', '#4', '5J', '6M', '7M']
  intervalFullNames: string[]; // e.g. ['Tônica', '2ª Maior', '3ª Maior', '4ª Aumentada (Trítono)', '5ª Justa', '6ª Maior', '7ª Maior']
  stepPattern: string[]; // e.g. ['1T', '1T', '1T', '½T', '1T', '1T', '½T'] (steps from note to note)
  characteristicIntervalIndex: number; // index of the defining interval (e.g. 3 for #4 in Lydian)
  characteristicIntervalLabel: string; // "4ª Aumentada (#4 / Trítono)"
  mood: string; // "Místico, Brilhante, Espacial"
  description: string; // Detailed theory explanation in Portuguese
  soloingTips: string; // How to improvise with this scale
  chordsCompatible: string[]; // Chord types that love this scale, e.g. ["Xmaj7#11", "X", "Xmaj7"]
  triadsFormula: string[]; // Roman numeral triads in mode: e.g. ["I", "II", "iii", "#iv°", "V", "vi", "vii"]
  tetradsFormula: string[]; // Roman numeral 7th chords: e.g. ["Imaj7", "II7", "iiim7", "#ivm7b5", "Vmaj7", "vim7", "viim7"]
  famousExamples?: string; // e.g. "Tema dos Simpsons, E.T. (John Williams)"
}

export interface ScaleNoteInfo {
  note: string; // e.g. "C", "F#"
  solfege: string; // e.g. "Dó", "Fá#"
  pitchWithOctave: string; // e.g. "C4", "F#4"
  midi: number;
  intervalName: string; // e.g. "T", "#4", "7M"
  intervalFullName: string; // e.g. "4ª Aumentada (Trítono)"
  semitonesFromRoot: number; // 0, 6, etc.
  stepFromPrev: string; // "1T", "½T", "1½T"
  isRoot: boolean;
  isCharacteristic: boolean;
}

export const ROOT_KEY_OPTIONS: { note: string; label: string; solfege: string; preferFlats: boolean }[] = [
  { note: 'C', label: 'C (Dó)', solfege: 'Dó', preferFlats: false },
  { note: 'Db', label: 'Db / C# (Réb / Dó#)', solfege: 'Réb', preferFlats: true },
  { note: 'D', label: 'D (Ré)', solfege: 'Ré', preferFlats: false },
  { note: 'Eb', label: 'Eb (Mib)', solfege: 'Mib', preferFlats: true },
  { note: 'E', label: 'E (Mi)', solfege: 'Mi', preferFlats: false },
  { note: 'F', label: 'F (Fá)', solfege: 'Fá', preferFlats: true },
  { note: 'F#', label: 'F# / Gb (Fá# / Solb)', solfege: 'Fá#', preferFlats: false },
  { note: 'G', label: 'G (Sol)', solfege: 'Sol', preferFlats: false },
  { note: 'Ab', label: 'Ab (Láb)', solfege: 'Láb', preferFlats: true },
  { note: 'A', label: 'A (Lá)', solfege: 'Lá', preferFlats: false },
  { note: 'Bb', label: 'Bb (Sib)', solfege: 'Sib', preferFlats: true },
  { note: 'B', label: 'B (Si)', solfege: 'Si', preferFlats: false },
];

export const NOTE_TO_PORTUGUESE_SOLFEGE: Record<string, string> = {
  'C': 'Dó',
  'C#': 'Dó#',
  'Db': 'Réb',
  'D': 'Ré',
  'D#': 'Ré#',
  'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fá',
  'F#': 'Fá#',
  'Gb': 'Solb',
  'G': 'Sol',
  'G#': 'Sol#',
  'Ab': 'Láb',
  'A': 'Lá',
  'A#': 'Lá#',
  'Bb': 'Sib',
  'B': 'Si',
};

export const SCALE_DICTIONARY_DATABASE: ScaleDefinition[] = [
  // ==========================================
  // MODOS GREGOS
  // ==========================================
  {
    id: 'ionian',
    name: 'Jônio (Maior Natural)',
    englishName: 'Ionian (Major)',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    intervalNames: ['T', '2M', '3M', '4J', '5J', '6M', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Justa', '5ª Justa', '6ª Maior', '7ª Maior'],
    stepPattern: ['1T', '1T', '½T', '1T', '1T', '1T', '½T'],
    characteristicIntervalIndex: 0,
    characteristicIntervalLabel: '3ª Maior e 7ª Maior (Estabilidade Tonal)',
    mood: 'Alegre, Nobre, Luminoso, Confortável',
    description: 'A fundação da harmonia ocidental tonal. Modo gerador da escala maior tradicional com semitons naturais entre 3-4 e 7-8.',
    soloingTips: 'Cuidado ao repousar sobre a 4ª justa (nota de evitação temporária sobre acordes de tônica Imaj7). Destaque a 3M e a 7M para clareza harmônica.',
    chordsCompatible: ['Maj', 'Maj7', '6', 'add9'],
    triadsFormula: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    tetradsFormula: ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7b5'],
    famousExamples: 'Let It Be (Beatles), Ode to Joy (Beethoven), No Woman No Cry (Bob Marley)',
  },
  {
    id: 'dorian',
    name: 'Dórico',
    englishName: 'Dorian',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    intervalNames: ['T', '2M', '3m', '4J', '5J', '6M', '7m'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Menor', '4ª Justa', '5ª Justa', '6ª Maior', '7ª Menor'],
    stepPattern: ['1T', '½T', '1T', '1T', '1T', '½T', '1T'],
    characteristicIntervalIndex: 5,
    characteristicIntervalLabel: '6ª Maior (6M)',
    mood: 'Groovy, Jazzy, Sofisticado, Levemente Melancólico',
    description: 'Segundo modo da escala maior. É o modo menor preferido do Funk, Fusion, Rock Clássico e MPB porque a 6ª maior retira a densidade fúnebre do menor natural.',
    soloingTips: 'Enfatize a 6ª maior (ex: nota Si em Ré Dórico) para soar imediatamente dórico. O vamp clássico de dois acordes é Im7 - IV7 (ex: Dm7 - G7).',
    chordsCompatible: ['m', 'm7', 'm6', 'm9', 'm11'],
    triadsFormula: ['i', 'ii', 'bIII', 'IV', 'v', 'vi°', 'bVII'],
    tetradsFormula: ['im7', 'iim7', 'bIIImaj7', 'IV7', 'vm7', 'vim7b5', 'bVIImaj7'],
    famousExamples: 'So What (Miles Davis), Oye Como Va (Santana), Billie Jean (Michael Jackson), Get Lucky (Daft Punk)',
  },
  {
    id: 'phrygian',
    name: 'Frígio',
    englishName: 'Phrygian',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    intervalNames: ['T', '2m', '3m', '4J', '5J', '6m', '7m'],
    intervalFullNames: ['Tônica', '2ª Menor', '3ª Menor', '4ª Justa', '5ª Justa', '6ª Menor', '7ª Menor'],
    stepPattern: ['½T', '1T', '1T', '1T', '½T', '1T', '1T'],
    characteristicIntervalIndex: 1,
    characteristicIntervalLabel: '2ª Menor (2m / b2)',
    mood: 'Sombrio, Espanhol, Flamenco, Tenso, Épico',
    description: 'Terceiro modo da escala maior. Seu semitom imediato logo no primeiro grau (T -> b2) produz uma sonoridade mourisca, exótica e agressiva.',
    soloingTips: 'Toque o semitom entre a tônica e a 2ª menor (ex: Mi e Fá em Mi Frígio) para invocar o espírito do flamenco e do Heavy Metal instantaneamente.',
    chordsCompatible: ['m', 'm7', 'sus4(b9)', 'm(b9)'],
    triadsFormula: ['i', 'bII', 'bIII', 'iv', 'v°', 'bVI', 'bvii'],
    tetradsFormula: ['im7', 'bIImaj7', 'bIII7', 'ivm7', 'vm7b5', 'bVImaj7', 'bviim7'],
    famousExamples: 'Symphony of Destruction (Megadeth), White Rabbit (Jefferson Airplane), Dança Flamenca',
  },
  {
    id: 'lydian',
    name: 'Lídio',
    englishName: 'Lydian',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    intervalNames: ['T', '2M', '3M', '#4', '5J', '6M', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Aumentada (Trítono)', '5ª Justa', '6ª Maior', '7ª Maior'],
    stepPattern: ['1T', '1T', '1T', '½T', '1T', '1T', '½T'],
    characteristicIntervalIndex: 3,
    characteristicIntervalLabel: '4ª Aumentada (#4 / Trítono)',
    mood: 'Místico, Espacial, Cinematográfico, Mágico, Celestial',
    description: 'Quarto modo da escala maior. Ao elevar a 4ª em meio tom (#4), elimina a nota de evitação do Jônio, criando uma sensação aérea de sonho e ficção científica.',
    soloingTips: 'Repouse na 4ª aumentada (#4) sobre o acorde maior com 7ª maior (ex: nota Fá# em Dó Lídio). Essa nota é a marca registrada de trilhas sonoras hollywoodianas.',
    chordsCompatible: ['Maj7#11', 'Maj', 'Maj7', 'add9'],
    triadsFormula: ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'],
    tetradsFormula: ['Imaj7#11', 'II7', 'iiim7', '#ivm7b5', 'Vmaj7', 'vim7', 'viim7'],
    famousExamples: 'Tema dos Simpsons (Danny Elfman), E.T. Flying Theme (John Williams), Flying in a Blue Dream (Joe Satriani), Man on the Moon (R.E.M.)',
  },
  {
    id: 'mixolydian',
    name: 'Mixolídio',
    englishName: 'Mixolydian',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    intervalNames: ['T', '2M', '3M', '4J', '5J', '6M', '7m'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Justa', '5ª Justa', '6ª Maior', '7ª Menor'],
    stepPattern: ['1T', '1T', '½T', '1T', '1T', '½T', '1T'],
    characteristicIntervalIndex: 6,
    characteristicIntervalLabel: '7ª Menor (7m / b7)',
    mood: 'Bluesy, Enérgico, Folk, Festivo, Raiz, Baião',
    description: 'Quinto modo da escala maior, construído sobre o grau dominante (V). É uma escala maior com 7ª menor natural, sendo o pilar do Classic Rock, Blues e Música Nordestina.',
    soloingTips: 'A 7ª menor (b7) dissolve a tensão de sensível do modo maior e abre caminho para grooves soltos. Experimente alternar acordes I e bVII (ex: D e C).',
    chordsCompatible: ['7', '9', '11', '13', '7sus4'],
    triadsFormula: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    tetradsFormula: ['I7', 'iim7', 'iiim7b5', 'IVmaj7', 'vm7', 'vim7', 'bVIImaj7'],
    famousExamples: 'Sweet Child O\' Mine (Guns N\' Roses), Norvegian Wood (Beatles), Royals (Lorde), Asa Branca (Luiz Gonzaga)',
  },
  {
    id: 'aeolian',
    name: 'Eólio (Menor Natural)',
    englishName: 'Aeolian (Natural Minor)',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalNames: ['T', '2M', '3m', '4J', '5J', '6m', '7m'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Menor', '4ª Justa', '5ª Justa', '6ª Menor', '7ª Menor'],
    stepPattern: ['1T', '½T', '1T', '1T', '½T', '1T', '1T'],
    characteristicIntervalIndex: 5,
    characteristicIntervalLabel: '6ª Menor (6m / b6)',
    mood: 'Melancólico, Solene, Triste, Épico, Reflexivo',
    description: 'Sexto modo da escala maior e escala menor padrão (relativa menor). Possui semitons entre 2-3 e 5-6, conferindo profunda carga dramática emocional.',
    soloingTips: 'A progressão clássica i - bVI - bVII (ex: Am - F - G) é o clichê mais poderoso do Rock e de temas de fantasia épica.',
    chordsCompatible: ['m', 'm7', 'm(add9)', 'm11'],
    triadsFormula: ['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII'],
    tetradsFormula: ['im7', 'iim7b5', 'bIIImaj7', 'ivm7', 'vm7', 'bVImaj7', 'bVII7'],
    famousExamples: 'Stairway to Heaven (Led Zeppelin), Losing My Religion (R.E.M.), Hello (Adele)',
  },
  {
    id: 'locrian',
    name: 'Lócrio',
    englishName: 'Locrian',
    category: 'greek',
    categoryLabel: 'Modos Gregos',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    intervalNames: ['T', '2m', '3m', '4J', 'b5', '6m', '7m'],
    intervalFullNames: ['Tônica', '2ª Menor', '3ª Menor', '4ª Justa', '5ª Diminuta (Trítono)', '6ª Menor', '7ª Menor'],
    stepPattern: ['½T', '1T', '1T', '½T', '1T', '1T', '1T'],
    characteristicIntervalIndex: 4,
    characteristicIntervalLabel: '5ª Diminuta (b5) e 2ª Menor (b2)',
    mood: 'Tenso, Instável, Agressivo, Misterioso, Dissonante',
    description: 'Sétimo modo da escala maior. Único modo grego com 5ª diminuta (trítono entre o 1º e o 5º grau), tornando seu acorde tônico instável por natureza.',
    soloingTips: 'Usado predominantemente sobre o acorde meio-diminuto (m7b5) em cadências ii-V-I menores, ou em riffs de Metal extremo que exigem atonalidade.',
    chordsCompatible: ['m7b5', 'dim', 'm(b5)'],
    triadsFormula: ['i°', 'bII', 'biii', 'iv', 'bV', 'bVI', 'bvii'],
    tetradsFormula: ['im7b5', 'bIImaj7', 'biiim7', 'ivm7', 'bVmaj7', 'bVI7', 'bviim7'],
    famousExamples: 'Riffs de introdução de Heavy Metal, Rush (YYZ partes), Björk (Army of Me)',
  },

  // ==========================================
  // MENORES VARIANTES & MODOS DA MENOR HARMÔNICA / MELÓDICA
  // ==========================================
  {
    id: 'harmonic_minor',
    name: 'Menor Harmônica',
    englishName: 'Harmonic Minor',
    category: 'minor_variants',
    categoryLabel: 'Menores Especiais',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    intervalNames: ['T', '2M', '3m', '4J', '5J', '6m', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Menor', '4ª Justa', '5ª Justa', '6ª Menor', '7ª Maior (Sensível)'],
    stepPattern: ['1T', '½T', '1T', '1T', '½T', '1½T', '½T'],
    characteristicIntervalIndex: 6,
    characteristicIntervalLabel: 'Salto de 2ª Aumentada (1 tom e meio entre 6m e 7M)',
    mood: 'Dramático, Neoclássico, Oriental, Cigano, Misterioso',
    description: 'Criada para permitir o acorde dominante maior (V7) na tonalidade menor, introduzindo a sensível (7M). O intervalo de 1 tom e meio entre a 6ª menor e a 7ª maior gera sua assinatura inconfundível.',
    soloingTips: 'Explore o intervalo exótico de um tom e meio entre o 6º e 7º graus (ex: Fá e Sol# em Lá Menor). Perfeita para solos de guitarra virtuosística e música erudita.',
    chordsCompatible: ['m(maj7)', 'm', 'dim7', 'V7(b9)'],
    triadsFormula: ['i', 'ii°', 'bIII+', 'iv', 'V', 'bVI', 'vii°'],
    tetradsFormula: ['im(maj7)', 'iim7b5', 'bIIImaj7#5', 'ivm7', 'V7(b9)', 'bVImaj7', 'viidim7'],
    famousExamples: 'Sultans of Swing (solo final - Dire Straits), Yngwie Malmsteen, Alceu Valença (Morena Tropicana cadência modal), Astor Piazzolla (Libertango)',
  },
  {
    id: 'phrygian_dominant',
    name: 'Frígio Dominante (Cigana / Flamenca)',
    englishName: 'Phrygian Dominant (Spanish Gypsy)',
    category: 'minor_variants',
    categoryLabel: 'Menores Especiais',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    intervalNames: ['T', '2m', '3M', '4J', '5J', '6m', '7m'],
    intervalFullNames: ['Tônica', '2ª Menor', '3ª Maior', '4ª Justa', '5ª Justa', '6ª Menor', '7ª Menor'],
    stepPattern: ['½T', '1½T', '½T', '1T', '½T', '1T', '1T'],
    characteristicIntervalIndex: 2,
    characteristicIntervalLabel: '3ª Maior com 2ª Menor (3M + b2)',
    mood: 'Árabe, Oriental, Flamenco Puro, Desértico, Enigmático',
    description: 'Quinto modo da escala Menor Harmônica. É a escala definitiva para o acorde dominante V7 em tonalidades menores, com uma forte cor mourisca.',
    soloingTips: 'Toque sobre acordes dominantes com b9 e b13 (ex: E7(b9) em Lá menor). Alterne entre a tríade maior I e a bII (ex: Mi maior e Fá maior).',
    chordsCompatible: ['7(b9)', '7', '7(b13)', 'dim'],
    triadsFormula: ['I', 'bII', 'iii°', 'iv', 'v°', 'bVI+', 'bvii'],
    tetradsFormula: ['I7(b9)', 'bIImaj7', 'iiim7b5', 'ivm(maj7)', 'vm7b5', 'bVImaj7#5', 'bviim7'],
    famousExamples: 'Kashmir (Led Zeppelin), Misirlou (Dick Dale / Pulp Fiction), Hangar 18 (Megadeth)',
  },
  {
    id: 'melodic_minor',
    name: 'Menor Melódica (Jazz Minor)',
    englishName: 'Melodic Minor (Jazz Minor)',
    category: 'minor_variants',
    categoryLabel: 'Menores Especiais',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    intervalNames: ['T', '2M', '3m', '4J', '5J', '6M', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Menor', '4ª Justa', '5ª Justa', '6ª Maior', '7ª Maior'],
    stepPattern: ['1T', '½T', '1T', '1T', '1T', '1T', '½T'],
    characteristicIntervalIndex: 5,
    characteristicIntervalLabel: '3m com 6M e 7M (Maior com 3ª menor)',
    mood: 'Sofisticado, Moderno, Jazzístico, Elegante, Suave',
    description: 'Na tradição clássica, sobe com 6M e 7M e desce como menor natural. No Jazz e música moderna, usa-se a forma ascendente em ambas as direções (Jazz Minor).',
    soloingTips: 'Soa como uma escala maior com a terça abaixada. Gera modos essenciais como a Lídia Dominante e a Escala Alterada.',
    chordsCompatible: ['m(maj7)', 'm6', 'm(add9)', 'm13'],
    triadsFormula: ['i', 'ii', 'bIII+', 'IV', 'V', 'vi°', 'vii°'],
    tetradsFormula: ['im(maj7)', 'iim7', 'bIIImaj7#5', 'IV7', 'V7', 'vim7b5', 'viim7b5'],
    famousExamples: 'Autumn Leaves (releituras jazz), Blue in Green (Bill Evans), Solos de Pat Metheny e John Coltrane',
  },
  {
    id: 'lydian_dominant',
    name: 'Lídio Dominante (Lídio b7)',
    englishName: 'Lydian Dominant',
    category: 'minor_variants',
    categoryLabel: 'Menores Especiais',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    intervalNames: ['T', '2M', '3M', '#4', '5J', '6M', '7m'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Aumentada (Trítono)', '5ª Justa', '6ª Maior', '7ª Menor'],
    stepPattern: ['1T', '1T', '1T', '½T', '1T', '½T', '1T'],
    characteristicIntervalIndex: 3,
    characteristicIntervalLabel: '#4 e 7m simultaneamente',
    mood: 'Brilhante, Futurista, Descontraído, Humorístico',
    description: 'Quarto modo da Menor Melódica. Combina a 4ª aumentada do Lídio com a 7ª menor do Mixolídio, excelente para acordes dominantes que não resolvem na tônica (ex: SubV7 e II7).',
    soloingTips: 'Perfeita para acordes de dominante substituto (SubV7) e acordes de dominante estático como C7(#11).',
    chordsCompatible: ['7(#11)', '7', '9(#11)', '13(#11)'],
    triadsFormula: ['I', 'II', 'iii°', '#iv°', 'v', 'vi', 'bVII+'],
    tetradsFormula: ['I7(#11)', 'II7', 'iiim7b5', '#ivm7b5', 'vm(maj7)', 'vim7', 'bVIImaj7#5'],
    famousExamples: 'Take the A Train (Duke Ellington), Trilha de Os Jetsons, solos de Stevie Wonder',
  },
  {
    id: 'altered',
    name: 'Escala Alterada (Superlócria)',
    englishName: 'Altered Scale (Super Locrian)',
    category: 'minor_variants',
    categoryLabel: 'Menores Especiais',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    intervalNames: ['T', 'b9', '#9', '3M', 'b5', 'b13', '7m'],
    intervalFullNames: ['Tônica', '9ª Menor (b9)', '9ª Aumentada (#9)', '3ª Maior', '5ª Diminuta (b5/#11)', '13ª Menor (b13)', '7ª Menor'],
    stepPattern: ['½T', '1T', '½T', '1T', '1T', '1T', '1T'],
    characteristicIntervalIndex: 1,
    characteristicIntervalLabel: 'Todas as tensões alteradas (b9, #9, b5, b13)',
    mood: 'Tensão Máxima, Dissonância Jazzística, Resolução Explosiva',
    description: 'Sétimo modo da Menor Melódica. Contém todas as alterações possíveis de um acorde dominante (b9, #9, b5/#11, b13), criando a tensão dramática definitiva que clama por resolução.',
    soloingTips: 'Use sobre qualquer dominante com alterações (ex: G7alt ou G7(#9,b13)) que resolva na tônica 5 graus abaixo (ex: Cmaj7 ou Cm7).',
    chordsCompatible: ['7alt', '7(#9)', '7(b9)', '7(b9,b13)'],
    triadsFormula: ['i°', 'bii', 'biii', 'bIV+', 'bV', 'bVI', 'bvii'],
    tetradsFormula: ['im7b5', 'biim7', 'biiim(maj7)', 'bIVmaj7#5', 'bV7', 'bVI7', 'bviim7b5'],
    famousExamples: 'Clássicos do Bebop (Charlie Parker, Dizzy Gillespie), Wayne Shorter, Tom Jobim (Garota de Ipanema ponte)',
  },

  // ==========================================
  // PENTATÔNICAS & BLUES
  // ==========================================
  {
    id: 'pentatonic_minor',
    name: 'Pentatônica Menor',
    englishName: 'Minor Pentatonic',
    category: 'pentatonic_blues',
    categoryLabel: 'Pentatônicas & Blues',
    intervals: [0, 3, 5, 7, 10],
    intervalNames: ['T', '3m', '4J', '5J', '7m'],
    intervalFullNames: ['Tônica', '3ª Menor', '4ª Justa', '5ª Justa', '7ª Menor'],
    stepPattern: ['1½T', '1T', '1T', '1½T', '1T'],
    characteristicIntervalIndex: 1,
    characteristicIntervalLabel: 'Estrutura sem semitons (Não tem 2ª nem 6ª)',
    mood: 'Cru, Poderoso, Bluesy, Marcante, Essencial',
    description: 'A escala mais utilizada na guitarra moderna, Rock, Blues e Pop. Pela ausência de semitons dissonantes, quase qualquer frase soa agradável e poderosa.',
    soloingTips: 'Adicione bends de meio tom na 4ª para alcançar a Blue Note (b5) e bends de um tom na 7ª menor em direção à tônica.',
    chordsCompatible: ['m', 'm7', '7', '5 (Power Chord)'],
    triadsFormula: ['i', 'bIII', 'iv', 'v', 'bVII'],
    tetradsFormula: ['im7', 'bIIImaj', 'ivm7', 'vm7', 'bVII7'],
    famousExamples: 'Voodoo Child (Jimi Hendrix), Back in Black (AC/DC), Whole Lotta Love (Led Zeppelin)',
  },
  {
    id: 'blues',
    name: 'Escala Blues (Hexatônica)',
    englishName: 'Blues Scale',
    category: 'pentatonic_blues',
    categoryLabel: 'Pentatônicas & Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    intervalNames: ['T', '3m', '4J', 'b5 (Blue Note)', '5J', '7m'],
    intervalFullNames: ['Tônica', '3ª Menor', '4ª Justa', '5ª Diminuta (Blue Note)', '5ª Justa', '7ª Menor'],
    stepPattern: ['1½T', '1T', '½T', '½T', '1½T', '1T'],
    characteristicIntervalIndex: 3,
    characteristicIntervalLabel: 'Blue Note (b5)',
    mood: 'Blues Tradicional, Expressivo, Choroso, Sedutor, Rebelde',
    description: 'A Pentatônica Menor enriquecida com a célebre "Blue Note" (5ª diminuta / 4ª aumentada). Esse semitom de passagem gera o gemido característico da alma do Blues.',
    soloingTips: 'Deslize ou faça vibrato na Blue Note antes de resolver na 4ª justa ou na 5ª justa. Funciona surpreendentemente bem sobre acordes menores E dominantes maiores.',
    chordsCompatible: ['7', 'm7', 'm', '7(#9)'],
    triadsFormula: ['i', 'bIII', 'iv', 'bV°', 'v', 'bVII'],
    tetradsFormula: ['im7', 'bIIImaj7', 'ivm7', 'bVdim7', 'vm7', 'bVII7'],
    famousExamples: 'The Thrill Is Gone (B.B. King), Texas Flood (Stevie Ray Vaughan), Pride and Joy',
  },
  {
    id: 'pentatonic_major',
    name: 'Pentatônica Maior',
    englishName: 'Major Pentatonic',
    category: 'pentatonic_blues',
    categoryLabel: 'Pentatônicas & Blues',
    intervals: [0, 2, 4, 7, 9],
    intervalNames: ['T', '2M', '3M', '5J', '6M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '5ª Justa', '6ª Maior'],
    stepPattern: ['1T', '1T', '1½T', '1T', '1½T'],
    characteristicIntervalIndex: 2,
    characteristicIntervalLabel: '3ª Maior e 6ª Maior (sem 4ª nem 7ª)',
    mood: 'Alegre, Doce, Country, Luminoso, Convidativo',
    description: 'Versão de 5 notas da escala maior, omitindo o 4º e o 7º graus (que formam o trítono). Cria melodias limpas, doces e memoráveis.',
    soloingTips: 'Perfeita para Country, Soul, Gospel e baladas Pop. Toque a 2M e a 6M para transmitir sensação de paz e otimismo.',
    chordsCompatible: ['Maj', 'Maj7', '6', 'add9'],
    triadsFormula: ['I', 'ii', 'iii', 'V', 'vi'],
    tetradsFormula: ['Imaj', 'iim', 'iiim', 'V', 'vim'],
    famousExamples: 'My Girl (The Temptations), Jessica (Allman Brothers Band), Wonderful Tonight (Eric Clapton)',
  },

  // ==========================================
  // SIMÉTRICAS & JAZZ
  // ==========================================
  {
    id: 'whole_tone',
    name: 'Tons Inteiros (Hexatônica)',
    englishName: 'Whole Tone',
    category: 'symmetric_jazz',
    categoryLabel: 'Simétricas & Jazz',
    intervals: [0, 2, 4, 6, 8, 10],
    intervalNames: ['T', '2M', '3M', '#4', '#5', 'b7'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Aumentada', '5ª Aumentada', '7ª Menor'],
    stepPattern: ['1T', '1T', '1T', '1T', '1T', '1T'],
    characteristicIntervalIndex: 4,
    characteristicIntervalLabel: 'Todos os intervalos são de 1 tom inteiro',
    mood: 'Onírico, Flutuante, Sonho de Fantasia, Impressionista',
    description: 'Escala totalmente simétrica composta exclusivamente por intervalos de 1 tom. Por não ter semitons nem tônica fixa, flutua no ar sem centro gravitacional definido.',
    soloingTips: 'Ideal sobre acordes dominantes com 5ª aumentada (ex: C7#5 ou Caug) e para passagens de sonho ou transição cinematográfica.',
    chordsCompatible: ['7#5', 'aug', '7(b5)', '9(#5)'],
    triadsFormula: ['I+', 'II+', 'III+', 'IV+', 'V+', 'VI+'],
    tetradsFormula: ['I7#5', 'II7#5', 'III7#5', 'IV7#5', 'V7#5', 'VI7#5'],
    famousExamples: 'You Are the Sunshine of My Life (intro - Stevie Wonder), Voiles (Claude Debussy)',
  },
  {
    id: 'diminished_wh',
    name: 'Diminuta (Tom-Semitom)',
    englishName: 'Diminished (Whole-Half)',
    category: 'symmetric_jazz',
    categoryLabel: 'Simétricas & Jazz',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    intervalNames: ['T', '2M', '3m', '4J', 'b5', 'b6', '6M', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Menor', '4ª Justa', '5ª Diminuta', '6ª Menor', '6ª Maior (7ª Dim)', '7ª Maior'],
    stepPattern: ['1T', '½T', '1T', '½T', '1T', '½T', '1T', '½T'],
    characteristicIntervalIndex: 4,
    characteristicIntervalLabel: 'Padrão alternado 1 Tom - Meio Tom (8 notas)',
    mood: 'Simétrico, Complexo, Tenso, Misterioso, Nobre',
    description: 'Escala simétrica de 8 notas (octatônica) gerada pela alternância estrita de um tom e meio tom. É a escala natural para acordes diminutos plenos (dim7).',
    soloingTips: 'Qualquer desenho ou frase tocada nesta escala pode ser transposta em blocos de terça menor (3 semitons) e continuará soando perfeita.',
    chordsCompatible: ['dim7', '°7', 'dim'],
    triadsFormula: ['i°', 'ii°', 'biii°', 'iv°', 'bV°', 'bvi°', 'vi°', 'vii°'],
    tetradsFormula: ['idim7', 'iidim7', 'biiidim7', 'ivdim7', 'bVdim7', 'bvidim7', 'vidim7', 'viidim7'],
    famousExamples: 'Passagens de Bebop de Charlie Parker, solos de Thelonious Monk e John Coltrane',
  },
  {
    id: 'bebop_dominant',
    name: 'Bebop Dominante (8 notas)',
    englishName: 'Bebop Dominant',
    category: 'symmetric_jazz',
    categoryLabel: 'Simétricas & Jazz',
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    intervalNames: ['T', '2M', '3M', '4J', '5J', '6M', '7m', '7M'],
    intervalFullNames: ['Tônica', '2ª Maior', '3ª Maior', '4ª Justa', '5ª Justa', '6ª Maior', '7ª Menor', '7ª Maior (Cromatismo)'],
    stepPattern: ['1T', '1T', '½T', '1T', '1T', '½T', '½T', '½T'],
    characteristicIntervalIndex: 7,
    characteristicIntervalLabel: '7ª Maior como nota de passagem cromática entre 7m e T',
    mood: 'Swing Dinâmico, Virtuoso, Fluido, Jazz Clássico',
    description: 'Adiciona uma nota cromática de passagem (7M) ao modo Mixolídio. Isso faz com que as notas do acorde caiam perfeitamente nos tempos fortes do compasso quaternário.',
    soloingTips: 'Toque colcheias contínuas descendentes a partir da tônica: as notas da tríade cairão exatamente nos tempos 1, 2, 3 e 4.',
    chordsCompatible: ['7', '9', '13', '7sus4'],
    triadsFormula: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII', 'vii°'],
    tetradsFormula: ['I7', 'iim7', 'iiim7b5', 'IVmaj7', 'vm7', 'vim7', 'bVIImaj7', 'viidim7'],
    famousExamples: 'Donna Lee, Anthropology, Confirmation (Charlie Parker), Dizzy Gillespie',
  },
];

/**
 * Smart Note Calculator for any key and scale
 */
export function getScaleNotesForRoot(
  rootKey: string,
  scaleDef: ScaleDefinition
): ScaleNoteInfo[] {
  const rootSt = getSemitone(rootKey);
  const rootOption = ROOT_KEY_OPTIONS.find((r) => r.note === rootKey);
  const preferFlats = rootOption?.preferFlats ?? false;

  const notesList: ScaleNoteInfo[] = [];

  scaleDef.intervals.forEach((intervalSt, idx) => {
    const noteSt = (rootSt + intervalSt) % 12;
    const isRoot = idx === 0;
    const isChar = idx === scaleDef.characteristicIntervalIndex;

    // Spelling selection: Sharp or Flat table
    let noteName = preferFlats
      ? SEMITONE_TO_FLAT_NAME[noteSt]
      : SEMITONE_TO_SHARP_NAME[noteSt];

    // Solfège name (Portuguese)
    const solfege = NOTE_TO_PORTUGUESE_SOLFEGE[noteName] || noteName;

    // Base octave 4 for audio playback
    const octave = 4 + (rootSt + intervalSt >= 12 ? 1 : 0);
    const pitchWithOctave = `${noteName}${octave}`;
    const midi = (octave + 1) * 12 + noteSt;

    const intervalName = scaleDef.intervalNames[idx] || `${intervalSt}st`;
    const intervalFullName = scaleDef.intervalFullNames[idx] || intervalName;
    const stepFromPrev = scaleDef.stepPattern[idx] || '1T';

    notesList.push({
      note: noteName,
      solfege,
      pitchWithOctave,
      midi,
      intervalName,
      intervalFullName,
      semitonesFromRoot: intervalSt,
      stepFromPrev,
      isRoot,
      isCharacteristic: isChar,
    });
  });

  return notesList;
}

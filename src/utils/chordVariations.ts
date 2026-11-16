import { ChordDefinition } from '../types';
import { CHORD_DATABASE } from '../data/musicTheory';
import { getSemitone } from './melodyGenerator';
import { transposeChord, transposeNoteName } from './transposition';
import { getChordInversions, findGuitarVoicingForInversion } from './chordInversions';

export type VariationCategory = 'all' | 'slash' | 'extension' | 'suspension';

export interface ChordVariationOption {
  id: string;
  symbol: string;
  label: string; // e.g. "add9", "sus4", "1ª Inversão", "maj7"
  category: Exclude<VariationCategory, 'all'>;
  categoryLabel: string;
  description: string;
  chord: ChordDefinition;
  isCurrent: boolean;
}

// Canonical templates for qualities not guaranteed to exist for every root in CHORD_DATABASE
const CANONICAL_SUS2_C: ChordDefinition = {
  id: 'Csus2',
  name: 'Csus2 (Dó Suspenso com 2ª)',
  root: 'C',
  quality: 'sus2',
  symbol: 'Csus2',
  notes: ['C3', 'G3', 'C4', 'D4', 'G4'],
  noteNames: ['C', 'D', 'G'],
  guitar: {
    frets: [-1, 3, 5, 5, 3, 3],
    fingers: [null, 1, 3, 4, 1, 1],
    baseFret: 3,
    barre: { fret: 3, fromString: 5, toString: 1 },
  },
  piano: {
    keys: ['C4', 'D4', 'G4'],
    rootKey: 'C4',
  },
  scale: {
    name: 'Dó Maior (Jônio) / Pentatônica',
    mode: 'Suspenso (sus2)',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    description: 'Substitui a terça pela segunda maior (D), gerando sonoridade aberta, moderna e flutuante.',
    soloingTips: 'Realce a 2ª (D) e a 5ª (G) para frases melódicas espaciais.',
  },
};

const CANONICAL_SUS4_C: ChordDefinition = {
  id: 'Csus4',
  name: 'Csus4 (Dó Suspenso com 4ª)',
  root: 'C',
  quality: 'sus4',
  symbol: 'Csus4',
  notes: ['C3', 'F3', 'G3', 'C4', 'F4'],
  noteNames: ['C', 'F', 'G'],
  guitar: {
    frets: [-1, 3, 3, 0, 1, 1],
    fingers: [null, 3, 4, 0, 1, 1],
    baseFret: 1,
    barre: { fret: 1, fromString: 2, toString: 1 },
  },
  piano: {
    keys: ['C4', 'F4', 'G4'],
    rootKey: 'C4',
  },
  scale: {
    name: 'Dó Maior / Mixolídio',
    mode: 'Suspenso (sus4)',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    description: 'Tensão harmônica clássica que suspende a terça para resolver no acorde maior.',
    soloingTips: 'Movimente a nota F (4ª) em direção ao E (3ª) ao retornar ao acorde base.',
  },
};

const CANONICAL_MADD9_A: ChordDefinition = {
  id: 'Amadd9',
  name: 'Am(add9) (Lá Menor com Nona)',
  root: 'A',
  quality: 'add9',
  symbol: 'Am(add9)',
  notes: ['A2', 'E3', 'B3', 'C4', 'E4'],
  noteNames: ['A', 'C', 'E', 'B'],
  guitar: {
    frets: [-1, 0, 2, 4, 1, 0],
    fingers: [null, 0, 1, 4, 2, 0],
    baseFret: 1,
  },
  piano: {
    keys: ['A4', 'B4', 'C5', 'E5'],
    rootKey: 'A4',
  },
  scale: {
    name: 'Lá Menor Natural (Eólio)',
    mode: 'Eólio',
    notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    description: 'Acorde menor enriquecido com a nona (B), trazendo drama cinematográfico e sofisticação.',
    soloingTips: 'Sustente a 9ª maior sobre o acorde menor para criar tensão emocional elegante.',
  },
};

function prefersFlatSpelling(root: string): boolean {
  return root.includes('b') || root === 'F';
}

function buildChordFromTemplate(
  targetSymbol: string,
  templateChord: ChordDefinition,
  targetRoot: string,
  overrides?: Partial<ChordDefinition>
): ChordDefinition {
  const dbMatch = CHORD_DATABASE[targetSymbol];
  if (dbMatch) {
    return dbMatch;
  }

  const templateRootSt = getSemitone(templateChord.root);
  const targetRootSt = getSemitone(targetRoot);
  let delta = (targetRootSt - templateRootSt + 12) % 12;
  if (delta > 6) delta -= 12;

  const useFlats = prefersFlatSpelling(targetRoot);
  const transposed = delta === 0 ? { ...templateChord } : transposeChord(templateChord, delta, useFlats);

  return {
    ...transposed,
    id: targetSymbol,
    symbol: targetSymbol,
    name: `${targetSymbol} (${targetRoot})`,
    ...overrides,
  };
}

function isMinorChordFamily(chord: ChordDefinition): boolean {
  if (chord.quality === 'minor' || chord.quality === 'm7') return true;
  const baseSymbol = chord.symbol.split('/')[0];
  return new RegExp(`^${chord.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}m(?!aj)`).test(baseSymbol);
}

/**
 * Resolves the underlying triad/base chord for a given chord (stripping slash bass or extension when deriving family)
 */
function resolveBaseTriad(chord: ChordDefinition): ChordDefinition {
  const isMinorFamily = isMinorChordFamily(chord);
  const baseSymbol = isMinorFamily ? `${chord.root}m` : chord.root;
  if (CHORD_DATABASE[baseSymbol]) {
    return CHORD_DATABASE[baseSymbol];
  }
  const template = isMinorFamily ? CHORD_DATABASE['Am'] : CHORD_DATABASE['C'];
  return buildChordFromTemplate(baseSymbol, template, chord.root);
}

/**
 * Suggests common chord voicings (slash chords, add9, sus4, sus2, maj7, 7, m7)
 * for the currently inspected chord.
 */
export function getChordVariations(chord: ChordDefinition): ChordVariationOption[] {
  const variations: ChordVariationOption[] = [];
  const seenSymbols = new Set<string>();

  const root = chord.root;
  const useFlats = prefersFlatSpelling(root);
  const isMinorFamily = isMinorChordFamily(chord);
  const isPowerChord = chord.quality === '5';
  const baseTriad = resolveBaseTriad(chord);

  const pushVariation = (opt: Omit<ChordVariationOption, 'isCurrent'>) => {
    if (seenSymbols.has(opt.symbol)) return;
    seenSymbols.add(opt.symbol);
    variations.push({
      ...opt,
      isCurrent: chord.symbol === opt.symbol,
    });
  };

  // 1. Base / Fundamental triad (useful to switch back when inspecting a variation or slash chord)
  if (chord.symbol !== baseTriad.symbol) {
    pushVariation({
      id: `var-base-${baseTriad.symbol}`,
      symbol: baseTriad.symbol,
      label: isMinorFamily ? 'Tríade Menor Base' : 'Tríade Maior Base',
      category: 'extension',
      categoryLabel: 'Base',
      description: `Acorde fundamental de ${baseTriad.symbol} sem tensões adicionadas ou inversão no baixo.`,
      chord: baseTriad,
    });
  }

  if (isPowerChord) {
    // Power chords can expand to full major/minor or suspended voicings
    const majorChord = buildChordFromTemplate(root, CHORD_DATABASE['C'], root);
    const minorChord = buildChordFromTemplate(`${root}m`, CHORD_DATABASE['Am'], root);
    pushVariation({
      id: `var-maj-${majorChord.symbol}`,
      symbol: majorChord.symbol,
      label: 'Maior Completo',
      category: 'extension',
      categoryLabel: 'Tríade Maior',
      description: `Adiciona a terça maior ao power chord ${chord.symbol} para abrir o som.`,
      chord: majorChord,
    });
    pushVariation({
      id: `var-min-${minorChord.symbol}`,
      symbol: minorChord.symbol,
      label: 'Menor Completo',
      category: 'extension',
      categoryLabel: 'Tríade Menor',
      description: `Adiciona a terça menor ao power chord ${chord.symbol} para clima mais dramático.`,
      chord: minorChord,
    });
  }

  // 2. Common Extensions & Color Voicings (add9, maj7, 7 / m7, m(add9))
  if (!isMinorFamily) {
    // add9
    const add9Sym = `${root}add9`;
    const add9Chord = buildChordFromTemplate(add9Sym, CHORD_DATABASE['Cadd9'], root, {
      scale: {
        name: `${root} Maior (Jônio) / Add9`,
        mode: 'Jônio',
        notes: baseTriad.scale.notes,
        description: `Acorde com nona adicionada (${transposeNoteName(root, 2, useFlats)}), brilho moderno e cristalino ideal para Pop e Acústico.`,
        soloingTips: `Destaque a nona (${transposeNoteName(root, 2, useFlats)}) na melodia para criar abertura moderna.`,
      },
    });
    pushVariation({
      id: `var-add9-${add9Sym}`,
      symbol: add9Sym,
      label: 'add9 (Nona Adicionada)',
      category: 'extension',
      categoryLabel: 'Extensão',
      description: `Adiciona a 9ª maior (${transposeNoteName(root, 2, useFlats)}) sem sétima. Soa moderno, aberto e brilhante no violão e piano.`,
      chord: add9Chord,
    });

    // maj7
    const maj7Sym = `${root}maj7`;
    const maj7Chord = buildChordFromTemplate(maj7Sym, CHORD_DATABASE['Cmaj7'], root);
    pushVariation({
      id: `var-maj7-${maj7Sym}`,
      symbol: maj7Sym,
      label: 'maj7 (7ª Maior)',
      category: 'extension',
      categoryLabel: 'Sétima',
      description: `Acorde com 7ª maior (${transposeNoteName(root, 11, useFlats)}). Sonoridade suave, nostálgica e sofisticada para Baladas, Bossa e Lo-Fi.`,
      chord: maj7Chord,
    });

    // 7 (Dominant 7th)
    const dom7Sym = `${root}7`;
    const dom7Chord = buildChordFromTemplate(dom7Sym, CHORD_DATABASE['C7'], root);
    pushVariation({
      id: `var-dom7-${dom7Sym}`,
      symbol: dom7Sym,
      label: '7 (Dominante)',
      category: 'extension',
      categoryLabel: 'Dominante',
      description: `Adiciona a 7ª menor (${transposeNoteName(root, 10, useFlats)}), criando tensão Blues/Rock que prepara o acorde seguinte.`,
      chord: dom7Chord,
    });
  } else {
    // Minor family: m7 & m(add9)
    const m7Sym = `${root}m7`;
    const m7Chord = buildChordFromTemplate(m7Sym, CHORD_DATABASE['Am7'], root);
    pushVariation({
      id: `var-m7-${m7Sym}`,
      symbol: m7Sym,
      label: 'm7 (Menor c/ 7ª)',
      category: 'extension',
      categoryLabel: 'Sétima',
      description: `Acorde menor com 7ª menor (${transposeNoteName(root, 10, useFlats)}). Textura aveludada e muito comum em Soul, Pop e R&B.`,
      chord: m7Chord,
    });

    const madd9Sym = `${root}m(add9)`;
    const madd9Chord = buildChordFromTemplate(madd9Sym, CANONICAL_MADD9_A, root, {
      quality: 'add9',
    });
    pushVariation({
      id: `var-madd9-${madd9Sym}`,
      symbol: madd9Sym,
      label: 'm(add9) (Menor c/ 9ª)',
      category: 'extension',
      categoryLabel: 'Extensão',
      description: `Acorde menor com 9ª adicionada (${transposeNoteName(root, 2, useFlats)}). Clima introspectivo e cinematográfico.`,
      chord: madd9Chord,
    });
  }

  // 3. Suspensions (sus4 and sus2 apply cleanly to any root)
  const sus4Sym = `${root}sus4`;
  const sus4Chord = buildChordFromTemplate(sus4Sym, CANONICAL_SUS4_C, root);
  pushVariation({
    id: `var-sus4-${sus4Sym}`,
    symbol: sus4Sym,
    label: 'sus4 (4ª Suspensa)',
    category: 'suspension',
    categoryLabel: 'Suspensão',
    description: `Substitui a terça pela 4ª justa (${transposeNoteName(root, 5, useFlats)}). Cria expectativa natural que pede resolução em ${baseTriad.symbol}.`,
    chord: sus4Chord,
  });

  const sus2Sym = `${root}sus2`;
  const sus2Chord = buildChordFromTemplate(sus2Sym, CANONICAL_SUS2_C, root);
  pushVariation({
    id: `var-sus2-${sus2Sym}`,
    symbol: sus2Sym,
    label: 'sus2 (2ª Suspensa)',
    category: 'suspension',
    categoryLabel: 'Suspensão',
    description: `Substitui a terça pela 2ª maior (${transposeNoteName(root, 2, useFlats)}). Acorde neutro, etéreo e muito popular no Rock e Worship.`,
    chord: sus2Chord,
  });

  // 4. Slash Chords / Inversions (e.g. C/E, C/G, Am/C, Am/E, plus stepwise bass Am/G or C/B)
  const targetForInversions = chord.inversion && chord.inversion > 0 ? baseTriad : chord;
  const inversions = getChordInversions(targetForInversions);
  inversions.forEach((inv) => {
    if (inv.inversion === 0) return;
    pushVariation({
      id: `var-slash-${inv.symbol}`,
      symbol: inv.symbol,
      label: `${inv.inversionLabel} (${inv.bassDegree})`,
      category: 'slash',
      categoryLabel: 'Slash Chord',
      description: inv.description,
      chord: inv.chord,
    });
  });

  // Add popular stepwise descending bass slash chord (e.g. C/B for Major or Am/G for Minor)
  const passingBassInterval = isMinorFamily ? 10 : 11; // b7 under minor (Am/G), maj7 under major (C/B)
  const passingBassNote = transposeNoteName(root, passingBassInterval, useFlats);
  const passingSymbol = `${baseTriad.symbol}/${passingBassNote}`;
  if (!seenSymbols.has(passingSymbol)) {
    const passingGuitar = findGuitarVoicingForInversion(
      baseTriad.guitar,
      passingBassNote,
      baseTriad.noteNames || [root]
    );
    const passingSemitone = getSemitone(passingBassNote);
    const rootSemitone = getSemitone(root);
    // Ensure passing bass note sits cleanly below the root in both audio notes and piano keys
    const lowestAudioNote = baseTriad.notes?.[0] || `${root}3`;
    const lowestAudioOctMatch = lowestAudioNote.match(/(-?\d+)$/);
    const lowestAudioOct = lowestAudioOctMatch ? parseInt(lowestAudioOctMatch[1], 10) : 3;
    const audioBassOct = passingSemitone >= rootSemitone ? lowestAudioOct - 1 : lowestAudioOct;
    const bassAudioName = `${passingBassNote}${audioBassOct}`;

    const lowestPianoKey = baseTriad.piano?.keys?.[0] || `${root}4`;
    const lowestPianoOctMatch = lowestPianoKey.match(/(-?\d+)$/);
    const lowestPianoOct = lowestPianoOctMatch ? parseInt(lowestPianoOctMatch[1], 10) : 4;
    const pianoBassOct = passingSemitone >= rootSemitone ? lowestPianoOct - 1 : lowestPianoOct;
    const bassPianoKey = `${passingBassNote}${pianoBassOct}`;

    const passingNotes = [
      bassAudioName,
      ...(baseTriad.notes || []).filter((n) => !n.startsWith(passingBassNote)),
    ];
    const passingPianoKeys = [
      bassPianoKey,
      ...(baseTriad.piano?.keys || []).filter((n) => n !== bassPianoKey),
    ];
    const passingNoteNames = [
      passingBassNote,
      ...(baseTriad.noteNames || [root]).filter((n) => n !== passingBassNote),
    ];

    const passingChord: ChordDefinition = {
      ...baseTriad,
      id: `${baseTriad.id}_slash_${passingBassNote}`,
      symbol: passingSymbol,
      name: `${passingSymbol} (Baixo de Passagem em ${passingBassNote})`,
      bassNote: passingBassNote,
      inversion: 3,
      notes: passingNotes,
      noteNames: passingNoteNames,
      piano: {
        keys: passingPianoKeys,
        rootKey: bassPianoKey,
      },
      guitar: passingGuitar,
      scale: {
        ...baseTriad.scale,
        name: `${baseTriad.scale.name} (Baixo ${passingBassNote})`,
      },
    };

    pushVariation({
      id: `var-slash-passing-${passingSymbol}`,
      symbol: passingSymbol,
      label: `Baixo de Passagem (${passingBassNote})`,
      category: 'slash',
      categoryLabel: 'Slash Chord',
      description: isMinorFamily
        ? `Clássica descida de baixo para a 7ª menor (${passingBassNote}) ligando ${baseTriad.symbol} ao acorde seguinte (ex: ${baseTriad.symbol} → ${passingSymbol} → IV).`
        : `Clássica descida de baixo pela 7ª maior (${passingBassNote}) conectando ${baseTriad.symbol} ao relativo menor.`,
      chord: passingChord,
    });
  }

  return variations;
}

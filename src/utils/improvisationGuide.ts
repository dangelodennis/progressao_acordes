import {
  ChordDefinition,
  Genre,
  MelodyNote,
  TimelineChordItem,
} from '../types';
import {
  SCALE_DICTIONARY_DATABASE,
  ScaleDefinition,
  getScaleNotesForRoot,
  ScaleNoteInfo,
} from '../data/scaleDictionary';
import { getSemitone, getDegreeLabel } from './melodyGenerator';

export interface RhythmicBeatSlot {
  label: string; // e.g. "1", "&", "2", "&"
  active: boolean;
  accent?: boolean;
  durationBeats: number;
}

export interface RhythmicPatternSuggestion {
  id: string;
  name: string;
  feelTag: string;
  notation: string; // e.g. "1  •  &  (2)  &  3  •  4"
  description: string;
  slots: RhythmicBeatSlot[];
  /** Relative beat start times within the chord duration */
  hitStarts: number[];
  /** Corresponding durations for audio preview */
  hitDurations: number[];
}

export interface PhraseStepBadge {
  note: string; // e.g. "E4"
  noteName: string; // e.g. "E"
  degree: string; // e.g. "3M"
  durationBeats: number;
  isChordTarget: boolean;
  isCharacteristic: boolean;
}

export interface MelodicPhraseSuggestion {
  id: string;
  title: string;
  tag: 'Alvo' | 'Modal' | 'Conexão' | 'Resolução';
  rhythmName: string;
  explanation: string;
  notes: MelodyNote[];
  steps: PhraseStepBadge[];
  totalBeats: number;
}

export interface ChordImprovisationGuide {
  chordIndex: number;
  item: TimelineChordItem;
  harmonicFunction: string;
  compatibilityPercent: number;
  compatibilityLevel: 'perfect' | 'partial' | 'outside';
  targetNotes: { note: string; intervalInScale: string; roleInChord: string }[];
  colorNotes: { note: string; intervalInScale: string; isCharacteristic: boolean }[];
  outsideNotes: string[];
  guidanceSummary: string;
  rhythmPatterns: RhythmicPatternSuggestion[];
  phrases: MelodicPhraseSuggestion[];
}

export interface ProgressionImprovisationAnalysis {
  scaleRoot: string;
  scaleDef: ScaleDefinition;
  scaleNotes: ScaleNoteInfo[];
  overallCompatibility: number;
  progressionSummary: string;
  chordGuides: ChordImprovisationGuide[];
}

/**
 * Picks octave >= 4 so phrases sit cleanly above chord voicings
 */
function pickMelodyOctave(noteSemitone: number, baseOctave = 4, prevMidi?: number): number {
  let oct = baseOctave;
  let midi = (oct + 1) * 12 + noteSemitone;
  if (prevMidi !== undefined) {
    // Keep melodic leaps smooth (prefer within +/- 7 semitones)
    const candidates = [oct - 1, oct, oct + 1].filter((o) => o >= 4 && o <= 5);
    let bestOct = oct;
    let bestDist = Infinity;
    for (const cOct of candidates) {
      const cMidi = (cOct + 1) * 12 + noteSemitone;
      const dist = Math.abs(cMidi - prevMidi);
      if (dist < bestDist) {
        bestDist = dist;
        bestOct = cOct;
      }
    }
    oct = bestOct;
    midi = (oct + 1) * 12 + noteSemitone;
  }
  void midi;
  return oct;
}

function getHarmonicFunctionLabel(chord: ChordDefinition, scaleRootSt: number): string {
  const chordRootSt = getSemitone(chord.root);
  const diff = (chordRootSt - scaleRootSt + 12) % 12;
  const isMinor = chord.quality === 'minor' || chord.quality === 'm7';

  switch (diff) {
    case 0:
      return isMinor ? 'Tônica Menor (i) — Repouso' : 'Tônica (I) — Repouso Central';
    case 2:
      return isMinor ? 'Supertônica (ii) — Preparação' : 'Supertônica (II) — Movimento';
    case 3:
      return 'Mediante Bemol (bIII) — Relativo Maior';
    case 4:
      return isMinor ? 'Mediante (iii) — Transição' : 'Mediante Maior (III)';
    case 5:
      return isMinor ? 'Subdominante Menor (iv) — Tensão Emotiva' : 'Subdominante (IV) — Abertura';
    case 7:
      return chord.quality === '7'
        ? 'Dominante (V7) — Tensão Máxima p/ Resolução'
        : isMinor
        ? 'Dominante Menor (v) — Suave'
        : 'Dominante (V) — Impulso Cadencial';
    case 8:
      return 'Submediante Bemol (bVI) — Épico / Modal';
    case 9:
      return isMinor ? 'Relativo Menor (vi) — Lírico' : 'Submediante (VI)';
    case 10:
      return 'Subtônica (bVII) — Rock / Mixolídio';
    case 11:
      return 'Sensível (vii°) — Tensão p/ Tônica';
    default:
      return 'Acorde Cromático / Empréstimo Modal';
  }
}

function getChordToneRole(noteSt: number, chord: ChordDefinition): string {
  const rootSt = getSemitone(chord.root);
  const diff = (noteSt - rootSt + 12) % 12;
  switch (diff) {
    case 0:
      return 'Tônica';
    case 2:
      return '9ª / 2ª';
    case 3:
      return '3ªm';
    case 4:
      return '3ªM';
    case 5:
      return '4ª';
    case 6:
      return 'b5';
    case 7:
      return '5ªJ';
    case 8:
      return '#5';
    case 9:
      return '6ª';
    case 10:
      return '7ªm';
    case 11:
      return '7ªM';
    default:
      return 'Nota do Acorde';
  }
}

/**
 * Generates 2 tailored rhythmic patterns matching the chord's duration and musical genre
 */
function buildRhythmicPatternsForChord(
  chordIndex: number,
  durationBeats: number,
  genre: Genre,
  isDominantOrCadence: boolean,
  variationSeed: number
): RhythmicPatternSuggestion[] {
  const dur = Math.max(1, durationBeats);

  if (dur <= 1) {
    return [
      {
        id: `rhythm-${chordIndex}-short-1`,
        name: 'Ataque em Semicolcheia/Colcheia',
        feelTag: 'Transição Rápida',
        notation: '1  •  &',
        description: 'Duas notas ágeis em 1 tempo para conectar rapidamente ao próximo acorde.',
        slots: [
          { label: '1', active: true, accent: true, durationBeats: 0.5 },
          { label: '&', active: true, accent: false, durationBeats: 0.5 },
        ],
        hitStarts: [0, 0.5],
        hitDurations: [0.45, 0.45],
      },
      {
        id: `rhythm-${chordIndex}-short-2`,
        name: 'Nota Única de Apoio',
        feelTag: 'Respiro',
        notation: '1 (sustentada)',
        description: 'Apoie apenas a nota-alvo no tempo forte para não embolar trocas rápidas.',
        slots: [{ label: '1', active: true, accent: true, durationBeats: 1 }],
        hitStarts: [0],
        hitDurations: [0.9],
      },
    ];
  }

  if (dur === 2) {
    return [
      {
        id: `rhythm-${chordIndex}-two-1`,
        name: 'Motivo de Colcheias + Repouso',
        feelTag: 'Direto',
        notation: '1  •  &  •  2',
        description: 'Aproxime pelo contratempo do 1 e sustente a resolução no tempo 2.',
        slots: [
          { label: '1', active: true, accent: true, durationBeats: 0.5 },
          { label: '&', active: true, accent: false, durationBeats: 0.5 },
          { label: '2', active: true, accent: true, durationBeats: 1 },
        ],
        hitStarts: [0, 0.5, 1],
        hitDurations: [0.45, 0.45, 0.9],
      },
      {
        id: `rhythm-${chordIndex}-two-2`,
        name: 'Síncope em 2 Tempos',
        feelTag: 'Groove',
        notation: '(1)  &  •  2  &',
        description: 'Comece no contratempo (&) após pausa curta no tempo 1 para dar balanço.',
        slots: [
          { label: '1', active: false, durationBeats: 0.5 },
          { label: '&', active: true, accent: true, durationBeats: 0.5 },
          { label: '2', active: true, accent: false, durationBeats: 0.5 },
          { label: '&', active: true, accent: true, durationBeats: 0.5 },
        ],
        hitStarts: [0.5, 1.0, 1.5],
        hitDurations: [0.45, 0.45, 0.45],
      },
    ];
  }

  if (dur === 3) {
    return [
      {
        id: `rhythm-${chordIndex}-three-1`,
        name: 'Frase Ternária / Valsa Lírica',
        feelTag: '3/4 Fluido',
        notation: '1  •  2  •  &  •  3',
        description: 'Acentue o tempo 1 e crie movimento no "&" do 2 preparando o tempo 3.',
        slots: [
          { label: '1', active: true, accent: true, durationBeats: 1 },
          { label: '2', active: true, accent: false, durationBeats: 0.5 },
          { label: '&', active: true, accent: false, durationBeats: 0.5 },
          { label: '3', active: true, accent: true, durationBeats: 1 },
        ],
        hitStarts: [0, 1, 1.5, 2],
        hitDurations: [0.9, 0.45, 0.45, 0.9],
      },
      {
        id: `rhythm-${chordIndex}-three-2`,
        name: 'Arpejo Ascendente 3/4',
        feelTag: 'Melódico',
        notation: '1  &  2  &  3',
        description: 'Suba gradualmente pelas notas da escala ao longo dos 3 tempos.',
        slots: [
          { label: '1', active: true, accent: true, durationBeats: 0.5 },
          { label: '&', active: true, durationBeats: 0.5 },
          { label: '2', active: true, durationBeats: 0.5 },
          { label: '&', active: true, durationBeats: 0.5 },
          { label: '3', active: true, accent: true, durationBeats: 1 },
        ],
        hitStarts: [0, 0.5, 1, 1.5, 2],
        hitDurations: [0.45, 0.45, 0.45, 0.45, 0.9],
      },
    ];
  }

  // Standard 4+ beats (4, 6, 8)
  const scaleFactor = dur >= 6 ? 1.5 : 1;
  const isSwingOrBlues = genre === 'blues' || genre === 'jazz';
  const isGrooveGenre = genre === 'pop' || genre === 'electronic' || genre === 'techno';

  const scaleSlots = (
    items: { label: string; active: boolean; accent?: boolean; durationBeats: number }[]
  ) => items.map((s) => ({ ...s, durationBeats: Number((s.durationBeats * scaleFactor).toFixed(2)) }));

  const scaleTimes = (times: number[]) =>
    times.map((t) => Number((t * scaleFactor).toFixed(2)));

  const patternPool: RhythmicPatternSuggestion[] = [
    {
      id: `rhythm-${chordIndex}-sync-pop`,
      name: 'Síncope Pop / Antecipação',
      feelTag: 'Groove Moderno',
      notation: '1  •  &  (2)  •  &  3  •  4',
      description: 'Pula a cabeça do tempo 2 e acentua os contratempos para soar moderno e vocal.',
      slots: scaleSlots([
        { label: '1', active: true, accent: true, durationBeats: 0.5 },
        { label: '&', active: true, accent: false, durationBeats: 1 },
        { label: '&2', active: true, accent: true, durationBeats: 1 },
        { label: '3', active: true, accent: false, durationBeats: 0.5 },
        { label: '4', active: true, accent: true, durationBeats: 1 },
      ]),
      hitStarts: scaleTimes([0, 0.5, 1.5, 2.5, 3]),
      hitDurations: scaleTimes([0.45, 0.9, 0.9, 0.45, 0.95]),
    },
    {
      id: `rhythm-${chordIndex}-lyrical-arc`,
      name: 'Arco Melódico (Mínima + Colcheias)',
      feelTag: 'Cantável',
      notation: '1 — 2  •  3  &  4  &',
      description: 'Sustenta a nota-alvo por 2 tempos e acelera na segunda metade do compasso.',
      slots: scaleSlots([
        { label: '1-2', active: true, accent: true, durationBeats: 2 },
        { label: '3', active: true, accent: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: false, durationBeats: 0.5 },
        { label: '4', active: true, accent: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: true, durationBeats: 0.5 },
      ]),
      hitStarts: scaleTimes([0, 2, 2.5, 3, 3.5]),
      hitDurations: scaleTimes([1.85, 0.45, 0.45, 0.45, 0.45]),
    },
    {
      id: `rhythm-${chordIndex}-space-phrase`,
      name: 'Frase Curta com Pausa Expressiva',
      feelTag: 'Respiração',
      notation: '1  &  2  •  (3)  •  4',
      description: 'Toca um motivo rápido nos tempos 1-2, deixa o tempo 3 respirar e finaliza no 4.',
      slots: scaleSlots([
        { label: '1', active: true, accent: true, durationBeats: 0.5 },
        { label: '&', active: true, durationBeats: 0.5 },
        { label: '2', active: true, accent: true, durationBeats: 1 },
        { label: '3', active: false, durationBeats: 1 },
        { label: '4', active: true, accent: false, durationBeats: 1 },
      ]),
      hitStarts: scaleTimes([0, 0.5, 1, 3]),
      hitDurations: scaleTimes([0.45, 0.45, 0.95, 0.9]),
    },
    {
      id: `rhythm-${chordIndex}-blues-swing`,
      name: 'Pergunta & Resposta',
      feelTag: isSwingOrBlues ? 'Blues / Jazz' : 'Dinâmico',
      notation: '1  •  (2)  &  •  3  •  4  &',
      description: 'Deixe respiração após a primeira nota e responda com frase no contratempo.',
      slots: scaleSlots([
        { label: '1', active: true, accent: true, durationBeats: 1 },
        { label: '2', active: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: true, durationBeats: 1 },
        { label: '3', active: true, accent: false, durationBeats: 0.5 },
        { label: '4', active: true, accent: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: true, durationBeats: 0.5 },
      ]),
      hitStarts: scaleTimes([0, 1.5, 2.5, 3, 3.5]),
      hitDurations: scaleTimes([0.9, 0.9, 0.45, 0.45, 0.45]),
    },
    {
      id: `rhythm-${chordIndex}-offbeat-hook`,
      name: 'Entrada em Contratempo',
      feelTag: 'Riff / Hook',
      notation: '(1)  &  2  •  (3)  &  4',
      description: 'Evita cair sempre na cabeça do compasso, criando fraseado leve sobre os tempos 2 e 4.',
      slots: scaleSlots([
        { label: '1', active: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: true, durationBeats: 0.5 },
        { label: '2', active: true, accent: false, durationBeats: 1 },
        { label: '3', active: false, durationBeats: 0.5 },
        { label: '&', active: true, accent: true, durationBeats: 0.5 },
        { label: '4', active: true, accent: true, durationBeats: 1 },
      ]),
      hitStarts: scaleTimes([0.5, 1, 2.5, 3]),
      hitDurations: scaleTimes([0.45, 0.95, 0.45, 0.95]),
    },
  ];

  const cadencePattern: RhythmicPatternSuggestion = {
    id: `rhythm-${chordIndex}-cadence-drive`,
    name: 'Impulso Cadencial Crescente',
    feelTag: 'Preparação',
    notation: '(1)  &  2  &  3  &  4',
    description: 'Entrada leve após o tempo 1 e caminhada constante em colcheias até o próximo acorde.',
    slots: scaleSlots([
      { label: '1', active: false, durationBeats: 0.5 },
      { label: '&', active: true, durationBeats: 0.5 },
      { label: '2', active: true, accent: true, durationBeats: 0.5 },
      { label: '&', active: true, durationBeats: 0.5 },
      { label: '3', active: true, accent: true, durationBeats: 1 },
      { label: '4', active: true, accent: true, durationBeats: 1 },
    ]),
    hitStarts: scaleTimes([0.5, 1, 1.5, 2, 3]),
    hitDurations: scaleTimes([0.45, 0.45, 0.45, 0.9, 0.95]),
  };

  // Order candidate indices differently by genre, then rotate per chordIndex + variationSeed
  const preferredOrder = isSwingOrBlues
    ? [3, 4, 2, 1, 0]
    : isGrooveGenre
    ? [0, 4, 2, 3, 1]
    : [1, 2, 0, 3, 4];

  const offsetA = (chordIndex + variationSeed) % preferredOrder.length;
  const patternA = patternPool[preferredOrder[offsetA]];

  let patternB: RhythmicPatternSuggestion;
  if (isDominantOrCadence) {
    patternB = cadencePattern;
  } else {
    const offsetB = (offsetA + 2) % preferredOrder.length;
    patternB = patternPool[preferredOrder[offsetB]];
  }

  return [patternA, patternB];
}

/**
 * Constructs a short playable MelodicPhraseSuggestion using notes exclusively from scaleNotes
 */
function buildPhraseFromScaleSequence(
  id: string,
  title: string,
  tag: MelodicPhraseSuggestion['tag'],
  rhythmName: string,
  explanation: string,
  chosenScaleNotes: ScaleNoteInfo[],
  hitStarts: number[],
  hitDurations: number[],
  durationBeats: number,
  chordIndex: number,
  chordSemitonesSet: Set<number>,
  scaleRootSt: number
): MelodicPhraseSuggestion {
  const count = Math.min(chosenScaleNotes.length, hitStarts.length);
  const notes: MelodyNote[] = [];
  const steps: PhraseStepBadge[] = [];
  let prevMidi: number | undefined;

  for (let i = 0; i < count; i++) {
    const sn = chosenScaleNotes[i];
    const startBeat = hitStarts[i];
    if (startBeat >= durationBeats) break;
    const dur = Math.min(hitDurations[i], durationBeats - startBeat);
    if (dur < 0.2) break;

    const noteSt = sn.midi % 12;
    const oct = pickMelodyOctave(noteSt, 4, prevMidi);
    const midi = (oct + 1) * 12 + noteSt;
    prevMidi = midi;

    const isChordTarget = chordSemitonesSet.has(noteSt);
    const role: MelodyNote['role'] = sn.isRoot
      ? 'root'
      : isChordTarget
      ? 'third'
      : sn.isCharacteristic
      ? 'accent'
      : 'passing';

    notes.push({
      id: `${id}-n-${i}`,
      note: `${sn.note}${oct}`,
      noteName: sn.note,
      octave: oct,
      midi,
      durationBeats: dur,
      startBeat,
      chordIndex,
      role,
      degree: getDegreeLabel(noteSt, scaleRootSt),
    });

    steps.push({
      note: `${sn.note}${oct}`,
      noteName: sn.note,
      degree: sn.intervalName,
      durationBeats: dur,
      isChordTarget,
      isCharacteristic: sn.isCharacteristic,
    });
  }

  return {
    id,
    title,
    tag,
    rhythmName,
    explanation,
    notes,
    steps,
    totalBeats: durationBeats,
  };
}

/**
 * Analyzes the current chord progression against the selected scale from the Scale Dictionary
 * and generates rhythmic patterns + short melodic phrases for every chord.
 */
export function analyzeProgressionForImprovisation(
  timeline: TimelineChordItem[],
  scaleRoot: string,
  scaleId: string,
  genre: Genre = 'pop',
  variationSeed = 0
): ProgressionImprovisationAnalysis {
  const scaleDef =
    SCALE_DICTIONARY_DATABASE.find((s) => s.id === scaleId) || SCALE_DICTIONARY_DATABASE[0];
  const scaleNotes = getScaleNotesForRoot(scaleRoot, scaleDef);
  const scaleRootSt = getSemitone(scaleRoot);
  const scaleSemitonesSet = new Set(scaleNotes.map((n) => n.midi % 12));
  const characteristicNote =
    scaleNotes.find((n) => n.isCharacteristic) || scaleNotes[Math.min(1, scaleNotes.length - 1)];

  const chordGuides: ChordImprovisationGuide[] = timeline.map((item, idx) => {
    const chord = item.chord;
    const chordNoteNames = chord.noteNames && chord.noteNames.length > 0 ? chord.noteNames : [chord.root];
    const chordSemitones = chordNoteNames.map((n) => getSemitone(n));
    const chordSemitonesSet = new Set(chordSemitones);

    // 1. Target notes (chord tones inside selected scale) & outside notes
    const targetNotes: { note: string; intervalInScale: string; roleInChord: string }[] = [];
    const outsideNotes: string[] = [];

    chordNoteNames.forEach((cn) => {
      const st = getSemitone(cn);
      const scaleMatch = scaleNotes.find((sn) => sn.midi % 12 === st);
      if (scaleMatch) {
        targetNotes.push({
          note: scaleMatch.note,
          intervalInScale: scaleMatch.intervalName,
          roleInChord: getChordToneRole(st, chord),
        });
      } else {
        outsideNotes.push(cn);
      }
    });

    // 2. Color notes (scale notes NOT in chord triad/tetrad)
    const colorNotes = scaleNotes
      .filter((sn) => !chordSemitonesSet.has(sn.midi % 12))
      .map((sn) => ({
        note: sn.note,
        intervalInScale: sn.intervalName,
        isCharacteristic: sn.isCharacteristic,
      }));

    const compatibilityPercent = Math.round(
      (targetNotes.length / Math.max(1, chordNoteNames.length)) * 100
    );
    const compatibilityLevel: ChordImprovisationGuide['compatibilityLevel'] =
      compatibilityPercent === 100 ? 'perfect' : compatibilityPercent >= 50 ? 'partial' : 'outside';

    const harmonicFunction = getHarmonicFunctionLabel(chord, scaleRootSt);
    const isDominantOrCadence =
      chord.quality === '7' || (getSemitone(chord.root) - scaleRootSt + 12) % 12 === 7;

    // 3. Generate Rhythmic Patterns
    const rhythmPatterns = buildRhythmicPatternsForChord(
      idx,
      item.durationBeats || 4,
      genre,
      isDominantOrCadence,
      variationSeed
    );

    // Helper: get ordered scale notes starting near a chord tone
    const anchorTarget =
      targetNotes[1] || targetNotes[0] || { note: scaleNotes[0].note, intervalInScale: 'T', roleInChord: 'Tônica' };
    const anchorIdxRaw = scaleNotes.findIndex((sn) => sn.note === anchorTarget.note);
    const anchorIdx = anchorIdxRaw >= 0 ? anchorIdxRaw : 0;

    const getScaleAtOffset = (offset: number) =>
      scaleNotes[((anchorIdx + offset) % scaleNotes.length + scaleNotes.length) % scaleNotes.length];

    // Next chord target for smooth voice-leading phrase
    const nextItem = timeline[(idx + 1) % timeline.length];
    const nextChordSemitones = new Set(
      (nextItem?.chord.noteNames || [scaleRoot]).map((n) => getSemitone(n))
    );
    // Find scale note closest to a chord tone of the NEXT chord
    let bridgeScaleNote = scaleNotes[(anchorIdx + 2) % scaleNotes.length];
    for (const sn of scaleNotes) {
      const snSt = sn.midi % 12;
      if (nextChordSemitones.has(snSt)) {
        bridgeScaleNote = sn;
        break;
      }
    }

    const rMain = rhythmPatterns[0];
    const rAlt = rhythmPatterns[1] || rhythmPatterns[0];
    const dur = item.durationBeats || 4;

    // Phrase 1: Safe Target-Tone Motif
    const seq1Count = rMain.hitStarts.length;
    const seq1PatternOffsets =
      (variationSeed + idx) % 2 === 0 ? [0, 1, 2, 0, -1, 0] : [0, 2, 1, 3, 2, 0];
    const seq1Notes: ScaleNoteInfo[] = Array.from({ length: seq1Count }, (_, k) =>
      getScaleAtOffset(seq1PatternOffsets[k % seq1PatternOffsets.length])
    );
    // Force last note onto a strong target note inside the chord if possible
    if (seq1Notes.length > 1 && targetNotes.length > 0) {
      const lastTarget = scaleNotes.find((sn) => sn.note === targetNotes[0].note);
      if (lastTarget) seq1Notes[seq1Notes.length - 1] = lastTarget;
    }

    const phrase1 = buildPhraseFromScaleSequence(
      `phrase-${idx}-target-${variationSeed}`,
      `Motivo Seguro (${targetNotes.map((t) => t.note).slice(0, 2).join(' - ') || scaleNotes[0].note})`,
      'Alvo',
      rMain.name,
      `Apoia os tempos fortes nas notas-alvo de ${chord.symbol} (${targetNotes.map((t) => `${t.note} [${t.roleInChord}]`).slice(0, 2).join(', ') || 'escala'}) para máxima clareza harmônica.`,
      seq1Notes,
      rMain.hitStarts,
      rMain.hitDurations,
      dur,
      idx,
      chordSemitonesSet,
      scaleRootSt
    );

    // Phrase 2: Modal / Characteristic Color Lick
    const charIdxRaw = scaleNotes.findIndex((sn) => sn.note === characteristicNote.note);
    const charIdx = charIdxRaw >= 0 ? charIdxRaw : 1;
    const seq2Count = rAlt.hitStarts.length;
    const seq2Candidates: ScaleNoteInfo[] = [
      scaleNotes[anchorIdx],
      scaleNotes[charIdx],
      scaleNotes[(charIdx + 1) % scaleNotes.length],
      scaleNotes[charIdx],
      scaleNotes[anchorIdx],
    ];
    const seq2Notes: ScaleNoteInfo[] = Array.from(
      { length: seq2Count },
      (_, k) => seq2Candidates[k % seq2Candidates.length]
    );

    const phrase2 = buildPhraseFromScaleSequence(
      `phrase-${idx}-modal-${variationSeed}`,
      `Cor ${scaleDef.name.split(' ')[0]} (${characteristicNote.note})`,
      'Modal',
      rAlt.name,
      `Realça o intervalo característico ${characteristicNote.intervalName} (${characteristicNote.note}) da escala ${scaleDef.name} trazendo o clima "${scaleDef.mood.split(',')[0]}".`,
      seq2Notes,
      rAlt.hitStarts,
      rAlt.hitDurations,
      dur,
      idx,
      chordSemitonesSet,
      scaleRootSt
    );

    // Phrase 3: Connecting / Resolution Phrase toward next chord (distinct rhythm & contour)
    const isLastChord = idx === timeline.length - 1;
    const rBridge = rAlt.hitStarts.length >= 2 ? rAlt : rMain;
    const bridgeIdxRaw = scaleNotes.findIndex((sn) => sn.note === bridgeScaleNote.note);
    const bridgeIdx = bridgeIdxRaw >= 0 ? bridgeIdxRaw : 0;
    const seq3Count = rBridge.hitStarts.length;
    const seq3Notes: ScaleNoteInfo[] = [];
    for (let k = 0; k < seq3Count; k++) {
      if (k === seq3Count - 1) {
        seq3Notes.push(scaleNotes[bridgeIdx]);
      } else {
        const stepOffset = seq3Count - k;
        const dir = (k + variationSeed + idx) % 2 === 0 ? -stepOffset : stepOffset;
        seq3Notes.push(
          scaleNotes[((bridgeIdx + dir) % scaleNotes.length + scaleNotes.length) % scaleNotes.length]
        );
      }
    }

    const phrase3 = buildPhraseFromScaleSequence(
      `phrase-${idx}-bridge-${variationSeed}`,
      isLastChord
        ? `Resolução Final (${bridgeScaleNote.note})`
        : `Conexão p/ ${nextItem.chord.symbol} (${bridgeScaleNote.note})`,
      isLastChord ? 'Resolução' : 'Conexão',
      rBridge.name,
      isLastChord
        ? `Conduz a melodia gradualmente até ${bridgeScaleNote.note} (${bridgeScaleNote.intervalName}), fechando o ciclo com naturalidade.`
        : `Caminha pela escala preparando a nota ${bridgeScaleNote.note} como ponte suave para o acorde seguinte (${nextItem.chord.symbol}).`,
      seq3Notes,
      rBridge.hitStarts,
      rBridge.hitDurations,
      dur,
      idx,
      chordSemitonesSet,
      scaleRootSt
    );

    // Summary guidance text for this chord
    let guidanceSummary = '';
    if (compatibilityLevel === 'perfect') {
      guidanceSummary = `Todas as notas de ${chord.symbol} pertencem à escala ${scaleRoot} ${scaleDef.name}. Foque em ${targetNotes
        .slice(0, 2)
        .map((t) => t.note)
        .join(' e ')} nos tempos fortes e use ${colorNotes
        .slice(0, 2)
        .map((c) => c.note)
        .join('/')} como tensão.`;
    } else if (compatibilityLevel === 'partial') {
      guidanceSummary = `Encaixe modal com notas em comum (${targetNotes
        .map((t) => t.note)
        .join(', ')}). Evite sustentar sobre ${outsideNotes.join(', ')} — use apenas como passagem rápida.`;
    } else {
      guidanceSummary = `${chord.symbol} contém notas fora de ${scaleRoot} ${scaleDef.name} (${outsideNotes.join(
        ', '
      )}). Priorize as notas em comum ou faça aproximações cromáticas curtas.`;
    }

    return {
      chordIndex: idx,
      item,
      harmonicFunction,
      compatibilityPercent,
      compatibilityLevel,
      targetNotes,
      colorNotes,
      outsideNotes,
      guidanceSummary,
      rhythmPatterns,
      phrases: [phrase1, phrase2, phrase3],
    };
  });

  const overallCompatibility =
    chordGuides.length > 0
      ? Math.round(
          chordGuides.reduce((sum, g) => sum + g.compatibilityPercent, 0) / chordGuides.length
        )
      : 100;

  const progressionSummary =
    overallCompatibility >= 85
      ? `Excelente aderência! A escala ${scaleRoot} ${scaleDef.name} cobre ${overallCompatibility}% da harmonia — explore frases contínuas destacando ${characteristicNote.note} (${characteristicNote.intervalName}).`
      : overallCompatibility >= 60
      ? `Compatibilidade modal (${overallCompatibility}%). Destaque as notas-alvo de cada acorde nos tempos 1 e 3 e trate as demais como cor ou passagem.`
      : `Contraste harmônico elevado (${overallCompatibility}%). Use frases curtas ancoradas nas notas em comum de cada acorde ou selecione "Detectar Tom" para alinhar a escala.`;

  void scaleSemitonesSet;

  return {
    scaleRoot,
    scaleDef,
    scaleNotes,
    overallCompatibility,
    progressionSummary,
    chordGuides,
  };
}

/**
 * Recommends the best matching (root, scaleId) from SCALE_DICTIONARY_DATABASE for the active timeline
 */
export function detectBestScaleForProgression(
  timeline: TimelineChordItem[],
  genre: Genre
): { root: string; scaleId: string; reason: string } {
  if (!timeline || timeline.length === 0) {
    return { root: 'C', scaleId: 'ionian', reason: 'Padrão inicial em Dó Maior' };
  }

  const firstChord = timeline[0].chord;
  const root = firstChord.root || 'C';
  const rootSt = getSemitone(root);

  const isFirstMinor = firstChord.quality === 'minor' || firstChord.quality === 'm7';
  const hasDom7 = timeline.some((t) => t.chord.quality === '7');
  const hasMaj7 = timeline.some((t) => t.chord.quality === 'maj7');

  // Collect all chord tone semitones across progression (weighted by duration)
  const chordToneWeights: Map<number, number> = new Map();
  for (const item of timeline) {
    const w = item.durationBeats || 4;
    for (const n of item.chord.noteNames || [item.chord.root]) {
      const st = getSemitone(n);
      chordToneWeights.set(st, (chordToneWeights.get(st) || 0) + w);
    }
  }

  // Genre preference bonus
  if (genre === 'blues') {
    return {
      root,
      scaleId: 'blues',
      reason: `Escala Blues de ${root} ideal para sonoridade ${firstChord.symbol} e bends expressivos`,
    };
  }

  // Score candidate scales rooted at timeline's tonal center
  const candidateIds = isFirstMinor
    ? ['aeolian', 'dorian', 'pentatonic_minor', 'harmonic_minor', 'blues']
    : genre === 'rock' && !hasMaj7
    ? ['pentatonic_major', 'mixolydian', 'ionian']
    : hasDom7 && firstChord.quality === '7'
    ? ['mixolydian', 'blues', 'bebop_dominant', 'ionian']
    : ['ionian', 'lydian', 'pentatonic_major', 'mixolydian'];

  let bestId = candidateIds[0];
  let bestScore = -1;

  for (const sId of candidateIds) {
    const def = SCALE_DICTIONARY_DATABASE.find((s) => s.id === sId);
    if (!def) continue;
    const scaleSts = new Set(def.intervals.map((i) => (rootSt + i) % 12));
    let score = 0;
    chordToneWeights.forEach((weight, st) => {
      if (scaleSts.has(st)) score += weight * 10;
    });
    // Slight preference for 7-note diatonic modes when tied
    if (def.intervals.length === 7) score += 2;
    if (score > bestScore) {
      bestScore = score;
      bestId = sId;
    }
  }

  const chosen = SCALE_DICTIONARY_DATABASE.find((s) => s.id === bestId);
  return {
    root,
    scaleId: bestId,
    reason: `Detectado tom ${root} com ${chosen?.name || bestId} para máxima compatibilidade com ${timeline
      .map((t) => t.chord.symbol)
      .join(' → ')}`,
  };
}

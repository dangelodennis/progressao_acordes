import { ChordDefinition, TimelineChordItem } from '../types';
import { getSemitone } from './melodyGenerator';

export type TensionCategory = 'repouso' | 'resolucao' | 'instavel' | 'tensao';

export interface ChordTensionAnalysis {
  category: TensionCategory;
  label: 'Repouso' | 'Resolução' | 'Instável' | 'Tensão';
  /** 1 to 4 intensity bars */
  level: 1 | 2 | 3 | 4;
  /** 0 to 100 numeric tension score */
  score: number;
  /** Roman numeral degree in detected tonal center (e.g. "I", "ii7", "V7", "vi") */
  romanNumeral: string;
  /** Short music-theory reason for tooltip */
  reason: string;
}

const MAJOR_ROMAN_NUMERALS: Record<number, string> = {
  0: 'I',
  1: 'bII',
  2: 'II',
  3: 'bIII',
  4: 'III',
  5: 'IV',
  6: '#IV',
  7: 'V',
  8: 'bVI',
  9: 'VI',
  10: 'bVII',
  11: 'VII',
};

function formatRomanNumeral(diffSemitones: number, chord: ChordDefinition): string {
  const base = MAJOR_ROMAN_NUMERALS[(diffSemitones + 12) % 12] || 'I';
  const q = chord.quality;
  const isLower = q === 'minor' || q === 'm7' || q === 'dim';
  const numeral = isLower ? base.toLowerCase() : base;

  if (q === '7') return `${numeral}7`;
  if (q === 'maj7') return `${numeral}7M`;
  if (q === 'm7') return `${numeral}7`;
  if (q === 'sus4') return `${numeral}sus4`;
  if (q === 'sus2') return `${numeral}sus2`;
  if (q === 'add9') return `${numeral}add9`;
  if (q === 'dim') return `${numeral}°`;
  if (q === 'aug') return `${numeral}+`;
  if (q === '5') return `${numeral}5`;
  return numeral;
}

function isDominantPullToNext(prev: ChordDefinition, current: ChordDefinition): {
  isResolution: boolean;
  reason?: string;
} {
  const prevRoot = getSemitone(prev.root);
  const currRoot = getSemitone(current.root);
  const intervalToCurr = (prevRoot - currRoot + 12) % 12;

  // V -> I or V7 -> I (dominant a perfect 5th above current chord)
  if (intervalToCurr === 7 && (prev.quality === '7' || prev.quality === 'major' || prev.quality === 'aug' || prev.quality === 'sus4')) {
    return {
      isResolution: true,
      reason: `Resolve a tensão dominante de ${prev.symbol} (${prev.quality === '7' ? 'V7' : 'V'} → ${current.symbol})`,
    };
  }

  // vii° -> I or bII7 (tritone sub) -> I (semitone above current chord)
  if (intervalToCurr === 1 && (prev.quality === 'dim' || prev.quality === '7')) {
    return {
      isResolution: true,
      reason: `Resolução por movimento de semitom após ${prev.symbol}`,
    };
  }

  // Leading-tone / chromatic rise from 1 semitone below (e.g. vii° on 11 -> I on 0)
  if ((currRoot - prevRoot + 12) % 12 === 1 && prev.quality === 'dim') {
    return {
      isResolution: true,
      reason: `Resolução da sensível diminuta (${prev.symbol} → ${current.symbol})`,
    };
  }

  // Suspension resolution on the same root (e.g. Csus4 -> C or Csus2 -> C)
  if (
    prevRoot === currRoot &&
    (prev.quality === 'sus4' || prev.quality === 'sus2') &&
    (current.quality === 'major' || current.quality === 'minor' || current.quality === 'maj7' || current.quality === 'm7')
  ) {
    return {
      isResolution: true,
      reason: `Resolve a suspensão de ${prev.symbol} na terça do acorde`,
    };
  }

  return { isResolution: false };
}

/**
 * Infers the most likely tonal center of the timeline for Roman-numeral and tension scoring.
 */
function inferTonalCenter(timeline: TimelineChordItem[]): { keyRootSt: number; isMinorKey: boolean } {
  if (timeline.length === 0) {
    return { keyRootSt: 0, isMinorKey: false };
  }

  const first = timeline[0].chord;
  const last = timeline[timeline.length - 1].chord;

  // Check if the final chord is resolved by its preceding dominant (strong cadential anchor)
  if (timeline.length >= 2) {
    const prevLast = timeline[timeline.length - 2].chord;
    const resolutionCheck = isDominantPullToNext(prevLast, last);
    const lastStable =
      last.quality === 'major' ||
      last.quality === 'minor' ||
      last.quality === 'maj7' ||
      last.quality === 'm7' ||
      last.quality === 'add9';

    if (resolutionCheck.isResolution && lastStable && first.quality === '7') {
      return {
        keyRootSt: getSemitone(last.root),
        isMinorKey: last.quality === 'minor' || last.quality === 'm7',
      };
    }
  }

  // If the first chord is a stable tonic-capable chord, anchor on it
  if (first.quality !== 'dim' && first.quality !== 'aug') {
    return {
      keyRootSt: getSemitone(first.root),
      isMinorKey: first.quality === 'minor' || first.quality === 'm7',
    };
  }

  return {
    keyRootSt: getSemitone(last.root),
    isMinorKey: last.quality === 'minor' || last.quality === 'm7',
  };
}

function getBaseTensionForChord(
  chord: ChordDefinition,
  diffFromKey: number,
  isMinorKey: boolean,
  nextChord?: ChordDefinition
): Omit<ChordTensionAnalysis, 'romanNumeral'> {
  const q = chord.quality;
  const hasInversionBass = Boolean(chord.bassNote && chord.bassNote !== chord.root);
  const invSuffix = hasInversionBass ? ` (baixo em ${chord.bassNote})` : '';

  // 1. Inherently high-dissonance chord qualities (tritones / augmented)
  if (q === 'dim') {
    return {
      category: 'tensao',
      label: 'Tensão',
      level: 4,
      score: 94,
      reason: `Acorde diminuto com trítono e 5ª diminuta${invSuffix} — forte impulso para resolução`,
    };
  }

  if (q === 'aug') {
    return {
      category: 'tensao',
      label: 'Tensão',
      level: 4,
      score: 88,
      reason: `Acorde aumentado (#5)${invSuffix} — sonoridade suspensa que pede movimento`,
    };
  }

  // 2. Dominant 7th (7) — always carries a tritone between 3M and 7m
  if (q === '7') {
    const isPrimaryDominant = diffFromKey === 7;
    const isSecondaryDom =
      nextChord !== undefined &&
      ((getSemitone(chord.root) - getSemitone(nextChord.root) + 12) % 12 === 7 ||
        (getSemitone(chord.root) - getSemitone(nextChord.root) + 12) % 12 === 1);

    if (isPrimaryDominant) {
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 4,
        score: 92,
        reason: `Dominante com 7ª (V7)${invSuffix} — trítono entre 3ª e 7ªm gera tensão máxima`,
      };
    }

    if (isSecondaryDom && nextChord) {
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 4,
        score: 86,
        reason: `Dominante secundário / blues (7ª)${invSuffix} — prepara fortemente ${nextChord.symbol}`,
      };
    }

    return {
      category: 'tensao',
      label: 'Tensão',
      level: 3,
      score: 76,
      reason: `Acorde com 7ª menor dominante${invSuffix} — contém trítono interno ativo`,
    };
  }

  // 3. Suspended chords (sus4 / sus2) — lack the 3rd, creating harmonic instability
  if (q === 'sus4') {
    if (diffFromKey === 7) {
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 3,
        score: 74,
        reason: `Dominante suspenso (Vsus4)${invSuffix} — retarda a resolução cadencial`,
      };
    }
    return {
      category: 'instavel',
      label: 'Instável',
      level: 2,
      score: 58,
      reason: `Acorde suspenso (4ª no lugar da 3ª)${invSuffix} — cria expectativa aberta`,
    };
  }

  if (q === 'sus2') {
    return {
      category: 'instavel',
      label: 'Instável',
      level: 2,
      score: 48,
      reason: `Acorde sus2 sem definição de terça${invSuffix} — sonoridade aberta e flutuante`,
    };
  }

  // 4. Harmonic function by scale degree relative to inferred key
  switch (diffFromKey) {
    case 0: {
      // Tonic degree (I / i)
      if (hasInversionBass) {
        return {
          category: 'instavel',
          label: 'Instável',
          level: 2,
          score: 38,
          reason: `Tônica invertida${invSuffix} — mantém cor da tônica com leve movimento de baixo`,
        };
      }
      return {
        category: 'repouso',
        label: 'Repouso',
        level: 1,
        score: q === 'maj7' || q === 'add9' ? 16 : 10,
        reason: isMinorKey
          ? 'Tônica menor (i) — ponto central de repouso e equilíbrio'
          : 'Tônica (I) — ponto central de repouso e estabilidade harmônica',
      };
    }

    case 7: {
      // Dominant degree (V / v)
      const isMinorDom = q === 'minor' || q === 'm7';
      if (isMinorDom) {
        return {
          category: 'instavel',
          label: 'Instável',
          level: 2,
          score: 54,
          reason: `Dominante menor (v)${invSuffix} — tensão modal suave sem sensível`,
        };
      }
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 3,
        score: 78,
        reason: `Dominante (V)${invSuffix} — contém a sensível e impulsiona retorno à tônica`,
      };
    }

    case 11: {
      // Leading tone degree (VII)
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 3,
        score: 80,
        reason: `Sensível (VII)${invSuffix} — distância de semitom da tônica gera alta tensão`,
      };
    }

    case 5: {
      // Subdominant degree (IV / iv)
      const isMinorSubdom = !isMinorKey && (q === 'minor' || q === 'm7');
      if (isMinorSubdom) {
        return {
          category: 'tensao',
          label: 'Tensão',
          level: 3,
          score: 70,
          reason: `Subdominante menor emprestada (iv)${invSuffix} — forte tensão emotiva para retorno ao I`,
        };
      }
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 50,
        reason: `Subdominante (IV)${invSuffix} — afasta do repouso e prepara movimento ou cadência`,
      };
    }

    case 2: {
      // Supertonic degree (ii / II)
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 56,
        reason: `Supertônica (ii)${invSuffix} — função pré-dominante de preparação`,
      };
    }

    case 9: {
      // Submediant / Relative minor (vi / VI)
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 36,
        reason: isMinorKey
          ? `Submediante (VI)${invSuffix} — brilho contrastante em passagem`
          : `Relativo menor (vi)${invSuffix} — repouso relativo com transição lírica`,
      };
    }

    case 4:
    case 3: {
      // Mediant (iii / bIII)
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 44,
        reason: `Mediante${invSuffix} — acorde de ligação harmônica em movimento`,
      };
    }

    case 10: {
      // Subtonic (bVII)
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 62,
        reason: `Subtônica modal (bVII)${invSuffix} — energia Mixolídia que pede retorno ao tom`,
      };
    }

    case 8: {
      // Flat submediant (bVI)
      return {
        category: 'instavel',
        label: 'Instável',
        level: 2,
        score: 60,
        reason: `Empréstimo modal (bVI)${invSuffix} — tensão dramática e épica`,
      };
    }

    case 1:
    case 6:
    default: {
      // Chromatic / Tritone / Neapolitan
      return {
        category: 'tensao',
        label: 'Tensão',
        level: 3,
        score: 75,
        reason: `Acorde cromático fora da escala base${invSuffix} — cria forte contraste harmônico`,
      };
    }
  }
}

/**
 * Computes harmonic tension analysis for every chord in the timeline,
 * accounting for tonal center, chord quality, inversions, and cadential resolutions.
 */
export function analyzeTimelineHarmonicTension(
  timeline: TimelineChordItem[]
): ChordTensionAnalysis[] {
  if (timeline.length === 0) return [];

  const { keyRootSt, isMinorKey } = inferTonalCenter(timeline);

  return timeline.map((item, idx) => {
    const chord = item.chord;
    const chordRootSt = getSemitone(chord.root);
    const diffFromKey = (chordRootSt - keyRootSt + 12) % 12;
    const romanNumeral = formatRomanNumeral(diffFromKey, chord);
    const prevChord = idx > 0 ? timeline[idx - 1].chord : undefined;
    const nextChord = idx < timeline.length - 1 ? timeline[idx + 1].chord : undefined;

    const base = getBaseTensionForChord(chord, diffFromKey, isMinorKey, nextChord);

    // Check contextual resolution from previous chord
    if (prevChord && base.category !== 'tensao') {
      const pull = isDominantPullToNext(prevChord, chord);
      const isTonicArrival = diffFromKey === 0 && (chord.quality === 'major' || chord.quality === 'minor' || chord.quality === 'maj7' || chord.quality === 'm7' || chord.quality === 'add9');
      const prevWasSubdominantPlagal =
        idx === timeline.length - 1 &&
        isTonicArrival &&
        (getSemitone(prevChord.root) - keyRootSt + 12) % 12 === 5;

      if (pull.isResolution && (isTonicArrival || chord.root === prevChord.root || base.category === 'repouso')) {
        return {
          category: 'resolucao',
          label: 'Resolução',
          level: 1,
          score: 15,
          romanNumeral,
          reason: pull.reason || `Resolve a tensão harmônica anterior de ${prevChord.symbol}`,
        };
      }

      if (prevWasSubdominantPlagal) {
        return {
          category: 'resolucao',
          label: 'Resolução',
          level: 1,
          score: 18,
          romanNumeral,
          reason: `Cadência plagal (${prevChord.symbol} → ${chord.symbol}) — pouso conclusivo suave`,
        };
      }

      // Deceptive resolution (V7 -> vi)
      if (
        pull.isResolution === false &&
        diffFromKey === 9 &&
        (getSemitone(prevChord.root) - keyRootSt + 12) % 12 === 7
      ) {
        return {
          category: 'instavel',
          label: 'Instável',
          level: 2,
          score: 46,
          romanNumeral,
          reason: `Cadência de engano (${prevChord.symbol} → ${chord.symbol}) — desvia a resolução esperada`,
        };
      }
    }

    return {
      ...base,
      romanNumeral,
    };
  });
}

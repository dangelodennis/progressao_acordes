import { ChordDefinition } from '../types';
import { NOTE_TO_SEMITONE, SEMITONE_TO_SHARP_NAME, SEMITONE_TO_FLAT_NAME, getSemitone } from './melodyGenerator';

export interface ChordInversionOption {
  inversion: number; // 0 = Posição Fundamental, 1 = 1ª Inversão (terça no baixo), 2 = 2ª Inversão (quinta no baixo), 3 = 3ª Inversão (sétima no baixo)
  bassNote: string; // e.g. "E", "G", "B"
  symbol: string; // e.g. "C/E", "C/G", "C7/Bb"
  name: string; // e.g. "C/E (1ª Inversão - Baixo em Mi)"
  inversionLabel: string; // "Fundamental", "1ª Inversão", "2ª Inversão", "3ª Inversão"
  bassDegree: string; // "Fundamental (T)", "Terça (3ª)", "Quinta (5ª)", "Sétima (7ª)"
  chord: ChordDefinition; // Full ChordDefinition ready to replace or add to timeline
  description: string;
}

// Guitar standard tuning string note names and octaves:
// String 6 (E2), 5 (A2), 4 (D3), 3 (G3), 2 (B3), 1 (E4)
const GUITAR_OPEN_SEMITONES = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

/**
 * Calculates real guitar voicings for inversions
 */
export function findGuitarVoicingForInversion(
  baseGuitar: ChordDefinition['guitar'],
  bassNote: string,
  chordNotes: string[]
): ChordDefinition['guitar'] {
  const bassSemitone = getSemitone(bassNote);
  const chordSemitones = chordNotes.map((n) => getSemitone(n));

  // If bassNote is already lowest sounding string in original guitar chord, return as is
  let lowestString = -1;
  for (let s = 0; s < 6; s++) {
    if (baseGuitar.frets[s] >= 0) {
      lowestString = s;
      break;
    }
  }

  if (lowestString >= 0) {
    const stringOpenSt = GUITAR_OPEN_SEMITONES[lowestString];
    const soundedSt = (stringOpenSt + baseGuitar.frets[lowestString]) % 12;
    if (soundedSt === bassSemitone) {
      return baseGuitar;
    }
  }

  // Create an inverted guitar voicing with bassNote on the lowest sounding string (string 6 or 5)
  const newFrets = [...baseGuitar.frets];
  const newFingers = baseGuitar.fingers ? [...baseGuitar.fingers] : [null, null, null, null, null, null];

  // Check 6th string (Low E):
  // fret needed = (bassSemitone - 4 + 12) % 12
  const fret6 = (bassSemitone - GUITAR_OPEN_SEMITONES[0] + 12) % 12;
  // Check 5th string (A):
  const fret5 = (bassSemitone - GUITAR_OPEN_SEMITONES[1] + 12) % 12;

  if (fret6 <= 4) {
    newFrets[0] = fret6;
    newFingers[0] = fret6 === 0 ? 0 : 1;
    // Mute or keep 5th string if compatible
    return {
      frets: newFrets,
      fingers: newFingers,
      baseFret: Math.max(1, baseGuitar.baseFret),
    };
  } else if (fret5 <= 4) {
    newFrets[0] = -1; // Mute string 6
    newFingers[0] = null;
    newFrets[1] = fret5;
    newFingers[1] = fret5 === 0 ? 0 : 1;
    return {
      frets: newFrets,
      fingers: newFingers,
      baseFret: Math.max(1, baseGuitar.baseFret),
    };
  }

  // Fallback: use base frets
  return baseGuitar;
}

/**
 * Calculates piano keys array for an inversion, rearranging keys so bassNote is the lowest key
 */
function createPianoKeysForInversion(chord: ChordDefinition, bassNote: string, invIndex: number): { keys: string[]; rootKey: string } {
  const noteNames = chord.noteNames || [];
  if (noteNames.length === 0) {
    return chord.piano;
  }

  // Locate where bassNote is in noteNames
  const bassIdx = noteNames.findIndex((n) => getSemitone(n) === getSemitone(bassNote));
  if (bassIdx <= 0) {
    return chord.piano;
  }

  // Reorder noteNames starting from bassNote
  const reordered = [...noteNames.slice(bassIdx), ...noteNames.slice(0, bassIdx)];

  // Build piano keys ascending in pitch
  let currentOctave = 4;
  let lastMidi = -1;
  const newKeys: string[] = [];

  reordered.forEach((noteName, idx) => {
    let oct = currentOctave;
    // Calculate approximate semitone
    const semitone = getSemitone(noteName);
    let midi = (oct + 1) * 12 + semitone;
    if (lastMidi !== -1 && midi <= lastMidi) {
      oct += 1;
      currentOctave = oct;
      midi = (oct + 1) * 12 + semitone;
    }
    lastMidi = midi;
    newKeys.push(`${noteName}${oct}`);
  });

  return {
    keys: newKeys,
    rootKey: newKeys[0] || `${bassNote}4`,
  };
}

/**
 * Computes all standard inversions for a given ChordDefinition
 */
export function getChordInversions(chord: ChordDefinition): ChordInversionOption[] {
  const options: ChordInversionOption[] = [];
  const noteNames = chord.noteNames && chord.noteNames.length > 0
    ? chord.noteNames
    : [chord.root];

  // 1. Root Position (Posição Fundamental)
  options.push({
    inversion: 0,
    bassNote: chord.root,
    symbol: chord.symbol,
    name: `${chord.name} (Fundamental)`,
    inversionLabel: 'Posição Fundamental',
    bassDegree: 'Fundamental (Tônica)',
    chord: {
      ...chord,
      bassNote: chord.root,
      inversion: 0,
    },
    description: 'Baixo na tônica original do acorde. Maior estabilidade tonal.',
  });

  // 2. Inversions for each chord tone (3rd, 5th, 7th...)
  for (let i = 1; i < noteNames.length; i++) {
    const bassNote = noteNames[i];
    let bassDegree = 'Terça (3ª)';
    let inversionLabel = `${i}ª Inversão`;
    let desc = 'Condução melódica suave da linha de baixo.';

    if (i === 1) {
      bassDegree = chord.quality.includes('minor') || chord.quality === 'dim' ? 'Terça Menor (3ªm)' : 'Terça Maior (3ªM)';
      inversionLabel = '1ª Inversão';
      desc = `Baixo na terça (${bassNote}). Traz sonoridade aberta, suave e excelente para transições graduais.`;
    } else if (i === 2) {
      bassDegree = chord.quality === 'dim' ? 'Quinta Diminuta (b5)' : chord.quality === 'aug' ? 'Quinta Aumentada (#5)' : 'Quinta Justa (5ª)';
      inversionLabel = '2ª Inversão';
      desc = `Baixo na quinta (${bassNote}). Cria sensação de cadência suspensa ou movimento de pedal tonal.`;
    } else if (i === 3) {
      bassDegree = chord.quality === 'maj7' ? 'Sétima Maior (7ªM)' : 'Sétima Menor (7ªm)';
      inversionLabel = '3ª Inversão';
      desc = `Baixo na sétima (${bassNote}). Tensão harmônica refinada preparando resolução imediata no acorde seguinte.`;
    }

    const invertedSymbol = `${chord.symbol}/${bassNote}`;
    const invertedName = `${invertedSymbol} (${inversionLabel} - Baixo em ${bassNote})`;

    // Reorder full notes array so bass note is placed first
    const pianoConfig = createPianoKeysForInversion(chord, bassNote, i);
    const guitarConfig = findGuitarVoicingForInversion(chord.guitar, bassNote, noteNames);

    const invertedChord: ChordDefinition = {
      ...chord,
      id: `${chord.id}_inv_${i}_${bassNote}`,
      symbol: invertedSymbol,
      name: invertedName,
      bassNote,
      inversion: i,
      piano: pianoConfig,
      guitar: guitarConfig,
      notes: pianoConfig.keys,
      scale: {
        ...chord.scale,
        name: `${chord.scale.name} (Baixo em ${bassNote})`,
        soloingTips: `Com o baixo em ${bassNote}, conecte o movimento do baixo por grau conjunto até o próximo acorde.`,
      },
    };

    options.push({
      inversion: i,
      bassNote,
      symbol: invertedSymbol,
      name: invertedName,
      inversionLabel,
      bassDegree,
      chord: invertedChord,
      description: desc,
    });
  }

  return options;
}

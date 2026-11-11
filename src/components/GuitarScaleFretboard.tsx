import React, { useState } from 'react';
import { ChordDefinition, InstrumentType } from '../types';
import {
  getSemitone,
  getDegreeLabel,
  SEMITONE_TO_SHARP_NAME,
} from '../utils/melodyGenerator';

interface GuitarScaleFretboardProps {
  rootNote: string;
  scaleSemitones: number[];
  activeChord?: ChordDefinition;
  activeMelodyMidi?: number | null;
  onPlayNote?: (noteStr: string, instrument: InstrumentType) => void;
  instrument?: InstrumentType;
}

// 6 Strings from 1 (High E) to 6 (Low E)
const STRINGS = [
  { index: 1, name: 'e', openMidi: 64, openNote: 'E4' }, // High E
  { index: 2, name: 'B', openMidi: 59, openNote: 'B3' },
  { index: 3, name: 'G', openMidi: 55, openNote: 'G3' },
  { index: 4, name: 'D', openMidi: 50, openNote: 'D3' },
  { index: 5, name: 'A', openMidi: 45, openNote: 'A2' },
  { index: 6, name: 'E', openMidi: 40, openNote: 'E2' }, // Low E
];

const NUM_FRETS = 15; // 0 (nut/open) to 15

export const GuitarScaleFretboard: React.FC<GuitarScaleFretboardProps> = ({
  rootNote,
  scaleSemitones,
  activeChord,
  activeMelodyMidi,
  onPlayNote,
  instrument = 'guitar',
}) => {
  const [labelMode, setLabelMode] = useState<'note' | 'degree'>('note');

  const rootSemitone = getSemitone(rootNote);

  // Extract chord semitones if activeChord is present
  const chordSemitones = activeChord
    ? activeChord.noteNames.map((n) => getSemitone(n))
    : [];

  // Helper to convert MIDI number to note name with octave (e.g. 60 -> "C4")
  const midiToNoteStr = (midi: number): string => {
    const semitone = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = SEMITONE_TO_SHARP_NAME[semitone];
    return `${noteName}${octave}`;
  };

  const handleNoteClick = (midi: number) => {
    if (onPlayNote) {
      const noteStr = midiToNoteStr(midi);
      onPlayNote(noteStr, instrument);
    }
  };

  // Check which frets have inlays
  const isSingleDotFret = (fret: number) => [3, 5, 7, 9, 15].includes(fret);
  const isDoubleDotFret = (fret: number) => fret === 12;

  return (
    <div className="w-full flex flex-col space-y-2">
      {/* Header controls inside visualizer */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-light">
            Braço do Violão / Guitarra (15 Trastes)
          </span>
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-[#141722] border border-[#202534] rounded-none">
            Afinação Padrão: E A D G B e
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-light">Visualizar:</span>
          <div className="flex rounded-none border border-[#232836] overflow-hidden text-[10px]">
            <button
              type="button"
              onClick={() => setLabelMode('note')}
              className={`px-2 py-0.5 transition-colors ${
                labelMode === 'note'
                  ? 'bg-[#1f2433] text-slate-200'
                  : 'bg-[#12151d] text-slate-400 hover:text-slate-300'
              }`}
            >
              Nome da Nota
            </button>
            <button
              type="button"
              onClick={() => setLabelMode('degree')}
              className={`px-2 py-0.5 transition-colors border-l border-[#232836] ${
                labelMode === 'degree'
                  ? 'bg-[#1f2433] text-slate-200'
                  : 'bg-[#12151d] text-slate-400 hover:text-slate-300'
              }`}
            >
              Grau (T, 3ª, 5ª)
            </button>
          </div>
        </div>
      </div>

      {/* Fretboard Canvas Container with smooth horizontal scroll */}
      <div className="overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#232836] scrollbar-track-transparent">
        <div className="min-w-[760px] bg-[#0f1118] border border-[#202534] p-3 rounded-none select-none relative">
          {/* Fret number header */}
          <div className="grid grid-cols-[38px_42px_repeat(14,1fr)] mb-1.5 text-center text-[10px] text-slate-400 font-light">
            <div>Corda</div>
            <div>Solta (0)</div>
            {Array.from({ length: NUM_FRETS - 1 }).map((_, idx) => {
              const fretNum = idx + 1;
              const isSpecial = isSingleDotFret(fretNum) || isDoubleDotFret(fretNum);
              return (
                <div
                  key={`fret-num-${fretNum}`}
                  className={`${isSpecial ? 'text-amber-400/80 font-normal' : 'text-slate-400'}`}
                >
                  {fretNum}
                  {fretNum === 12 && 'ª'}
                </div>
              );
            })}
          </div>

          {/* Strings Grid */}
          <div className="relative border-y border-[#252b3c] bg-[#121520]">
            {STRINGS.map((str, sIdx) => {
              // String line thickness
              const stringThickness = `${2.4 - sIdx * 0.3}px`;

              return (
                <div
                  key={`string-row-${str.index}`}
                  className="grid grid-cols-[38px_42px_repeat(14,1fr)] items-center h-8 relative border-b border-[#1c2130] last:border-b-0"
                >
                  {/* Metal String Line drawn across the row */}
                  <div
                    className="absolute left-[80px] right-0 bg-slate-500/60 pointer-events-none z-0"
                    style={{ height: stringThickness, top: 'calc(50% - 1px)' }}
                  />

                  {/* String Tuning Header */}
                  <div className="flex items-center justify-center font-mono text-xs text-slate-400 border-r border-[#202534] bg-[#0f1118] z-10">
                    <span className="font-normal">{str.name}</span>
                    <span className="text-[9px] text-slate-400 ml-0.5 font-light">
                      ({str.index}ª)
                    </span>
                  </div>

                  {/* Nut / Open string (fret 0) */}
                  {(() => {
                    const midi = str.openMidi;
                    const semitone = midi % 12;
                    const isScaleNote = scaleSemitones.includes(semitone);
                    const isRoot = semitone === rootSemitone;
                    const isChordTone = chordSemitones.includes(semitone);
                    const isCurrentlyPlaying = activeMelodyMidi === midi;
                    const noteName = SEMITONE_TO_SHARP_NAME[semitone];
                    const degree = getDegreeLabel(semitone, rootSemitone);
                    const labelText = labelMode === 'note' ? noteName : degree;

                    return (
                      <div
                        className="flex items-center justify-center border-r-2 border-slate-400/80 bg-[#0d0f15] z-10 px-0.5"
                        onClick={() => handleNoteClick(midi)}
                      >
                        {isScaleNote ? (
                          <button
                            type="button"
                            title={`${noteName} (${degree}) - Corda ${str.name} Solta`}
                            className={`w-6 h-6 rounded-none flex items-center justify-center text-[10px] transition-all cursor-pointer ${
                              isCurrentlyPlaying
                                ? 'bg-amber-400 text-slate-950 font-medium scale-110 shadow-sm ring-1 ring-amber-300'
                                : isRoot
                                ? 'bg-amber-400/90 text-slate-950 font-medium border border-amber-500/70'
                                : isChordTone
                                ? 'bg-indigo-600/80 text-white font-medium border border-indigo-500/60 hover:bg-indigo-500/90'
                                : 'bg-[#1a1f2b] text-slate-300 border border-[#283042] hover:bg-[#252c3d]'
                            }`}
                          >
                            {labelText}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-light">✕</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Frets 1 to 14 */}
                  {Array.from({ length: NUM_FRETS - 1 }).map((_, fIdx) => {
                    const fret = fIdx + 1;
                    const midi = str.openMidi + fret;
                    const semitone = midi % 12;
                    const isScaleNote = scaleSemitones.includes(semitone);
                    const isRoot = semitone === rootSemitone;
                    const isChordTone = chordSemitones.includes(semitone);
                    const isCurrentlyPlaying = activeMelodyMidi === midi;
                    const noteName = SEMITONE_TO_SHARP_NAME[semitone];
                    const degree = getDegreeLabel(semitone, rootSemitone);
                    const labelText = labelMode === 'note' ? noteName : degree;

                    return (
                      <div
                        key={`fret-${str.index}-${fret}`}
                        className="flex items-center justify-center border-r border-[#242b3b] relative z-10 h-full"
                      >
                        {isScaleNote ? (
                          <button
                            type="button"
                            onClick={() => handleNoteClick(midi)}
                            title={`${noteName} (${degree}) - Casa ${fret} na corda ${str.name}`}
                            className={`w-5 h-5 rounded-none flex items-center justify-center text-[9px] transition-all cursor-pointer active:scale-95 ${
                              isCurrentlyPlaying
                                ? 'bg-amber-400 text-slate-950 font-medium scale-125 shadow-sm ring-2 ring-amber-300 z-20'
                                : isRoot
                                ? 'bg-amber-400/90 text-slate-950 font-medium border border-amber-500/70 hover:scale-105'
                                : isChordTone
                                ? 'bg-indigo-600/80 text-white font-medium border border-indigo-500/60 hover:bg-indigo-500/90 hover:scale-105'
                                : 'bg-[#181d28] text-slate-300 border border-[#262e40] hover:bg-[#22293a]'
                            }`}
                          >
                            {labelText}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Fret Markers Inlay Row (Position Dots) */}
          <div className="grid grid-cols-[38px_42px_repeat(14,1fr)] mt-1.5 text-center items-center h-3 pointer-events-none">
            <div></div>
            <div></div>
            {Array.from({ length: NUM_FRETS - 1 }).map((_, fIdx) => {
              const fret = fIdx + 1;
              return (
                <div key={`marker-${fret}`} className="flex items-center justify-center">
                  {isSingleDotFret(fret) && (
                    <div className="w-1.5 h-1.5 bg-slate-500/50 rounded-none"></div>
                  )}
                  {isDoubleDotFret(fret) && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-amber-400/70 rounded-none"></div>
                      <div className="w-1.5 h-1.5 bg-amber-400/70 rounded-none"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 font-light pt-1">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-amber-400/90 border border-amber-500/70"></span>
            <span>Tônica ({rootNote})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-indigo-600/80 border border-indigo-500/60"></span>
            <span>Notas do Acorde ({activeChord?.symbol || 'Harmonia'})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-[#181d28] border border-[#262e40]"></span>
            <span>Notas da Escala para Melodia</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-amber-400 ring-1 ring-amber-300"></span>
            <span>Tocando na Melodia</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-light">
          💡 Clique em qualquer nota no braço para testar sua melodia
        </span>
      </div>
    </div>
  );
};

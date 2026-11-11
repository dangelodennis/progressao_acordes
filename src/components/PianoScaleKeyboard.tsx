import React, { useState } from 'react';
import { ChordDefinition, InstrumentType } from '../types';
import {
  getSemitone,
  getDegreeLabel,
  SEMITONE_TO_SHARP_NAME,
} from '../utils/melodyGenerator';

interface PianoScaleKeyboardProps {
  rootNote: string;
  scaleSemitones: number[];
  activeChord?: ChordDefinition;
  activeMelodyMidi?: number | null;
  onPlayNote?: (noteStr: string, instrument: InstrumentType) => void;
  instrument?: InstrumentType;
}

interface PianoKeyInfo {
  midi: number;
  note: string; // e.g. "C4"
  noteName: string; // "C"
  octave: number;
  isBlack: boolean;
  whiteIndex: number;
}

export const PianoScaleKeyboard: React.FC<PianoScaleKeyboardProps> = ({
  rootNote,
  scaleSemitones,
  activeChord,
  activeMelodyMidi,
  onPlayNote,
  instrument = 'piano',
}) => {
  const [labelMode, setLabelMode] = useState<'note' | 'degree'>('note');

  const rootSemitone = getSemitone(rootNote);

  // Extract chord semitones
  const chordSemitones = activeChord
    ? activeChord.noteNames.map((n) => getSemitone(n))
    : [];

  // 3 Octaves: C3 to B5 (MIDI 48 to 83) + high C6 (MIDI 84) = 37 keys
  const START_MIDI = 48; // C3
  const END_MIDI = 84; // C6

  const keys: PianoKeyInfo[] = [];
  let whiteCount = 0;

  for (let m = START_MIDI; m <= END_MIDI; m++) {
    const semitone = m % 12;
    const octave = Math.floor(m / 12) - 1;
    const isBlack = [1, 3, 6, 8, 10].includes(semitone);
    const noteName = SEMITONE_TO_SHARP_NAME[semitone];
    const note = `${noteName}${octave}`;

    const whiteIdx = isBlack ? whiteCount - 1 : whiteCount;
    if (!isBlack) {
      whiteCount++;
    }

    keys.push({
      midi: m,
      note,
      noteName,
      octave,
      isBlack,
      whiteIndex: whiteIdx,
    });
  }

  const whiteKeyWidth = 26;
  const whiteKeyHeight = 110;
  const blackKeyWidth = 16;
  const blackKeyHeight = 68;
  const totalWidth = whiteCount * whiteKeyWidth;

  const handleKeyClick = (key: PianoKeyInfo) => {
    if (onPlayNote) {
      onPlayNote(key.note, instrument);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-light">
            Teclado / Piano (Faixa C3 a C6 • 3 Oitavas)
          </span>
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-[#141722] border border-[#202534] rounded-none">
            37 Teclas com Escala Destacada
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

      {/* Piano Scrollable Stage */}
      <div className="overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#232836] scrollbar-track-transparent">
        <div
          className="bg-[#0b0d12] p-3 rounded-none border border-[#202534] select-none flex justify-center mx-auto"
          style={{ minWidth: `${totalWidth + 30}px` }}
        >
          <div
            className="relative"
            style={{ width: `${totalWidth}px`, height: `${whiteKeyHeight}px` }}
          >
            {/* White Keys First */}
            {keys
              .filter((k) => !k.isBlack)
              .map((k) => {
                const semitone = k.midi % 12;
                const isScaleNote = scaleSemitones.includes(semitone);
                const isRoot = semitone === rootSemitone;
                const isChordTone = chordSemitones.includes(semitone);
                const isCurrentlyPlaying = activeMelodyMidi === k.midi;
                const degree = getDegreeLabel(semitone, rootSemitone);
                const labelText = labelMode === 'note' ? k.noteName : degree;

                return (
                  <button
                    key={`piano-white-${k.midi}`}
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    style={{
                      width: `${whiteKeyWidth}px`,
                      height: `${whiteKeyHeight}px`,
                      left: `${k.whiteIndex * whiteKeyWidth}px`,
                    }}
                    title={`${k.note} (${degree})`}
                    className={`absolute top-0 rounded-none border border-[#2a3040] transition-all flex flex-col justify-end items-center pb-2 z-10 cursor-pointer ${
                      isCurrentlyPlaying
                        ? 'bg-amber-400 text-slate-950 font-medium scale-105 shadow-md z-30 ring-1 ring-amber-300'
                        : isScaleNote
                        ? isRoot
                          ? 'bg-amber-400/90 text-slate-950 font-medium border-amber-500/70 hover:bg-amber-300'
                          : isChordTone
                          ? 'bg-indigo-600/80 text-white font-medium border-indigo-500/60 hover:bg-indigo-500/90'
                          : 'bg-[#cbd5e1] hover:bg-[#e2e8f0] text-slate-700'
                        : 'bg-[#64748b]/40 text-slate-500 hover:bg-[#64748b]/60'
                    }`}
                  >
                    {isScaleNote ? (
                      <span className="text-[10px] leading-tight">
                        {labelText}
                      </span>
                    ) : (
                      k.noteName === 'C' && (
                        <span className="text-[8px] text-slate-500 font-light">
                          {k.note}
                        </span>
                      )
                    )}
                  </button>
                );
              })}

            {/* Black Keys Overlaid */}
            {keys
              .filter((k) => k.isBlack)
              .map((k) => {
                const semitone = k.midi % 12;
                const isScaleNote = scaleSemitones.includes(semitone);
                const isRoot = semitone === rootSemitone;
                const isChordTone = chordSemitones.includes(semitone);
                const isCurrentlyPlaying = activeMelodyMidi === k.midi;
                const degree = getDegreeLabel(semitone, rootSemitone);
                const labelText = labelMode === 'note' ? k.noteName : degree;

                // Position offset between white keys
                const leftPos = (k.whiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;

                return (
                  <button
                    key={`piano-black-${k.midi}`}
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    style={{
                      width: `${blackKeyWidth}px`,
                      height: `${blackKeyHeight}px`,
                      left: `${leftPos}px`,
                    }}
                    title={`${k.note} (${degree})`}
                    className={`absolute top-0 rounded-none transition-all flex flex-col justify-end items-center pb-1.5 z-20 cursor-pointer border border-[#161922] ${
                      isCurrentlyPlaying
                        ? 'bg-amber-400 text-slate-950 font-medium scale-105 shadow-md z-30 ring-1 ring-amber-300'
                        : isScaleNote
                        ? isRoot
                          ? 'bg-amber-400/90 text-slate-950 font-medium border-amber-300/70 hover:bg-amber-300'
                          : isChordTone
                          ? 'bg-indigo-500/85 text-white font-medium border-indigo-400/70 hover:bg-indigo-400'
                          : 'bg-[#252c3c] text-slate-300 hover:bg-[#30384c] border border-[#3b455c]'
                        : 'bg-[#12141a] text-slate-400 hover:bg-[#181c24]'
                    }`}
                  >
                    {isScaleNote && (
                      <span className="text-[8px] leading-none">
                        {labelText}
                      </span>
                    )}
                  </button>
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
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-[#cbd5e1] border border-[#2a3040]"></span>
            <span>Notas da Escala</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-amber-400 ring-1 ring-amber-300"></span>
            <span>Tocando na Melodia</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-light">
          💡 Clique em qualquer tecla para ouvir e compor
        </span>
      </div>
    </div>
  );
};

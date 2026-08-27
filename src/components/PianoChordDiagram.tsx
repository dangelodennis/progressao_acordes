import React from 'react';
import { ChordDefinition } from '../types';
import { audioEngine } from '../utils/audioPlayer';

interface PianoChordDiagramProps {
  chord: ChordDefinition;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  octaveOffset?: number;
}

interface KeyInfo {
  note: string; // e.g. "C4", "C#4"
  noteName: string; // e.g. "C", "C#"
  isBlack: boolean;
  whiteIndex: number; // index among white keys only
  octave: number;
}

export const PianoChordDiagram: React.FC<PianoChordDiagramProps> = ({
  chord,
  className = '',
  size = 'md',
  octaveOffset = 0,
}) => {
  // Octaves covered: 2 octaves starting from base 4 + octaveOffset
  const baseStartOctave = Math.max(1, Math.min(6, 4 + octaveOffset));
  const octaves = [baseStartOctave, baseStartOctave + 1];
  const notesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const keys: KeyInfo[] = [];
  let whiteCount = 0;

  octaves.forEach((oct) => {
    notesOrder.forEach((name) => {
      const isBlack = name.includes('#');
      keys.push({
        note: `${name}${oct}`,
        noteName: name,
        isBlack,
        whiteIndex: isBlack ? whiteCount - 1 : whiteCount++,
        octave: oct,
      });
    });
  });

  const rootNoteName = chord.root;

  const handleKeyClick = (noteStr: string) => {
    try {
      audioEngine.playChord(
        {
          ...chord,
          notes: [noteStr],
        },
        'piano',
        0.8,
        0 // already encoded in noteStr
      );
    } catch {
      // fallback
    }
  };

  const dimensions = {
    sm: { whiteWidth: 20, whiteHeight: 92, blackWidth: 12, blackHeight: 56, fontSize: '9px' },
    md: { whiteWidth: 26, whiteHeight: 120, blackWidth: 16, blackHeight: 74, fontSize: '11px' },
    lg: { whiteWidth: 32, whiteHeight: 140, blackWidth: 20, blackHeight: 88, fontSize: '12px' },
  }[size];

  const totalWhiteKeys = whiteCount;
  const keyboardWidth = totalWhiteKeys * dimensions.whiteWidth;

  return (
    <div id={`piano-diagram-${chord.id}`} className={`flex flex-col items-center select-none ${className}`}>
      {/* Keyboard wrapper */}
      <div
        className="relative bg-[#12141a] p-2.5 rounded-none border border-[#2d3342] shadow-xl overflow-x-auto max-w-full"
        style={{ minWidth: `${keyboardWidth + 20}px` }}
      >
        <div className="relative flex" style={{ width: `${keyboardWidth}px`, height: `${dimensions.whiteHeight}px` }}>
          {/* White keys (base background) */}
          {keys
            .filter((k) => !k.isBlack)
            .map((k) => {
              const isChordNote = chord.noteNames.includes(k.noteName);
              const isRoot = k.noteName === rootNoteName;

              return (
                <button
                  key={k.note}
                  type="button"
                  onClick={() => handleKeyClick(k.note)}
                  style={{
                    width: `${dimensions.whiteWidth}px`,
                    height: `${dimensions.whiteHeight}px`,
                    left: `${k.whiteIndex * dimensions.whiteWidth}px`,
                  }}
                  className={`absolute top-0 rounded-none border border-[#384050] transition-all duration-100 flex flex-col justify-end items-center pb-2 z-10 ${
                    isChordNote
                      ? isRoot
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-500 shadow-inner'
                        : 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-inner'
                      : 'bg-[#f1f5f9] hover:bg-white text-slate-700 active:bg-slate-300'
                  }`}
                  title={`${k.note} ${isRoot ? '(Tônica/Root)' : ''}`}
                >
                  {isChordNote && (
                    <span
                      style={{ fontSize: dimensions.fontSize }}
                      className={`font-black ${isRoot ? 'text-slate-950' : 'text-white'}`}
                    >
                      {k.noteName}
                    </span>
                  )}
                  {!isChordNote && (
                    <span className="text-[9px] font-semibold text-slate-400 pointer-events-none">
                      {k.noteName === 'C' ? k.note : ''}
                    </span>
                  )}
                </button>
              );
            })}

          {/* Black keys (overlay on top) */}
          {keys
            .filter((k) => k.isBlack)
            .map((k) => {
              const isChordNote = chord.noteNames.includes(k.noteName);
              const isRoot = k.noteName === rootNoteName;
              const leftPos = (k.whiteIndex + 1) * dimensions.whiteWidth - dimensions.blackWidth / 2;

              return (
                <button
                  key={k.note}
                  type="button"
                  onClick={() => handleKeyClick(k.note)}
                  style={{
                    width: `${dimensions.blackWidth}px`,
                    height: `${dimensions.blackHeight}px`,
                    left: `${leftPos}px`,
                  }}
                  className={`absolute top-0 rounded-none transition-all duration-100 flex flex-col justify-end items-center pb-1.5 z-20 border border-[#1e222b] ${
                    isChordNote
                      ? isRoot
                        ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md'
                        : 'bg-indigo-500 text-white font-black border-indigo-300 shadow-md'
                      : 'bg-[#181b22] hover:bg-[#282d38] text-white'
                  }`}
                  title={`${k.note} ${isRoot ? '(Tônica/Root)' : ''}`}
                >
                  {isChordNote && (
                    <span
                      style={{ fontSize: dimensions.fontSize }}
                      className={`font-black text-[9px] ${isRoot ? 'text-slate-950' : 'text-white'}`}
                    >
                      {k.noteName}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Legend & Octave range indicator */}
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-none bg-amber-400 border border-amber-500"></span>
          <span>Tônica ({rootNoteName})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-none bg-indigo-600 border border-indigo-400"></span>
          <span>Notas do Acorde ({chord.noteNames.join(' - ')})</span>
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-none bg-[#242834] border border-[#333a4a] text-indigo-300 font-semibold">
          Faixa: {baseStartOctave}ª e {baseStartOctave + 1}ª Oitava
        </span>
      </div>
    </div>
  );
};

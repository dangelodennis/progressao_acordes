import React from 'react';
import { ChordDefinition } from '../types';

interface GuitarChordDiagramProps {
  chord: ChordDefinition;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GuitarChordDiagram: React.FC<GuitarChordDiagramProps> = ({
  chord,
  className = '',
  size = 'md',
}) => {
  const { guitar } = chord;
  const { frets, fingers, baseFret = 1, barre } = guitar;

  // Geometry dimensions
  const dimensions = {
    sm: { width: 130, height: 160, marginX: 20, marginY: 34, fretSpacing: 22, stringSpacing: 18, dotSize: 14 },
    md: { width: 170, height: 210, marginX: 25, marginY: 42, fretSpacing: 28, stringSpacing: 24, dotSize: 18 },
    lg: { width: 220, height: 260, marginX: 32, marginY: 50, fretSpacing: 36, stringSpacing: 31, dotSize: 22 },
  }[size];

  const numStrings = 6;
  const numFrets = 4;
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];

  const getX = (stringIdx: number) => dimensions.marginX + stringIdx * dimensions.stringSpacing;
  const getY = (fretNum: number) => dimensions.marginY + fretNum * dimensions.fretSpacing;

  return (
    <div id={`guitar-diagram-${chord.id}`} className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="overflow-visible"
      >
        {/* Base fret label if > 1 */}
        {baseFret > 1 && (
          <text
            x={dimensions.marginX - 14}
            y={dimensions.marginY + dimensions.fretSpacing * 0.75}
            textAnchor="middle"
            className="text-[12px] font-extrabold fill-amber-400"
          >
            {baseFret}ª
          </text>
        )}

        {/* Nut (fret 0 top thick line) or simple top wire if baseFret > 1 */}
        {baseFret === 1 ? (
          <rect
            x={dimensions.marginX}
            y={dimensions.marginY}
            width={(numStrings - 1) * dimensions.stringSpacing}
            height={5}
            className="fill-slate-200"
          />
        ) : (
          <line
            x1={dimensions.marginX}
            y1={dimensions.marginY}
            x2={dimensions.marginX + (numStrings - 1) * dimensions.stringSpacing}
            y2={dimensions.marginY}
            strokeWidth={1.5}
            className="stroke-slate-500"
          />
        )}

        {/* Fret horizontal lines */}
        {Array.from({ length: numFrets + 1 }).map((_, fIdx) => (
          <line
            key={`fret-${fIdx}`}
            x1={dimensions.marginX}
            y1={getY(fIdx)}
            x2={dimensions.marginX + (numStrings - 1) * dimensions.stringSpacing}
            y2={getY(fIdx)}
            strokeWidth={1.2}
            className="stroke-[#3a4253]"
          />
        ))}

        {/* Strings vertical lines (6th to 1st) */}
        {Array.from({ length: numStrings }).map((_, sIdx) => {
          const strokeWidth = 2.4 - sIdx * 0.28;
          return (
            <line
              key={`string-${sIdx}`}
              x1={getX(sIdx)}
              y1={dimensions.marginY}
              x2={getX(sIdx)}
              y2={getY(numFrets)}
              strokeWidth={strokeWidth}
              className="stroke-slate-400"
            />
          );
        })}

        {/* Barre chord block (square) if present */}
        {barre && (
          <g>
            <rect
              x={getX(6 - barre.fromString)}
              y={getY(barre.fret - baseFret) + dimensions.fretSpacing * 0.25}
              width={(barre.fromString - barre.toString) * dimensions.stringSpacing}
              height={dimensions.fretSpacing * 0.5}
              className="fill-indigo-600 border border-indigo-400"
            />
          </g>
        )}

        {/* String Top Status (Muted 'X' or Open 'O') and String Names below */}
        {frets.map((fretVal, sIdx) => {
          const x = getX(sIdx);
          const isMuted = fretVal === -1;
          const isOpen = fretVal === 0;

          return (
            <g key={`top-status-${sIdx}`}>
              {isMuted && (
                <text
                  x={x}
                  y={dimensions.marginY - 10}
                  textAnchor="middle"
                  className="text-[13px] font-black fill-rose-500"
                >
                  ✕
                </text>
              )}
              {isOpen && (
                <rect
                  x={x - 4}
                  y={dimensions.marginY - 16}
                  width={8}
                  height={8}
                  className="fill-none stroke-emerald-400"
                  strokeWidth={2}
                />
              )}
              {/* String Note Name at bottom */}
              <text
                x={x}
                y={getY(numFrets) + 16}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-400"
              >
                {stringNames[sIdx]}
              </text>
            </g>
          );
        })}

        {/* Finger square markers on frets */}
        {frets.map((fretVal, sIdx) => {
          if (fretVal <= 0) return null; // Skip open or muted
          const relativeFret = fretVal - baseFret + 1;
          if (relativeFret < 1 || relativeFret > numFrets) return null;

          const cx = getX(sIdx);
          const cy = getY(relativeFret - 1) + dimensions.fretSpacing * 0.5;
          const fingerNum = fingers ? fingers[sIdx] : null;
          const halfSize = dimensions.dotSize / 2;

          return (
            <g key={`dot-${sIdx}-${fretVal}`}>
              <rect
                x={cx - halfSize}
                y={cy - halfSize}
                width={dimensions.dotSize}
                height={dimensions.dotSize}
                className="fill-indigo-600 stroke stroke-indigo-400/80 shadow-md"
              />
              {fingerNum !== null && fingerNum !== undefined && fingerNum > 0 && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  className="text-[11px] font-black fill-white pointer-events-none select-none"
                >
                  {fingerNum}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-none bg-emerald-500/20 border border-emerald-500"></span>
          <span>Solta</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block text-[11px] font-black text-rose-500">✕</span>
          <span>Muda</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-none bg-indigo-600 text-white text-[8px] flex items-center justify-center font-bold">1</span>
          <span>Dedo</span>
        </span>
      </div>
    </div>
  );
};

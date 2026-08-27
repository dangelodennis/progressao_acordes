import React, { useState } from 'react';
import { ChordDefinition, DisplayMode, InstrumentType } from '../types';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import { audioEngine } from '../utils/audioPlayer';
import { Volume2, Sparkles, Play, Plus, BookOpen, Layers, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface ChordInspectorProps {
  chord: ChordDefinition;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  instrument: InstrumentType;
  onAddToTimeline?: (chord: ChordDefinition, octaveOffset?: number) => void;
  isInTimeline?: boolean;
  octaveOffset: number;
  onOctaveChange: (offset: number) => void;
}

export const ChordInspector: React.FC<ChordInspectorProps> = ({
  chord,
  displayMode,
  onDisplayModeChange,
  instrument,
  onAddToTimeline,
  isInTimeline = false,
  octaveOffset,
  onOctaveChange,
}) => {
  const [isPlayingScale, setIsPlayingScale] = useState(false);

  const handlePlayChord = () => {
    audioEngine.playChord(chord, instrument, 1.8, octaveOffset);
  };

  const handlePlayScale = () => {
    if (isPlayingScale) return;
    setIsPlayingScale(true);
    audioEngine.playScale(chord.scale.notes, instrument, 0.3, octaveOffset);
    setTimeout(() => {
      setIsPlayingScale(false);
    }, chord.scale.notes.length * 300 + 400);
  };

  const handleDecreaseOctave = () => {
    if (octaveOffset > -2) {
      const next = octaveOffset - 1;
      onOctaveChange(next);
      audioEngine.playChord(chord, instrument, 1.2, next);
    }
  };

  const handleIncreaseOctave = () => {
    if (octaveOffset < 2) {
      const next = octaveOffset + 1;
      onOctaveChange(next);
      audioEngine.playChord(chord, instrument, 1.2, next);
    }
  };

  const handleSetOctave = (oct: number) => {
    onOctaveChange(oct);
    audioEngine.playChord(chord, instrument, 1.2, oct);
  };

  const getOctaveLabel = (offset: number) => {
    if (offset === -2) return 'Muito Grave (-2 Oitavas / 2ª Oitava)';
    if (offset === -1) return 'Grave (-1 Oitava / 3ª Oitava)';
    if (offset === 0) return 'Padrão (4ª Oitava Central)';
    if (offset === 1) return 'Aguda (+1 Oitava / 5ª Oitava)';
    if (offset === 2) return 'Muito Aguda (+2 Oitavas / 6ª Oitava)';
    return `${offset > 0 ? `+${offset}` : offset} Oitavas`;
  };

  // Compute displayed note names with octave (e.g. C4, E4, G4 or C3, E3, G3)
  const displayedNoteNamesWithOctave = chord.notes && chord.notes.length > 0
    ? chord.notes.map((n) => {
        const match = n.match(/^([A-G][b#]?)(-?\d+)$/);
        if (match) {
          const noteName = match[1];
          const oct = parseInt(match[2], 10) + octaveOffset;
          return `${noteName}${oct}`;
        }
        return n;
      })
    : chord.noteNames.map((n) => `${n}${4 + octaveOffset}`);

  return (
    <div
      id="chord-inspector-card"
      className="bg-[#1a1d26] border border-[#2d3342] rounded-none p-4 md:p-5 shadow-lg space-y-4"
    >
      {/* Top Header: Chord Name, Root & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2d3342]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-none bg-indigo-600 border border-indigo-400 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {chord.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                {chord.name}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-none bg-[#242834] text-indigo-300 border border-indigo-500/40 uppercase">
                {chord.quality}
              </span>
              {octaveOffset !== 0 && (
                <span className={`px-2 py-0.5 text-[11px] font-black rounded-none border ${
                  octaveOffset > 0
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}>
                  {octaveOffset > 0 ? `+${octaveOffset} Oitava` : `${octaveOffset} Oitava`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Notas do Acorde: <span className="text-slate-100 font-bold tracking-wide">{displayedNoteNamesWithOctave.join(' • ')}</span>
            </p>
          </div>
        </div>

        {/* Action buttons: Play & Add */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-chord-inspector"
            type="button"
            onClick={handlePlayChord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-100 font-bold text-xs border border-[#384050] transition-colors active:translate-y-0.5"
            title="Ouvir Acorde na Oitava Selecionada"
          >
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Ouvir</span>
          </button>

          {onAddToTimeline && (
            <button
              id="btn-add-timeline-inspector"
              type="button"
              onClick={() => onAddToTimeline(chord, octaveOffset)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs border border-indigo-400 shadow-md shadow-indigo-600/30 transition-all active:translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isInTimeline ? 'Adicionar de Novo' : '+ Na Timeline'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Octave Controls Bar (Requirement: Reduzir ou aumentar a oitava do acorde) */}
      <div
        id="octave-control-panel"
        className="p-3 bg-[#202430] border border-[#2d3342] rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-indigo-500"></span>
            <span>Controle de Oitava:</span>
          </span>
          <span className="text-xs font-semibold text-indigo-300">
            {getOctaveLabel(octaveOffset)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Decrement */}
          <button
            id="btn-octave-down"
            type="button"
            onClick={handleDecreaseOctave}
            disabled={octaveOffset <= -2}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-[#282d3c] hover:bg-[#31374a] disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold border border-[#384050] transition-colors active:translate-y-0.5"
            title="Reduzir Oitava (-1)"
          >
            <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
            <span>-1 Oitava</span>
          </button>

          {/* Direct Octave Selector Pill Buttons */}
          {[-2, -1, 0, 1, 2].map((val) => {
            const isCurrent = octaveOffset === val;
            return (
              <button
                key={`oct-btn-${val}`}
                id={`btn-octave-select-${val}`}
                type="button"
                onClick={() => handleSetOctave(val)}
                className={`px-2.5 py-1.5 rounded-none text-xs font-black border transition-all active:translate-y-0.5 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-[#242834] text-slate-300 hover:bg-[#2c3242] border-[#384050]'
                }`}
                title={`Definir oitava ${val > 0 ? `+${val}` : val}`}
              >
                {val === 0 ? 'Padrão (0)' : val > 0 ? `+${val}` : val}
              </button>
            );
          })}

          {/* Quick Increment */}
          <button
            id="btn-octave-up"
            type="button"
            onClick={handleIncreaseOctave}
            disabled={octaveOffset >= 2}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-[#282d3c] hover:bg-[#31374a] disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold border border-[#384050] transition-colors active:translate-y-0.5"
            title="Aumentar Oitava (+1)"
          >
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>+1 Oitava</span>
          </button>

          {/* Reset if not 0 */}
          {octaveOffset !== 0 && (
            <button
              id="btn-octave-reset"
              type="button"
              onClick={() => handleSetOctave(0)}
              className="p-1.5 rounded-none bg-[#282d3c] hover:bg-[#31374a] text-slate-400 hover:text-slate-200 border border-[#384050]"
              title="Resetar para Oitava Padrão (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visualizer Mode Switcher Tabs (Violão / Teclado) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Diagrama do Instrumento</span>
        </div>

        <div className="inline-flex p-0.5 rounded-none bg-[#202430] border border-[#313747]">
          <button
            id="tab-view-guitar"
            type="button"
            onClick={() => onDisplayModeChange('guitar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all ${
              displayMode === 'guitar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎸 Violão
          </button>
          <button
            id="tab-view-piano"
            type="button"
            onClick={() => onDisplayModeChange('piano')}
            className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all ${
              displayMode === 'piano'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎹 Teclado
          </button>
          <button
            id="tab-view-both"
            type="button"
            onClick={() => onDisplayModeChange('both')}
            className={`hidden sm:inline-block px-3 py-1.5 text-xs font-bold rounded-none transition-all ${
              displayMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ambos
          </button>
        </div>
      </div>

      {/* Visualizer Diagrams Area */}
      <div className="py-2 flex flex-col md:flex-row items-center justify-center gap-6 overflow-x-auto">
        {(displayMode === 'guitar' || displayMode === 'both') && (
          <div className="flex flex-col items-center p-3 rounded-none bg-[#15171e] border border-[#2d3342] shadow-inner">
            <span className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <span>Braço do Violão / Guitarra</span>
            </span>
            <GuitarChordDiagram chord={chord} size="md" />
          </div>
        )}

        {(displayMode === 'piano' || displayMode === 'both') && (
          <div className="flex flex-col items-center p-3 rounded-none bg-[#15171e] border border-[#2d3342] shadow-inner">
            <span className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <span>Teclado / Piano (2 Oitavas)</span>
            </span>
            <PianoChordDiagram chord={chord} size="md" octaveOffset={octaveOffset} />
          </div>
        )}
      </div>

      {/* Escala Correspondente Section */}
      <div
        id={`scale-section-${chord.id}`}
        className="p-4 rounded-none bg-[#181c26] border border-indigo-500/30 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white">
              Escala Correspondente & Improviso
            </h3>
          </div>

          <button
            id="btn-play-scale-audio"
            type="button"
            onClick={handlePlayScale}
            disabled={isPlayingScale}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none font-bold text-xs transition-all active:translate-y-0.5 ${
              isPlayingScale
                ? 'bg-amber-500 text-black animate-pulse'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isPlayingScale ? 'fill-black' : 'fill-amber-400'}`} />
            <span>{isPlayingScale ? 'Reproduzindo...' : 'Ouvir Escala'}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-2.5 py-1 rounded-none">
              {chord.scale.name}
            </span>
            <span className="text-xs text-slate-400">
              Modo: <strong className="text-slate-200">{chord.scale.mode}</strong>
            </span>
          </div>

          {/* Scale Notes Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">
              Notas da escala:
            </span>
            {chord.scale.notes.map((n, idx) => (
              <span
                key={`${chord.id}-scalenote-${idx}`}
                className="px-2 py-0.5 text-xs font-black rounded-none bg-[#242834] text-slate-100 border border-[#384050]"
              >
                {n}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {chord.scale.description}
          </p>

          <div className="flex items-start gap-2 pt-2 border-t border-[#2d3342] text-xs text-slate-400">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Dica de solo: </span>
              {chord.scale.soloingTips}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

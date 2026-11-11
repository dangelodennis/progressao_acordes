import React, { useState, useMemo } from 'react';
import { ChordDefinition, DisplayMode, InstrumentType, TimelineChordItem } from '../types';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import { PianoChordDiagram } from './PianoChordDiagram';
import { audioEngine } from '../utils/audioPlayer';
import { getChordInversions, ChordInversionOption } from '../utils/chordInversions';
import {
  Volume2,
  Sparkles,
  Play,
  Plus,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  GitCompare,
  ArrowLeftRight,
} from 'lucide-react';

interface ChordInspectorProps {
  chord: ChordDefinition;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  instrument: InstrumentType;
  onAddToTimeline?: (chord: ChordDefinition, octaveOffset?: number) => void;
  onReplaceSelectedInTimeline?: (chord: ChordDefinition) => void;
  selectedTimelineChord?: TimelineChordItem | null;
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
  onReplaceSelectedInTimeline,
  selectedTimelineChord,
  isInTimeline = false,
  octaveOffset,
  onOctaveChange,
}) => {
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [isExpandChordOpen, setIsExpandChordOpen] = useState(true);

  // Compute inversions for the active chord
  const inversions = useMemo(() => {
    return getChordInversions(chord);
  }, [chord]);

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
      className="bg-[#141720] border border-[#232836] rounded-none p-3.5 md:p-4 shadow-xs space-y-3.5"
    >
      {/* Top Header: Chord Name, Root & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#212634]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-none bg-[#1a1e2a] border border-[#2d3448] text-indigo-300 flex items-center justify-center font-medium text-xl shadow-xs">
            {chord.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-slate-200 tracking-tight">
                {chord.name}
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-normal rounded-none bg-[#181c26] text-indigo-300 border border-[#282f42] uppercase">
                {chord.quality}
              </span>
              {octaveOffset !== 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-normal rounded-none border ${
                  octaveOffset > 0
                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                }`}>
                  {octaveOffset > 0 ? `+${octaveOffset} Oitava` : `${octaveOffset} Oitava`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Notas do Acorde: <span className="text-slate-300 font-normal tracking-wide">{displayedNoteNamesWithOctave.join(' • ')}</span>
            </p>
          </div>
        </div>

        {/* Action buttons: Play & Add */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-chord-inspector"
            type="button"
            onClick={handlePlayChord}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#1a1e28] hover:bg-[#222836] text-slate-300 font-normal text-xs border border-[#292f40] transition-colors active:translate-y-0.5"
            title="Ouvir Acorde na Oitava Selecionada"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Ouvir</span>
          </button>

          {onAddToTimeline && (
            <button
              id="btn-add-timeline-inspector"
              type="button"
              onClick={() => onAddToTimeline(chord, octaveOffset)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-indigo-600/85 hover:bg-indigo-500/85 text-indigo-100 font-medium text-xs border border-indigo-500/50 shadow-xs transition-all active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isInTimeline ? 'Adicionar de Novo' : '+ Na Timeline'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Octave Controls Bar (Requirement: Reduzir ou aumentar a oitava do acorde) */}
      <div
        id="octave-control-panel"
        className="p-2.5 bg-[#171b24] border border-[#232836] rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-none bg-indigo-400/80"></span>
            <span>Oitava:</span>
          </span>
          <span className="text-xs font-light text-slate-300">
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#1e2330] hover:bg-[#262c3d] disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs font-light border border-[#2b3245] transition-colors active:translate-y-0.5"
            title="Reduzir Oitava (-1)"
          >
            <ArrowDown className="w-3 h-3 text-amber-400/80" />
            <span>-1 8va</span>
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
                className={`px-2 py-1 rounded-none text-xs font-normal border transition-all active:translate-y-0.5 ${
                  isCurrent
                    ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                    : 'bg-[#181c26] text-slate-400 hover:bg-[#202534] border-[#252a38]'
                }`}
                title={`Definir oitava ${val > 0 ? `+${val}` : val}`}
              >
                {val === 0 ? '0' : val > 0 ? `+${val}` : val}
              </button>
            );
          })}

          {/* Quick Increment */}
          <button
            id="btn-octave-up"
            type="button"
            onClick={handleIncreaseOctave}
            disabled={octaveOffset >= 2}
            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#1e2330] hover:bg-[#262c3d] disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs font-light border border-[#2b3245] transition-colors active:translate-y-0.5"
            title="Aumentar Oitava (+1)"
          >
            <ArrowUp className="w-3 h-3 text-emerald-400/80" />
            <span>+1 8va</span>
          </button>

          {/* Reset if not 0 */}
          {octaveOffset !== 0 && (
            <button
              id="btn-octave-reset"
              type="button"
              onClick={() => handleSetOctave(0)}
              className="p-1 rounded-none bg-[#1e2330] hover:bg-[#262c3d] text-slate-400 hover:text-slate-200 border border-[#2b3245]"
              title="Resetar para Oitava Padrão (0)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expand Chord: Inversions Section (e.g. C/E, C/G) */}
      <div
        id="chord-inversions-panel"
        className="p-3 bg-[#13161f] border border-[#23293a] rounded-none space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-none bg-indigo-950/50 text-indigo-400 border border-indigo-700/50 flex items-center justify-center">
              <GitCompare className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <span>Expandir Acorde: Inversões (Slash Chords)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                    {inversions.length} variações
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Alterne a nota do baixo ({inversions.map(inv => inv.symbol).join(', ')}) para conduções de baixo mais suaves e ricas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpandChordOpen(!isExpandChordOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 border border-[#262c3e] hover:bg-[#181c28] transition-colors"
            title={isExpandChordOpen ? 'Recolher Inversões' : 'Expandir Inversões'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpandChordOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isExpandChordOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {inversions.map((inv) => {
              const isSelectedActive = chord.symbol === inv.symbol;
              const isTimelineMatch = selectedTimelineChord?.chord.symbol === inv.symbol;

              return (
                <div
                  key={`inversion-${inv.symbol}`}
                  className={`p-2.5 border rounded-none flex flex-col justify-between transition-all ${
                    isSelectedActive
                      ? 'bg-[#1c2232] border-indigo-500/70 shadow-xs'
                      : 'bg-[#151924] hover:bg-[#191f2e] border-[#222838]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{inv.symbol}</span>
                        {inv.inversion === 0 && (
                          <span className="text-[9px] font-normal px-1 py-0.2 bg-[#10121a] text-slate-400 border border-[#232838]">
                            Original
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-normal text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded-none">
                        {inv.inversionLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center gap-1 font-light">
                      <span className="text-slate-400">Baixo:</span>
                      <strong className="text-amber-400 font-medium">{inv.bassNote}</strong>
                      <span className="text-slate-500">({inv.bassDegree})</span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-light leading-relaxed line-clamp-2">
                      {inv.description}
                    </p>
                  </div>

                  {/* Actions for this inversion: Play Preview & Replace or Add */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#202636]">
                    <button
                      type="button"
                      onClick={() => audioEngine.playChord(inv.chord, instrument, 1.4, octaveOffset)}
                      className="p-1 rounded-none bg-[#1a1e28] hover:bg-[#222838] text-slate-300 border border-[#262c3e] text-[10px] transition-colors"
                      title="Ouvir prévia desta inversão"
                    >
                      <Volume2 className="w-3 h-3 text-indigo-400/80" />
                    </button>

                    {/* Replace currently selected chord in timeline */}
                    {onReplaceSelectedInTimeline && selectedTimelineChord && (
                      <button
                        type="button"
                        onClick={() => {
                          onReplaceSelectedInTimeline(inv.chord);
                          audioEngine.playChord(inv.chord, instrument, 1.4, octaveOffset);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-normal rounded-none border transition-all active:translate-y-0.5 ${
                          isTimelineMatch
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50 cursor-default'
                            : 'bg-indigo-600/80 hover:bg-indigo-500/80 text-white border-indigo-500/50 shadow-xs'
                        }`}
                        title={
                          isTimelineMatch
                            ? 'Este acorde já está na linha do tempo'
                            : `Substituir ${selectedTimelineChord.chord.symbol} por ${inv.symbol} na linha do tempo`
                        }
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{isTimelineMatch ? 'Na Linha do Tempo' : 'Substituir na Linha'}</span>
                      </button>
                    )}

                    {/* Add as new chord to timeline */}
                    {onAddToTimeline && (
                      <button
                        type="button"
                        onClick={() => onAddToTimeline(inv.chord, octaveOffset)}
                        className="px-2 py-1 text-[11px] font-normal rounded-none bg-[#1a1e28] hover:bg-[#23293a] text-slate-300 border border-[#282f42] transition-colors"
                        title={`Adicionar ${inv.symbol} como novo acorde ao final`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visualizer Mode Switcher Tabs (Violão / Teclado) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-xs font-normal uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400/80" />
          <span>Diagrama do Instrumento</span>
        </div>

        <div className="inline-flex p-0.5 rounded-none bg-[#171b24] border border-[#232836]">
          <button
            id="tab-view-guitar"
            type="button"
            onClick={() => onDisplayModeChange('guitar')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none transition-all ${
              displayMode === 'guitar'
                ? 'bg-[#222838] text-slate-200 border border-indigo-500/50 shadow-xs'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            🎸 Violão
          </button>
          <button
            id="tab-view-piano"
            type="button"
            onClick={() => onDisplayModeChange('piano')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none transition-all ${
              displayMode === 'piano'
                ? 'bg-[#222838] text-slate-200 border border-indigo-500/50 shadow-xs'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            🎹 Teclado
          </button>
          <button
            id="tab-view-both"
            type="button"
            onClick={() => onDisplayModeChange('both')}
            className={`hidden sm:inline-block px-2.5 py-1 text-xs font-normal rounded-none transition-all ${
              displayMode === 'both'
                ? 'bg-[#222838] text-slate-200 border border-indigo-500/50 shadow-xs'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Ambos
          </button>
        </div>
      </div>

      {/* Visualizer Diagrams Area */}
      <div className="py-2 flex flex-col md:flex-row items-center justify-center gap-4 overflow-x-auto">
        {(displayMode === 'guitar' || displayMode === 'both') && (
          <div className="flex flex-col items-center p-3 rounded-none bg-[#11131a] border border-[#202534] shadow-xs">
            <span className="text-[11px] font-light text-slate-400 mb-1 flex items-center gap-1.5">
              <span>Braço do Violão / Guitarra</span>
            </span>
            <GuitarChordDiagram chord={chord} size="md" />
          </div>
        )}

        {(displayMode === 'piano' || displayMode === 'both') && (
          <div className="flex flex-col items-center p-3 rounded-none bg-[#11131a] border border-[#202534] shadow-xs">
            <span className="text-[11px] font-light text-slate-400 mb-2 flex items-center gap-1.5">
              <span>Teclado / Piano (2 Oitavas)</span>
            </span>
            <PianoChordDiagram chord={chord} size="md" octaveOffset={octaveOffset} />
          </div>
        )}
      </div>

      {/* Escala Correspondente Section */}
      <div
        id={`scale-section-${chord.id}`}
        className="p-3.5 rounded-none bg-[#141720] border border-[#232836] space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            <h3 className="text-xs font-medium text-slate-200">
              Escala Correspondente & Improviso
            </h3>
          </div>

          <button
            id="btn-play-scale-audio"
            type="button"
            onClick={handlePlayScale}
            disabled={isPlayingScale}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-none font-normal text-xs transition-all active:translate-y-0.5 ${
              isPlayingScale
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-[#181c26] hover:bg-[#202534] text-slate-300 border border-[#272d3e]'
            }`}
          >
            <Play className={`w-3 h-3 ${isPlayingScale ? 'fill-amber-300' : 'fill-slate-400'}`} />
            <span>{isPlayingScale ? 'Reproduzindo...' : 'Ouvir Escala'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-normal text-indigo-300 bg-[#181c28] border border-[#252c40] px-2 py-0.5 rounded-none">
              {chord.scale.name}
            </span>
            <span className="text-xs text-slate-400 font-light">
              Modo: <strong className="text-slate-300 font-normal">{chord.scale.mode}</strong>
            </span>
          </div>

          {/* Scale Notes Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-light text-slate-400 mr-1">
              Notas da escala:
            </span>
            {chord.scale.notes.map((n, idx) => (
              <span
                key={`${chord.id}-scalenote-${idx}`}
                className="px-2 py-0.5 text-xs font-normal rounded-none bg-[#191d28] text-slate-300 border border-[#262c3e]"
              >
                {n}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-400 font-light leading-relaxed">
            {chord.scale.description}
          </p>

          <div className="flex items-start gap-2 pt-2 border-t border-[#1e2330] text-xs text-slate-400 font-light">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400/80 shrink-0 mt-0.5" />
            <div>
              <span className="font-normal text-slate-300">Dica de solo: </span>
              {chord.scale.soloingTips}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

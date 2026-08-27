import React, { useState } from 'react';
import { TimelineChordItem, ChordDefinition, InstrumentType } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Trash2,
  BookmarkPlus,
  ArrowLeft,
  ArrowRight,
  Plus,
  Volume2,
  Music2,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface ChordTimelineProps {
  timeline: TimelineChordItem[];
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  onRemoveChord: (index: number) => void;
  onMoveChord: (fromIndex: number, toIndex: number) => void;
  onClearTimeline: () => void;
  onOpenSaveModal: () => void;
  onOpenPickerModal: () => void;
  tempoBpm: number;
  onTempoChange: (bpm: number) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  onUpdateChordOctave?: (index: number, newOctaveOffset: number) => void;
}

export const ChordTimeline: React.FC<ChordTimelineProps> = ({
  timeline,
  selectedIndex,
  onSelectIndex,
  onRemoveChord,
  onMoveChord,
  onClearTimeline,
  onOpenSaveModal,
  onOpenPickerModal,
  tempoBpm,
  onTempoChange,
  instrument,
  onInstrumentChange,
  onUpdateChordOctave,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(true);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
      setPlayingStep(null);
    } else {
      if (timeline.length === 0) return;
      setIsPlaying(true);
      audioEngine.playSequence(
        timeline,
        tempoBpm,
        instrument,
        isLooping,
        (stepIdx) => {
          setPlayingStep(stepIdx);
          onSelectIndex(stepIdx);
        },
        () => {
          setIsPlaying(false);
          setPlayingStep(null);
        },
        0
      );
    }
  };

  const handleStop = () => {
    audioEngine.stopSequence();
    setIsPlaying(false);
    setPlayingStep(null);
  };

  const handleChordClick = (index: number) => {
    onSelectIndex(index);
    const item = timeline[index];
    if (item) {
      audioEngine.playChord(item.chord, instrument, 1.4, item.octaveOffset ?? 0);
    }
  };

  const handleShiftChordOctave = (e: React.MouseEvent, index: number, delta: number) => {
    e.stopPropagation();
    if (!onUpdateChordOctave) return;
    const current = timeline[index].octaveOffset ?? 0;
    const next = Math.max(-2, Math.min(2, current + delta));
    onUpdateChordOctave(index, next);
    audioEngine.playChord(timeline[index].chord, instrument, 1.0, next);
  };

  return (
    <div
      id="chord-timeline-container"
      className="bg-[#1a1d26] border border-[#2d3342] rounded-none p-4 md:p-5 shadow-lg space-y-3"
    >
      {/* Timeline Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-none bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Linha do Tempo</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-none bg-[#242834] text-slate-300 border border-[#384050]">
                {timeline.length} {timeline.length === 1 ? 'acorde' : 'acordes'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {timeline.length === 0
                ? 'Selecione ou clique em um acorde para iniciar a sequência'
                : 'Clique nos acordes para ouvir e inspecionar suas oitavas e escalas'}
            </p>
          </div>
        </div>

        {/* Global Playback & Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument Toggle */}
          <div className="inline-flex p-0.5 rounded-none bg-[#202430] border border-[#313747] text-xs font-bold">
            <button
              id="btn-inst-piano"
              type="button"
              onClick={() => onInstrumentChange('piano')}
              className={`px-3 py-1.5 rounded-none transition-all ${
                instrument === 'piano'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎹 Piano
            </button>
            <button
              id="btn-inst-guitar"
              type="button"
              onClick={() => onInstrumentChange('guitar')}
              className={`px-3 py-1.5 rounded-none transition-all ${
                instrument === 'guitar'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎸 Violão
            </button>
          </div>

          {/* Tempo BPM */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#202430] border border-[#313747] text-xs">
            <span className="text-slate-400 font-bold">BPM:</span>
            <input
              id="input-bpm-slider"
              type="range"
              min="50"
              max="180"
              value={tempoBpm}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              className="w-16 h-1.5 accent-indigo-500 bg-[#384050] rounded-none cursor-pointer"
            />
            <span className="font-extrabold text-white w-7 text-right">
              {tempoBpm}
            </span>
          </div>

          {/* Loop Button */}
          <button
            id="btn-toggle-loop"
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-none border text-xs font-bold transition-all active:translate-y-0.5 ${
              isLooping
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                : 'bg-[#202430] text-slate-400 border-[#313747] hover:text-slate-200'
            }`}
            title={isLooping ? 'Repetição Ativada' : 'Repetição Desativada'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            id="btn-play-timeline"
            type="button"
            onClick={handleTogglePlay}
            disabled={timeline.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-none font-extrabold text-xs shadow-md transition-all active:translate-y-0.5 ${
              timeline.length === 0
                ? 'bg-[#282d3b] text-slate-500 border border-[#333a4a] cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Tocar Tudo</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              id="btn-stop-timeline"
              type="button"
              onClick={handleStop}
              className="p-2 rounded-none bg-[#202430] hover:bg-[#282d3b] text-slate-200 border border-[#313747] text-xs transition-colors"
              title="Parar"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Save to Favorites Button */}
          <button
            id="btn-save-progression"
            type="button"
            onClick={onOpenSaveModal}
            disabled={timeline.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-[#242834] hover:bg-[#2c3242] text-amber-300 font-bold text-xs border border-amber-500/30 transition-all disabled:opacity-50 active:translate-y-0.5"
            title="Salvar na Biblioteca"
          >
            <BookmarkPlus className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>

      {/* Chords Sequence Timeline Bar */}
      <div className="relative min-h-[118px] p-3 rounded-none bg-[#13151c] border border-[#282d3b] overflow-x-auto">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-none bg-[#202430] border border-[#313747] text-indigo-400 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              Sua linha do tempo está vazia
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-0.5 mb-3">
              Escolha um acorde recomendado abaixo ou busque um acorde específico para ver sugestões inteligentes imediatas.
            </p>
            <button
              id="btn-open-picker-empty"
              type="button"
              onClick={onOpenPickerModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Escolher 1º Acorde</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 pb-1">
            {timeline.map((item, index) => {
              const isSelected = selectedIndex === index;
              const isCurrentlyPlaying = isPlaying && playingStep === index;
              const octOffset = item.octaveOffset ?? 0;

              return (
                <div
                  key={item.id}
                  id={`timeline-chord-${index}`}
                  className="relative group shrink-0"
                >
                  {/* Measure / Bar Label */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1 px-0.5">
                    <span>Comp. {index + 1}</span>
                    <span>4/4</span>
                  </div>

                  {/* Chord Block (Square) */}
                  <div
                    onClick={() => handleChordClick(index)}
                    className={`relative w-28 h-22 rounded-none p-2.5 flex flex-col justify-between cursor-pointer transition-all select-none border ${
                      isCurrentlyPlaying
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400'
                        : isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-300'
                        : 'bg-[#1e222d] text-slate-100 border-[#313747] hover:border-indigo-400 hover:bg-[#252a38]'
                    }`}
                  >
                    {/* Symbol & Quality */}
                    <div className="flex items-start justify-between">
                      <span className="text-xl font-black tracking-tight leading-none">
                        {item.chord.symbol}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-none border ${
                          isSelected || isCurrentlyPlaying
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-[#282d3b] text-indigo-300 border-[#384050]'
                        }`}
                      >
                        {item.chord.quality}
                      </span>
                    </div>

                    {/* Scale Notes Preview & Octave info */}
                    <div className="flex items-center justify-between text-[10px] font-medium opacity-90 truncate">
                      <span className="truncate">{item.chord.noteNames.join(' ')}</span>
                      {octOffset !== 0 && (
                        <span className={`text-[9px] font-extrabold px-1 rounded-none border ml-1 ${
                          octOffset > 0
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-400/50'
                            : 'bg-amber-900/60 text-amber-300 border-amber-400/50'
                        }`}>
                          {octOffset > 0 ? `+${octOffset} 8va` : `${octOffset} 8vb`}
                        </span>
                      )}
                    </div>

                    {/* Playing Pulse Bar Indicator */}
                    {isCurrentlyPlaying && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-none animate-pulse border border-black" />
                    )}
                  </div>

                  {/* Chord Action mini-toolbar */}
                  <div className="flex items-center justify-between gap-1 mt-1.5 px-0.5">
                    {/* Move Left */}
                    <button
                      id={`btn-move-left-${index}`}
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveChord(index, index - 1);
                      }}
                      className="p-1 rounded-none bg-[#202430] hover:bg-[#282d3b] text-slate-400 hover:text-slate-200 border border-[#313747] disabled:opacity-25 text-[10px]"
                      title="Mover para esquerda"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>

                    {/* Octave Down */}
                    {onUpdateChordOctave && (
                      <button
                        type="button"
                        onClick={(e) => handleShiftChordOctave(e, index, -1)}
                        disabled={octOffset <= -2}
                        className="p-1 rounded-none bg-[#202430] hover:bg-[#282d3b] text-amber-400 border border-[#313747] disabled:opacity-25 text-[10px]"
                        title="Oitava -1"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}

                    {/* Octave Up */}
                    {onUpdateChordOctave && (
                      <button
                        type="button"
                        onClick={(e) => handleShiftChordOctave(e, index, 1)}
                        disabled={octOffset >= 2}
                        className="p-1 rounded-none bg-[#202430] hover:bg-[#282d3b] text-emerald-400 border border-[#313747] disabled:opacity-25 text-[10px]"
                        title="Oitava +1"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      id={`btn-remove-chord-${index}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveChord(index);
                      }}
                      className="p-1 rounded-none bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[10px]"
                      title="Remover acorde"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Move Right */}
                    <button
                      id={`btn-move-right-${index}`}
                      type="button"
                      disabled={index === timeline.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveChord(index, index + 1);
                      }}
                      className="p-1 rounded-none bg-[#202430] hover:bg-[#282d3b] text-slate-400 hover:text-slate-200 border border-[#313747] disabled:opacity-25 text-[10px]"
                      title="Mover para direita"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Chord at the end button */}
            <div className="shrink-0 flex flex-col items-center justify-center pt-4">
              <button
                id="btn-timeline-add-more"
                type="button"
                onClick={onOpenPickerModal}
                className="w-22 h-22 rounded-none border-2 border-dashed border-[#384050] hover:border-indigo-400 bg-[#1e222d]/60 hover:bg-[#242834] flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-300 transition-all group active:translate-y-0.5"
                title="Adicionar mais acordes"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-400" />
                <span className="text-[10px] font-bold">Adicionar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear timeline button if not empty */}
      {timeline.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-emerald-400"></span>
            <span>Clique em qualquer acorde para inspecionar digitação, oitavas e escalas</span>
          </div>

          <button
            id="btn-clear-timeline"
            type="button"
            onClick={onClearTimeline}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Sequência</span>
          </button>
        </div>
      )}
    </div>
  );
};

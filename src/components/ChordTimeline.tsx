import React, { useState, useEffect } from 'react';
import { TimelineChordItem, ChordDefinition, InstrumentType, ChordRhythmPattern, BackingTrackStyle, CHORD_DURATION_OPTIONS } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import { getSemitone } from '../utils/melodyGenerator';
import { PREFERRED_ROOT_NAMES, getTimelineKeyRoot } from '../utils/transposition';
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
  Minus,
  Clock,
  Volume2,
  VolumeX,
  Music2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Download,
  Activity,
  Disc,
  ArrowUpDown,
  RotateCcw,
  Dices,
} from 'lucide-react';

interface ChordTimelineProps {
  timeline: TimelineChordItem[];
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  onRemoveChord: (index: number) => void;
  onMoveChord: (fromIndex: number, toIndex: number) => void;
  onClearTimeline: () => void;
  onOpenSaveModal: () => void;
  onOpenExportMidi?: () => void;
  onOpenPickerModal: () => void;
  tempoBpm: number;
  onTempoChange: (bpm: number) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  onUpdateChordOctave?: (index: number, newOctaveOffset: number) => void;
  onUpdateChordRhythm?: (index: number, newRhythm: ChordRhythmPattern) => void;
  onUpdateChordDuration?: (index: number, newDurationBeats: number) => void;
  activeBackingStyle?: BackingTrackStyle;
  onBackingStyleChange?: (style: BackingTrackStyle) => void;
  onTransposeProgression?: (deltaSemitones: number) => void;
  totalTransposition?: number;
  onGenerateRandomProgression?: () => void;
}

export const ChordTimeline: React.FC<ChordTimelineProps> = ({
  timeline,
  selectedIndex,
  onSelectIndex,
  onRemoveChord,
  onMoveChord,
  onClearTimeline,
  onOpenSaveModal,
  onOpenExportMidi,
  onOpenPickerModal,
  tempoBpm,
  onTempoChange,
  instrument,
  onInstrumentChange,
  onUpdateChordOctave,
  onUpdateChordRhythm,
  onUpdateChordDuration,
  activeBackingStyle,
  onBackingStyleChange,
  onTransposeProgression,
  totalTransposition = 0,
  onGenerateRandomProgression,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(true);

  // Backing Track state
  const [localBackingStyle, setLocalBackingStyle] = useState<BackingTrackStyle>(() => {
    try {
      const saved = localStorage.getItem('harmoniq_backing_style');
      if (saved && ['none', 'rock', 'funk', 'reggae', 'shuffle', 'disco', 'bossa', 'punk', 'techno'].includes(saved)) {
        return saved as BackingTrackStyle;
      }
    } catch {
      // ignore
    }
    return 'none';
  });

  const [backingVolume, setBackingVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('harmoniq_backing_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {
      // ignore
    }
    return 0.75;
  });

  const [isBackingMuted, setIsBackingMuted] = useState(false);

  const backingStyle = activeBackingStyle !== undefined ? activeBackingStyle : localBackingStyle;

  const handleBackingStyleSelect = (newStyle: BackingTrackStyle) => {
    if (onBackingStyleChange) {
      onBackingStyleChange(newStyle);
    } else {
      setLocalBackingStyle(newStyle);
    }
    try {
      localStorage.setItem('harmoniq_backing_style', newStyle);
    } catch {
      // ignore
    }
  };

  const currentKeyRoot = getTimelineKeyRoot(timeline);

  // Available rhythm patterns for user selection
  const RHYTHM_OPTIONS: { id: ChordRhythmPattern; label: string; icon: string; desc: string }[] = [
    { id: 'whole', label: 'Sustentado', icon: '𝅝', desc: 'Acorde longo (1 compasso inteiro)' },
    { id: 'quarters', label: 'Semínimas (4x)', icon: '♩', desc: '4 batidas retas por compasso (1, 2, 3, 4)' },
    { id: 'eighths', label: 'Colcheias (8x)', icon: '♫', desc: '8 batidas contínuas (Pop Rock)' },
    { id: 'syncopated', label: 'Sincopado', icon: '⚡', desc: 'Groove dinâmico com contratempos' },
    { id: 'arpeggio', label: 'Arpejo', icon: '〰', desc: 'Notas dedilhadas sequencialmente' },
    { id: 'waltz', label: 'Valsa / Balada', icon: '¾', desc: 'Baixo no 1 + batidas no 2 e 3' },
  ];

  // Available backing track drum and bass styles
  const BACKING_OPTIONS: {
    id: BackingTrackStyle;
    label: string;
    icon: string;
    desc: string;
    bassDesc: string;
  }[] = [
    { id: 'none', label: 'Nenhum (Apenas Acordes)', icon: '🚫', desc: 'Silencioso', bassDesc: 'Sem baixo' },
    { id: 'rock', label: 'Rock Clássico', icon: '🥁', desc: 'Bateria 8ths reta', bassDesc: 'Baixo contínuo na fundamental' },
    { id: 'funk', label: 'Funk / Groove', icon: '🕺', desc: 'Groove sincopado 16ths', bassDesc: 'Slap bass com oitavas e 7ª' },
    { id: 'reggae', label: 'Reggae (One-Drop)', icon: '🌴', desc: 'One Drop no 3 & skank', bassDesc: 'Sub-baixo roots profundo' },
    { id: 'shuffle', label: 'Blues Shuffle', icon: '🎷', desc: 'Swing ternário em tercinas', bassDesc: 'Walking bass clássico (1-3-5-6)' },
    { id: 'disco', label: 'Disco / Dance', icon: '🪩', desc: '4-on-the-floor + open hat', bassDesc: 'Baixo oitavado pulsante' },
    { id: 'bossa', label: 'Bossa Nova', icon: '☕', desc: 'Rimshot sincopado suave', bassDesc: 'Baixo acústico sincopado (1 e 5)' },
    { id: 'punk', label: 'Punk Rock', icon: '⚡', desc: 'Batida acelerada reta', bassDesc: 'Baixo rápido em colcheias' },
    { id: 'techno', label: 'Techno 4x4', icon: '🎛️', desc: 'Bumbo eletrônico 4x4 sub', bassDesc: 'Sub-bass rolante 16ths' },
  ];

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stopSequence();
      setIsPlaying(false);
      setPlayingStep(null);
    } else {
      if (timeline.length === 0) return;
      setIsPlaying(true);
      const effectiveBacking = isBackingMuted ? 'none' : backingStyle;
      const effectiveVolume = isBackingMuted ? 0 : backingVolume;
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
        0,
        effectiveBacking,
        effectiveVolume
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

  const DURATION_STEPS = [1, 2, 3, 4, 6, 8];

  const handleStepChordDuration = (e: React.MouseEvent, index: number, direction: -1 | 1) => {
    e.stopPropagation();
    if (!onUpdateChordDuration) return;
    const current = timeline[index].durationBeats || 4;
    let next: number;
    if (direction === -1) {
      const smaller = DURATION_STEPS.filter((s) => s < current);
      next = smaller.length > 0 ? smaller[smaller.length - 1] : 1;
    } else {
      const larger = DURATION_STEPS.filter((s) => s > current);
      next = larger.length > 0 ? larger[0] : 8;
    }
    onUpdateChordDuration(index, next);
  };

  const handleSelectChordDuration = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    e.stopPropagation();
    if (!onUpdateChordDuration) return;
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateChordDuration(index, val);
    }
  };

  const totalProgressionBeats = timeline.reduce((acc, it) => acc + (it.durationBeats || 4), 0);
  const totalProgressionSeconds = Math.round((totalProgressionBeats * 60) / tempoBpm);

  return (
    <div
      id="chord-timeline-container"
      className="bg-[#141720] border border-[#232836] rounded-none p-3.5 md:p-4 shadow-xs space-y-3"
    >
      {/* Timeline Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#1a1e2a] text-indigo-400 border border-[#272d3e] flex items-center justify-center">
            <Music2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2 flex-wrap">
              <span>Linha do Tempo</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-none bg-[#1a1e28] text-slate-400 border border-[#272d3e]">
                {timeline.length} {timeline.length === 1 ? 'acorde' : 'acordes'}
              </span>
              {timeline.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-amber-950/40 text-amber-300 border border-amber-800/50 flex items-center gap-1" title="Duração total da progressão">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  <span>{totalProgressionBeats} tempos ({(totalProgressionBeats / 4).toFixed(1)} comp. • ~{totalProgressionSeconds}s)</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-light">
              {timeline.length === 0
                ? 'Selecione ou clique em um acorde para iniciar a sequência'
                : 'Ajuste tempos, oitavas, ritmo e tonalidade de cada acorde na progressão'}
            </p>
          </div>
        </div>

        {/* Global Playback & Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument Toggle */}
          <div className="inline-flex p-0.5 rounded-none bg-[#181c26] border border-[#252a38] text-xs font-normal">
            <button
              id="btn-inst-piano"
              type="button"
              onClick={() => onInstrumentChange('piano')}
              className={`px-3 py-1.5 rounded-none transition-all ${
                instrument === 'piano'
                  ? 'bg-[#222838] text-slate-200 border border-indigo-500/50 shadow-xs font-medium'
                  : 'text-slate-400 hover:text-slate-300'
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
                  ? 'bg-[#222838] text-slate-200 border border-indigo-500/50 shadow-xs font-medium'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              🎸 Violão
            </button>
          </div>

          {/* Tempo BPM */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#181c26] border border-[#252a38] text-xs">
            <span className="text-slate-400 font-normal">BPM:</span>
            <input
              id="input-bpm-slider"
              type="range"
              min="50"
              max="180"
              value={tempoBpm}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              className="w-16 h-1 accent-indigo-400 bg-[#2d3345] rounded-none cursor-pointer"
            />
            <span className="font-medium text-slate-300 w-7 text-right">
              {tempoBpm}
            </span>
          </div>

          {/* Loop Button */}
          <button
            id="btn-toggle-loop"
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-none border text-xs font-normal transition-all active:translate-y-0.5 ${
              isLooping
                ? 'bg-[#222838] text-indigo-300 border-indigo-500/50 shadow-xs'
                : 'bg-[#181c26] text-slate-400 border-[#252a38] hover:text-slate-300'
            }`}
            title={isLooping ? 'Repetição Ativada' : 'Repetição Desativada'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            id="btn-play-timeline"
            type="button"
            onClick={handleTogglePlay}
            disabled={timeline.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-none font-medium text-xs shadow-xs transition-all active:translate-y-0.5 ${
              timeline.length === 0
                ? 'bg-[#181c26] text-slate-500 border border-[#252a38] cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-600/80 hover:bg-amber-500/80 text-amber-100 border border-amber-500/50'
                : 'bg-emerald-700/80 hover:bg-emerald-600/80 text-emerald-100 border border-emerald-500/50'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tocar Tudo</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              id="btn-stop-timeline"
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 border border-[#252a38] text-xs transition-colors"
              title="Parar"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Generate Random Progression Button */}
          {onGenerateRandomProgression && (
            <button
              id="btn-generate-random-timeline"
              type="button"
              onClick={onGenerateRandomProgression}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/40 transition-all active:translate-y-0.5 shadow-xs"
              title="Gerar uma nova progressão harmônica aleatória baseada no estilo musical selecionado"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerar Aleatória</span>
            </button>
          )}

          {/* Save to Favorites Button */}
          <button
            id="btn-save-progression"
            type="button"
            onClick={onOpenSaveModal}
            disabled={timeline.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#1c202a] hover:bg-[#232835] text-slate-300 font-normal text-xs border border-[#2d3345] transition-all disabled:opacity-50 active:translate-y-0.5"
            title="Salvar na Biblioteca"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          {/* Export MIDI File Button */}
          {onOpenExportMidi && (
            <button
              id="btn-export-midi"
              type="button"
              onClick={onOpenExportMidi}
              disabled={timeline.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 font-normal text-xs border border-indigo-700/50 transition-all disabled:opacity-50 active:translate-y-0.5"
              title="Exportar progressão em formato MIDI (.mid)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">MIDI</span>
            </button>
          )}
        </div>
      </div>

      {/* Backing Track Accompaniment Toolbar Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-[#10141d] border border-[#1e2434] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="text-sm">🥁</span>
            <span>Backing Track:</span>
          </div>

          {/* Style Selector */}
          <select
            id="select-backing-track-style"
            value={backingStyle}
            onChange={(e) => {
              const newStyle = e.target.value as BackingTrackStyle;
              handleBackingStyleSelect(newStyle);
            }}
            className="bg-[#171b26] hover:bg-[#1e2332] text-slate-200 text-xs font-normal border border-[#262c3e] focus:border-indigo-500 py-1 px-2 rounded-none outline-none cursor-pointer transition-colors"
            title="Escolha o estilo de bateria e baixo de acompanhamento"
          >
            {BACKING_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>

          {/* Active style details pill */}
          {backingStyle !== 'none' && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-light">
              <span className="px-1.5 py-0.5 bg-[#171c28] border border-[#262e42] text-indigo-300 font-mono text-[10px]">
                {BACKING_OPTIONS.find((b) => b.id === backingStyle)?.desc}
              </span>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="text-slate-400 font-light hidden sm:inline">
                {BACKING_OPTIONS.find((b) => b.id === backingStyle)?.bassDesc}
              </span>
            </div>
          )}
        </div>

        {/* Volume & Mute Controls */}
        {backingStyle !== 'none' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-backing-mute"
              onClick={() => {
                const next = !isBackingMuted;
                setIsBackingMuted(next);
                audioEngine.setBackingVolume(next ? 0 : backingVolume);
              }}
              className={`p-1 rounded-none border text-xs transition-colors ${
                isBackingMuted
                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                  : 'bg-[#181d2a] text-slate-300 border-[#252c3e] hover:text-white'
              }`}
              title={isBackingMuted ? 'Desmutar Bateria/Baixo' : 'Mutar Bateria/Baixo'}
            >
              {isBackingMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px]">Vol:</span>
              <input
                id="input-backing-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isBackingMuted ? 0 : backingVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBackingVolume(val);
                  if (isBackingMuted) setIsBackingMuted(false);
                  audioEngine.setBackingVolume(val);
                  try {
                    localStorage.setItem('harmoniq_backing_volume', val.toString());
                  } catch {
                    // ignore
                  }
                }}
                className="w-16 h-1 accent-indigo-400 bg-[#2d3345] rounded-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                {Math.round((isBackingMuted ? 0 : backingVolume) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transposition & Harmonization Toolbar Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-[#10141d] border border-[#1e2434] text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Transpor:</span>
          </div>

          {/* Semitone Step Buttons (-1 st / +1 st) */}
          <div className="inline-flex items-center border border-[#262c3e] bg-[#171b26]">
            <button
              type="button"
              id="btn-transpose-down"
              onClick={() => onTransposeProgression && onTransposeProgression(-1)}
              disabled={timeline.length === 0}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-[#202738] active:bg-[#283146] font-mono text-xs border-r border-[#262c3e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Transpor meio tom abaixo (-1 semitom)"
            >
              -1 st
            </button>
            <button
              type="button"
              id="btn-transpose-up"
              onClick={() => onTransposeProgression && onTransposeProgression(1)}
              disabled={timeline.length === 0}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-[#202738] active:bg-[#283146] font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Transpor meio tom acima (+1 semitom)"
            >
              +1 st
            </button>
          </div>

          {/* Current Key Indicator & Cumulative Semitone Shift Badge */}
          {timeline.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Tom Atual:</span>
              <span className="px-2 py-0.5 bg-[#171c28] border border-[#2b3550] text-amber-300 font-bold font-mono text-xs">
                {currentKeyRoot}
              </span>
              {totalTransposition !== 0 && (
                <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/60 text-amber-300 text-[10px] font-mono">
                  {totalTransposition > 0 ? `+${totalTransposition}` : totalTransposition} st
                </span>
              )}
            </div>
          )}

          {/* Direct Key Selector Dropdown */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-1">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Mudar para:</span>
            <select
              id="select-transpose-key"
              value={currentKeyRoot}
              disabled={timeline.length === 0}
              onChange={(e) => {
                const targetKey = e.target.value;
                if (!targetKey || targetKey === currentKeyRoot) return;
                const currentSt = getSemitone(currentKeyRoot);
                const targetSt = getSemitone(targetKey);
                // Compute shortest circular semitone distance (-6 to +6)
                let diff = (targetSt - currentSt) % 12;
                if (diff > 6) diff -= 12;
                if (diff < -6) diff += 12;
                if (diff !== 0 && onTransposeProgression) {
                  onTransposeProgression(diff);
                }
              }}
              className="bg-[#171b26] hover:bg-[#1e2332] text-slate-200 text-xs font-mono border border-[#262c3e] focus:border-amber-500 py-1 px-2 rounded-none outline-none cursor-pointer transition-colors disabled:opacity-40"
              title="Mudar diretamente a tonalidade da progressão mantendo todas as relações harmônicas"
            >
              {PREFERRED_ROOT_NAMES.map((k) => (
                <option key={k} value={k}>
                  Tom de {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Transposition Button */}
        {totalTransposition !== 0 && (
          <button
            type="button"
            id="btn-reset-transposition"
            onClick={() => {
              if (onTransposeProgression && totalTransposition !== 0) {
                onTransposeProgression(-totalTransposition);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#171b26] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#262c3e] text-[11px] transition-colors"
            title="Restaurar a tonalidade original da progressão"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Restaurar ({totalTransposition > 0 ? `+${totalTransposition}` : totalTransposition} st)</span>
          </button>
        )}
      </div>

      {/* Chords Sequence Timeline Bar */}
      <div className="relative min-h-[110px] p-2.5 rounded-none bg-[#10131a] border border-[#202534] overflow-x-auto">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-8 h-8 rounded-none bg-[#181c26] border border-[#252a38] text-indigo-400/80 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-300">
              Sua linha do tempo está vazia
            </p>
            <p className="text-[11px] text-slate-400 font-light max-w-sm mt-0.5 mb-3">
              Escolha um acorde recomendado abaixo ou busque um acorde específico para ver sugestões inteligentes imediatas.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                id="btn-open-picker-empty"
                type="button"
                onClick={onOpenPickerModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-[#1e2330] hover:bg-[#252c3d] text-slate-200 text-xs font-normal border border-[#2d3448] shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Escolher 1º Acorde</span>
              </button>

              {onGenerateRandomProgression && (
                <button
                  id="btn-generate-random-empty"
                  type="button"
                  onClick={onGenerateRandomProgression}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-amber-600/80 hover:bg-amber-500/80 text-white text-xs font-medium border border-amber-500/50 shadow-xs transition-all active:translate-y-0.5"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Gerar Progressão Aleatória</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pb-1">
            {timeline.map((item, index) => {
              const isSelected = selectedIndex === index;
              const isCurrentlyPlaying = isPlaying && playingStep === index;
              const octOffset = item.octaveOffset ?? 0;
              const itemDuration = item.durationBeats || 4;

              // Precompute beat position and measure
              const startBeat = timeline.slice(0, index).reduce((acc, it) => acc + (it.durationBeats || 4), 0);
              const measureNum = Math.floor(startBeat / 4) + 1;
              const beatInMeasure = (startBeat % 4) + 1;

              return (
                <div
                  key={item.id}
                  id={`timeline-chord-${index}`}
                  className="relative group shrink-0"
                >
                  {/* Measure / Bar Label & Duration */}
                  <div className="flex items-center justify-between text-[9px] font-normal text-slate-400 mb-1 px-0.5">
                    <span className="font-mono">Comp. {measureNum}{beatInMeasure > 1 ? `.${beatInMeasure}` : ''}</span>
                    <span className="flex items-center gap-0.5 text-amber-300 font-mono text-[9px]" title={`Duração: ${itemDuration} tempos`}>
                      <Clock className="w-2.5 h-2.5 text-amber-400/90" />
                      <span>{itemDuration}t</span>
                    </span>
                  </div>

                  {/* Chord Block (Square) */}
                  <div
                    onClick={() => handleChordClick(index)}
                    className={`relative w-28 h-20 rounded-none p-2 flex flex-col justify-between cursor-pointer transition-all select-none border ${
                      isCurrentlyPlaying
                        ? 'bg-[#222838] text-slate-100 border-indigo-400 ring-1 ring-indigo-400/40 shadow-xs'
                        : isSelected
                        ? 'bg-[#1e2332] text-slate-100 border-indigo-500/80 ring-1 ring-indigo-500/30 shadow-xs'
                        : 'bg-[#161922] text-slate-300 border-[#242938] hover:border-indigo-500/40 hover:bg-[#1a1f2b]'
                    }`}
                  >
                    {/* Symbol & Quality */}
                    <div className="flex items-start justify-between">
                      <span className="text-lg font-medium tracking-tight leading-none text-slate-200">
                        {item.chord.symbol}
                      </span>
                      <span
                        className={`text-[9px] font-normal uppercase px-1 py-0.5 rounded-none border ${
                          isSelected || isCurrentlyPlaying
                            ? 'bg-[#141720] text-indigo-300 border-indigo-500/40'
                            : 'bg-[#12141a] text-slate-400 border-[#242938]'
                        }`}
                      >
                        {item.chord.quality}
                      </span>
                    </div>

                    {/* Scale Notes Preview & Badges (Duration, Octave, Rhythm) */}
                    <div className="flex items-center justify-between text-[9px] font-light text-slate-400 truncate">
                      <span className="truncate">{item.chord.noteNames.join(' ')}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {itemDuration !== 4 && (
                          <span className="text-[9px] font-mono font-medium px-1 rounded-none bg-amber-950/50 text-amber-300 border border-amber-700/50" title={`Duração: ${itemDuration} tempos`}>
                            {itemDuration}t
                          </span>
                        )}
                        {octOffset !== 0 && (
                          <span className={`text-[9px] font-medium px-1 rounded-none border ${
                            octOffset > 0
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                          }`}>
                            {octOffset > 0 ? `+${octOffset} 8va` : `${octOffset} 8vb`}
                          </span>
                        )}
                        {/* Rhythm pattern indicator badge */}
                        {item.rhythmPattern && item.rhythmPattern !== 'whole' && (
                          <span className="text-[9px] font-medium px-1 rounded-none bg-indigo-950/50 text-indigo-300 border border-indigo-700/50" title={`Ritmo: ${item.rhythmPattern}`}>
                            {RHYTHM_OPTIONS.find(r => r.id === item.rhythmPattern)?.icon || '♩'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Playing Pulse Bar Indicator */}
                    {isCurrentlyPlaying && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400/80 rounded-none animate-pulse border border-black" />
                    )}
                  </div>

                  {/* Duration Stepper & Selector Row (Requirement: Aumentar ou diminuir o tempo de um acorde) */}
                  <div className="mt-1 px-0.5 flex items-center justify-between gap-1 bg-[#12151e] border border-[#232838] p-0.5" title="Duração do acorde (Tempos / Compassos)">
                    <button
                      id={`btn-decrease-duration-${index}`}
                      type="button"
                      disabled={itemDuration <= 1}
                      onClick={(e) => handleStepChordDuration(e, index, -1)}
                      className="p-1 rounded-none bg-[#181c28] hover:bg-[#222838] text-slate-400 hover:text-amber-300 border border-[#272e42] disabled:opacity-20 text-[10px] transition-colors active:translate-y-0.5"
                      title="Diminuir tempo deste acorde (-)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>

                    <select
                      id={`select-chord-duration-${index}`}
                      value={itemDuration}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleSelectChordDuration(e, index)}
                      className="flex-1 min-w-0 bg-transparent text-amber-300 font-mono text-[10px] font-medium text-center focus:outline-none cursor-pointer py-0.5 px-0.5"
                      title="Duração em tempos do acorde"
                    >
                      {CHORD_DURATION_OPTIONS.map((opt) => (
                        <option key={opt.beats} value={opt.beats} className="bg-[#141720] text-slate-200">
                          {opt.shortLabel} ({opt.measureText})
                        </option>
                      ))}
                    </select>

                    <button
                      id={`btn-increase-duration-${index}`}
                      type="button"
                      disabled={itemDuration >= 8}
                      onClick={(e) => handleStepChordDuration(e, index, 1)}
                      className="p-1 rounded-none bg-[#181c28] hover:bg-[#222838] text-slate-400 hover:text-amber-300 border border-[#272e42] disabled:opacity-20 text-[10px] transition-colors active:translate-y-0.5"
                      title="Aumentar tempo deste acorde (+)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Rhythm selector dropdown directly underneath chord block */}
                  <div className="mt-1 px-0.5">
                    <select
                      id={`select-chord-rhythm-${index}`}
                      value={item.rhythmPattern || 'whole'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newRhythm = e.target.value as ChordRhythmPattern;
                        if (onUpdateChordRhythm) {
                          onUpdateChordRhythm(index, newRhythm);
                        }
                        // Preview rhythm briefly
                        audioEngine.playChordWithPattern(item.chord, instrument, 1.2, item.octaveOffset ?? 0, newRhythm, tempoBpm);
                      }}
                      className="w-full bg-[#161a24] hover:bg-[#1c2230] text-slate-300 text-[10px] font-light border border-[#242b3c] focus:border-indigo-500/70 py-0.5 px-1 rounded-none outline-none cursor-pointer transition-colors"
                      title="Padrão Rítmico de Execução"
                    >
                      {RHYTHM_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chord Action mini-toolbar */}
                  <div className="flex items-center justify-between gap-1 mt-1 px-0.5">
                    {/* Move Left */}
                    <button
                      id={`btn-move-left-${index}`}
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveChord(index, index - 1);
                      }}
                      className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-300 border border-[#252a38] disabled:opacity-20 text-[10px]"
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
                        className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-300 border border-[#252a38] disabled:opacity-20 text-[10px]"
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
                        className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-300 border border-[#252a38] disabled:opacity-20 text-[10px]"
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
                      className="p-1 rounded-none bg-[#181c26] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#252a38] text-[10px]"
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
                      className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-300 border border-[#252a38] disabled:opacity-20 text-[10px]"
                      title="Mover para direita"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Chord at the end button */}
            <div className="shrink-0 flex flex-col items-center justify-center pt-3">
              <button
                id="btn-timeline-add-more"
                type="button"
                onClick={onOpenPickerModal}
                className="w-20 h-20 rounded-none border border-dashed border-[#2b3142] hover:border-indigo-500/50 bg-[#161922] hover:bg-[#1c212e] flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-300 transition-all cursor-pointer active:translate-y-0.5"
                title="Adicionar mais acordes"
              >
                <Plus className="w-4 h-4 text-indigo-400/80" />
                <span className="text-[10px] font-normal">Adicionar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear timeline button if not empty */}
      {timeline.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 font-light">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-none bg-emerald-400/70"></span>
            <span>Clique em qualquer acorde para inspecionar digitação, oitavas e escalas</span>
          </div>

          <button
            id="btn-clear-timeline"
            type="button"
            onClick={onClearTimeline}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors font-light flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar Sequência</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  SCALE_DICTIONARY_DATABASE,
  ROOT_KEY_OPTIONS,
  ScaleDefinition,
  ScaleCategory,
  getScaleNotesForRoot,
  ScaleNoteInfo,
} from '../data/scaleDictionary';
import { InstrumentType } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import { GuitarScaleFretboard } from './GuitarScaleFretboard';
import { PianoScaleKeyboard } from './PianoScaleKeyboard';
import {
  BookOpen,
  Volume2,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Music,
  Compass,
  Lightbulb,
  Radio,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ScaleDictionaryPanelProps {
  initialRoot?: string;
  initialScaleId?: string;
  defaultInstrument?: InstrumentType;
}

export const ScaleDictionaryPanel: React.FC<ScaleDictionaryPanelProps> = ({
  initialRoot = 'C',
  initialScaleId = 'lydian',
  defaultInstrument = 'piano',
}) => {
  const [selectedRoot, setSelectedRoot] = useState<string>(initialRoot);
  const [selectedScaleId, setSelectedScaleId] = useState<string>(initialScaleId);
  const [categoryFilter, setCategoryFilter] = useState<ScaleCategory | 'all'>('all');
  const [instrument, setInstrument] = useState<InstrumentType>(defaultInstrument);
  const [visualizerMode, setVisualizerMode] = useState<'piano' | 'guitar' | 'none'>('piano');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [playingNoteIndex, setPlayingNoteIndex] = useState<number | null>(null);
  const [isPlayingFullScale, setIsPlayingFullScale] = useState<boolean>(false);

  // Active Scale Definition
  const activeScale: ScaleDefinition = useMemo(() => {
    return (
      SCALE_DICTIONARY_DATABASE.find((s) => s.id === selectedScaleId) ||
      SCALE_DICTIONARY_DATABASE[0]
    );
  }, [selectedScaleId]);

  // Filtered Scales by Category
  const filteredScales = useMemo(() => {
    if (categoryFilter === 'all') return SCALE_DICTIONARY_DATABASE;
    return SCALE_DICTIONARY_DATABASE.filter((s) => s.category === categoryFilter);
  }, [categoryFilter]);

  // Computed Notes of the active scale in the chosen key
  const scaleNotes: ScaleNoteInfo[] = useMemo(() => {
    return getScaleNotesForRoot(selectedRoot, activeScale);
  }, [selectedRoot, activeScale]);

  // Semitones relative to 0-11 for Fretboard and Keyboard components
  const scaleSemitones = useMemo(() => {
    return scaleNotes.map((n) => n.midi % 12);
  }, [scaleNotes]);

  // Active Root Option
  const currentRootOption = useMemo(() => {
    return (
      ROOT_KEY_OPTIONS.find((r) => r.note === selectedRoot) ||
      ROOT_KEY_OPTIONS[0]
    );
  }, [selectedRoot]);

  // Play single note on click
  const handlePlayNote = (noteInfo: ScaleNoteInfo, index: number) => {
    setPlayingNoteIndex(index);
    audioEngine.playSingleNote(noteInfo.pitchWithOctave, instrument, 0.8, 0.85);
    setTimeout(() => {
      setPlayingNoteIndex(null);
    }, 450);
  };

  // Play full scale ascending
  const handlePlayFullScale = () => {
    if (isPlayingFullScale) return;
    setIsPlayingFullScale(true);

    const noteDuration = 0.32;
    scaleNotes.forEach((note, idx) => {
      setTimeout(() => {
        setPlayingNoteIndex(idx);
        audioEngine.playSingleNote(note.pitchWithOctave, instrument, noteDuration * 1.5, 0.85);
      }, idx * noteDuration * 1000);
    });

    // Also play the octave root at the top
    const topRootOctave = 5;
    const topPitch = `${scaleNotes[0].note}${topRootOctave}`;
    setTimeout(() => {
      setPlayingNoteIndex(0);
      audioEngine.playSingleNote(topPitch, instrument, noteDuration * 2.2, 0.9);
    }, scaleNotes.length * noteDuration * 1000);

    setTimeout(() => {
      setPlayingNoteIndex(null);
      setIsPlayingFullScale(false);
    }, (scaleNotes.length + 1) * noteDuration * 1000 + 300);
  };

  const CATEGORIES: { id: ScaleCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todas as Escalas' },
    { id: 'greek', label: 'Modos Gregos' },
    { id: 'minor_variants', label: 'Menores Especiais' },
    { id: 'pentatonic_blues', label: 'Pentatônicas & Blues' },
    { id: 'symmetric_jazz', label: 'Simétricas & Jazz' },
  ];

  return (
    <section
      id="scale-dictionary-section"
      className="bg-[#141720] border border-[#232836] rounded-none p-3.5 md:p-4 shadow-xs space-y-4"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212636] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#1a1e2a] text-amber-400 border border-[#272d3e] flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                Dicionário de Escalas & Modos
              </h2>
              <span className="text-[10px] font-normal px-2 py-0.5 bg-[#1b202c] text-amber-400/90 border border-[#2b3346]">
                Teoria & Prática
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Selecione qualquer tom e modo para visualizar instantaneamente notas, intervalos e digitações
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Instrument Toggle */}
          <div className="inline-flex p-0.5 bg-[#181c26] border border-[#252a38] text-xs">
            <button
              type="button"
              id="btn-scale-dict-piano"
              onClick={() => setInstrument('piano')}
              className={`px-2.5 py-1 transition-all ${
                instrument === 'piano'
                  ? 'bg-[#222838] text-slate-100 border border-amber-500/50 font-medium'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              🎹 Piano
            </button>
            <button
              type="button"
              id="btn-scale-dict-guitar"
              onClick={() => setInstrument('guitar')}
              className={`px-2.5 py-1 transition-all ${
                instrument === 'guitar'
                  ? 'bg-[#222838] text-slate-100 border border-amber-500/50 font-medium'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              🎸 Violão
            </button>
          </div>

          {/* Expand / Collapse Button */}
          <button
            type="button"
            id="btn-toggle-scale-dictionary"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#252a38] text-xs transition-colors"
            title={isExpanded ? 'Recolher Dicionário' : 'Expandir Dicionário'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* 1. Root Note Key Selector (Tonalidade) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Escolha a Tonalidade (Tom):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Tom Selecionado: <strong className="text-amber-300">{currentRootOption.label}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
              {ROOT_KEY_OPTIONS.map((k) => {
                const isSelected = selectedRoot === k.note;
                return (
                  <button
                    key={k.note}
                    type="button"
                    id={`btn-scale-root-${k.note}`}
                    onClick={() => {
                      setSelectedRoot(k.note);
                      // preview the root note sound
                      audioEngine.playSingleNote(`${k.note}4`, instrument, 0.5, 0.8);
                    }}
                    className={`py-2 px-1 text-center border transition-all text-xs font-mono cursor-pointer active:translate-y-0.5 ${
                      isSelected
                        ? 'bg-[#22293b] text-amber-300 border-amber-500/70 font-bold shadow-xs'
                        : 'bg-[#161a25] hover:bg-[#1e2332] text-slate-300 border-[#252c3e] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{k.note}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{k.solfege}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Scale / Mode Category Filter & Mode Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Escolha o Modo ou Tipo de Escala:</span>
              </span>

              {/* Category tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 text-[11px] border transition-colors ${
                      categoryFilter === cat.id
                        ? 'bg-[#1e2536] text-indigo-300 border-indigo-500/60 font-medium'
                        : 'bg-[#141822] text-slate-400 border-[#222736] hover:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode selection buttons grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredScales.map((scale) => {
                const isSelected = selectedScaleId === scale.id;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    id={`btn-scale-mode-${scale.id}`}
                    onClick={() => {
                      setSelectedScaleId(scale.id);
                      // play brief scale preview
                      const notes = getScaleNotesForRoot(selectedRoot, scale);
                      if (notes.length > 0) {
                        audioEngine.playSingleNote(notes[0].pitchWithOctave, instrument, 0.4, 0.8);
                      }
                    }}
                    className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1e2436] text-slate-100 border-amber-500/70 shadow-xs'
                        : 'bg-[#161a25] hover:bg-[#1e2230] text-slate-300 border-[#242a3a] hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-xs text-slate-100">{scale.name}</h4>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-none"></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-light mt-0.5 line-clamp-1">
                        {scale.mood}
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-[#23293a] flex items-center justify-between text-[10px]">
                      <span className="font-mono text-amber-400/90 font-medium">
                        {scale.characteristicIntervalLabel.split(' ')[0]}
                      </span>
                      <span className="text-slate-500 text-[9px] font-mono">
                        {scale.intervals.length} notas
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Detailed Scale Analysis & Display Card */}
          <div className="bg-[#10131a] border border-[#232a3c] p-3.5 md:p-4 space-y-4">
            {/* Active Scale Title Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c2232] pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-slate-100 font-mono">
                    {selectedRoot} {activeScale.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-sans">
                    ({currentRootOption.solfege} {activeScale.englishName})
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/50">
                    {activeScale.categoryLabel}
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-light mt-0.5">
                  ✨ {activeScale.mood}
                </p>
              </div>

              {/* Listen to Scale Button */}
              <button
                type="button"
                id="btn-listen-scale-full"
                onClick={handlePlayFullScale}
                disabled={isPlayingFullScale}
                className={`flex items-center gap-2 px-3.5 py-1.5 font-medium text-xs border shadow-xs transition-all active:translate-y-0.5 ${
                  isPlayingFullScale
                    ? 'bg-amber-600/80 text-amber-100 border-amber-500/70 animate-pulse'
                    : 'bg-emerald-700/80 hover:bg-emerald-600/80 text-emerald-100 border-emerald-500/60'
                }`}
                title="Tocar todas as notas da escala sequencialmente"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPlayingFullScale ? 'Tocando Escala...' : 'Ouvir Escala'}</span>
              </button>
            </div>

            {/* Scale Notes & Interval Structure Cards */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  Notas & Estrutura Intervalar:
                </span>
                <span className="text-[11px] text-slate-500">
                  (Clique em qualquer nota para ouvir)
                </span>
              </div>

              {/* Interactive Horizontal Note Cards */}
              <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-8 gap-2">
                {scaleNotes.map((item, idx) => {
                  const isPlaying = playingNoteIndex === idx;
                  return (
                    <button
                      key={`${item.note}-${idx}`}
                      type="button"
                      id={`btn-scale-note-${item.note}-${idx}`}
                      onClick={() => handlePlayNote(item, idx)}
                      className={`p-2.5 text-center border transition-all cursor-pointer flex flex-col items-center justify-between active:scale-95 ${
                        isPlaying
                          ? 'bg-amber-500/25 text-white border-amber-400 ring-1 ring-amber-400 shadow-md'
                          : item.isRoot
                          ? 'bg-[#1e273a] text-slate-100 border-indigo-500/70 font-semibold'
                          : item.isCharacteristic
                          ? 'bg-[#222129] text-amber-200 border-amber-500/50'
                          : 'bg-[#151924] hover:bg-[#1d2232] text-slate-200 border-[#242b3d]'
                      }`}
                      title={`${item.note} (${item.solfege}) - Intervalo: ${item.intervalFullName} (${item.stepFromPrev} do anterior)`}
                    >
                      {/* Interval Degree Label */}
                      <span
                        className={`text-[10px] font-mono px-1 py-0.2 mb-1 ${
                          item.isRoot
                            ? 'text-indigo-300 font-bold'
                            : item.isCharacteristic
                            ? 'text-amber-300 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.intervalName}
                      </span>

                      {/* Main Note Name */}
                      <span className="text-sm font-bold font-mono tracking-tight text-white">
                        {item.note}
                      </span>

                      {/* Solfège Name */}
                      <span className="text-[10px] text-slate-400 font-sans">
                        {item.solfege}
                      </span>

                      {/* Step progression (e.g. 1T / 1/2T) */}
                      <span className="text-[9px] font-mono text-slate-500 mt-1 border-t border-[#232a3c] pt-1 w-full text-center">
                        {idx === 0 ? 'Tônica' : item.stepFromPrev}
                      </span>
                    </button>
                  );
                })}

                {/* Octave Root Card for completion */}
                <button
                  type="button"
                  id={`btn-scale-octave-root`}
                  onClick={() => {
                    setPlayingNoteIndex(0);
                    audioEngine.playSingleNote(`${scaleNotes[0].note}5`, instrument, 0.8, 0.85);
                    setTimeout(() => setPlayingNoteIndex(null), 450);
                  }}
                  className="p-2.5 text-center border border-[#242b3d] bg-[#151924] hover:bg-[#1d2232] text-slate-300 transition-all cursor-pointer flex flex-col items-center justify-between active:scale-95"
                  title={`Oitava superior de ${scaleNotes[0].note}`}
                >
                  <span className="text-[10px] font-mono text-indigo-300 font-bold mb-1">
                    8ª (T)
                  </span>
                  <span className="text-sm font-bold font-mono tracking-tight text-white">
                    {scaleNotes[0].note}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {scaleNotes[0].solfege}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 border-t border-[#232a3c] pt-1 w-full text-center">
                    {activeScale.stepPattern[activeScale.stepPattern.length - 1] || '½T'}
                  </span>
                </button>
              </div>
            </div>

            {/* Formula & Theory Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Formula & Intervals */}
              <div className="bg-[#151924] border border-[#232a3c] p-3 space-y-2">
                <h4 className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estrutura dos Intervalos & Passos</span>
                </h4>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Passos (Tons/Semitons):</span>
                    <span className="font-mono text-slate-200 font-medium bg-[#1a2030] px-2 py-0.5 border border-[#2a344c]">
                      {activeScale.stepPattern.join(' - ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Semitons a partir da Tônica:</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {activeScale.intervals.join(' - ')} st
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#232a3c]">
                    <span className="text-slate-400">Nota Característica:</span>
                    <span className="font-medium text-amber-300 text-right">
                      {activeScale.characteristicIntervalLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chords and Harmonic Application */}
              <div className="bg-[#151924] border border-[#232a3c] p-3 space-y-2">
                <h4 className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Acordes Onde Usar & Harmonização</span>
                </h4>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Acordes Ideais:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {activeScale.chordsCompatible.map((chord) => (
                        <span
                          key={chord}
                          className="px-1.5 py-0.2 bg-[#1c2232] border border-[#2b354e] font-mono text-amber-300 font-medium text-[10px]"
                        >
                          {selectedRoot}{chord.startsWith('X') ? chord.slice(1) : chord}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#232a3c]">
                    <span className="text-slate-400">Tríades do Campo:</span>
                    <span className="font-mono text-slate-300 text-right">
                      {activeScale.triadsFormula.join(' - ')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Tétrades do Campo:</span>
                    <span className="font-mono text-slate-300 text-right text-[10px]">
                      {activeScale.tetradsFormula.join(' - ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation, Improvisation Tips & Famous Examples */}
            <div className="space-y-2 text-xs bg-[#131722] border border-[#202738] p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-slate-200 font-normal leading-relaxed">
                    {activeScale.description}
                  </p>
                  <p className="text-slate-400 font-light leading-relaxed">
                    <strong className="text-indigo-300 font-medium">Dica de Improvisação:</strong>{' '}
                    {activeScale.soloingTips}
                  </p>
                  {activeScale.famousExamples && (
                    <p className="text-slate-400 font-light text-[11px] pt-1 border-t border-[#1e2638]">
                      <strong className="text-amber-400/90 font-medium">Exemplos Famosos:</strong>{' '}
                      {activeScale.famousExamples}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Fretboard and Piano Visualizer for the Scale */}
            <div className="space-y-2 pt-2 border-t border-[#1c2232]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Visualizar Digitação no Instrumento:</span>
                </span>

                <div className="inline-flex p-0.5 bg-[#171b26] border border-[#242b3c] text-xs">
                  <button
                    type="button"
                    onClick={() => setVisualizerMode('piano')}
                    className={`px-2.5 py-1 transition-all ${
                      visualizerMode === 'piano'
                        ? 'bg-[#22293b] text-slate-100 border border-indigo-500/50 font-medium'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    🎹 Teclado do Piano
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualizerMode('guitar')}
                    className={`px-2.5 py-1 transition-all ${
                      visualizerMode === 'guitar'
                        ? 'bg-[#22293b] text-slate-100 border border-indigo-500/50 font-medium'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    🎸 Braço do Violão
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualizerMode('none')}
                    className={`px-2 py-1 transition-all ${
                      visualizerMode === 'none'
                        ? 'bg-[#22293b] text-slate-100 border border-indigo-500/50 font-medium'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Ocultar braço/teclado para economizar espaço"
                  >
                    Ocultar
                  </button>
                </div>
              </div>

              {visualizerMode === 'piano' && (
                <div className="p-2 bg-[#0d1017] border border-[#1e2538] overflow-x-auto">
                  <PianoScaleKeyboard
                    rootNote={selectedRoot}
                    scaleSemitones={scaleSemitones}
                    instrument={instrument}
                    onPlayNote={(noteStr, inst) => audioEngine.playSingleNote(noteStr, inst, 0.8, 0.85)}
                  />
                </div>
              )}

              {visualizerMode === 'guitar' && (
                <div className="p-2 bg-[#0d1017] border border-[#1e2538] overflow-x-auto">
                  <GuitarScaleFretboard
                    rootNote={selectedRoot}
                    scaleSemitones={scaleSemitones}
                    instrument={instrument}
                    onPlayNote={(noteStr, inst) => audioEngine.playSingleNote(noteStr, inst, 0.8, 0.85)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

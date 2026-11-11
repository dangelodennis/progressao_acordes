import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChordDefinition,
  Genre,
  InstrumentType,
  MelodyNote,
  MelodyStyle,
  TimelineChordItem,
  SavedMelodyConfig,
  BackingTrackStyle,
} from '../types';
import { audioEngine } from '../utils/audioPlayer';
import {
  generateMelodySuggestions,
  detectKeyFromChords,
  getScaleSemitones,
  ScalePresetType,
  SCALE_LABELS,
  getSemitone,
} from '../utils/melodyGenerator';
import { GuitarScaleFretboard } from './GuitarScaleFretboard';
import { PianoScaleKeyboard } from './PianoScaleKeyboard';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Music,
  Sliders,
  Layers,
  ChevronDown,
  Volume2,
  Download,
} from 'lucide-react';

interface MelodySuggestionPanelProps {
  timeline: TimelineChordItem[];
  selectedGenre: Genre;
  tempoBpm: number;
  chordInstrument: InstrumentType;
  inspectedChord?: ChordDefinition;
  loadedMelody?: SavedMelodyConfig | null;
  onMelodyChange?: (melody: SavedMelodyConfig) => void;
  onOpenExportMidi?: () => void;
}

export const MelodySuggestionPanel: React.FC<MelodySuggestionPanelProps> = ({
  timeline,
  selectedGenre,
  tempoBpm,
  chordInstrument,
  inspectedChord,
  loadedMelody,
  onMelodyChange,
  onOpenExportMidi,
}) => {
  // Visualizer Mode: 'guitar' or 'piano'
  const [visualizerMode, setVisualizerMode] = useState<'guitar' | 'piano'>('guitar');

  // Selected Melody Style
  const [selectedStyle, setSelectedStyle] = useState<MelodyStyle>('lyrical');

  // Melody Instrument (can differ from chord accompaniment instrument)
  const [melodyInstrument, setMelodyInstrument] = useState<InstrumentType>('guitar');

  // Melody Octave Offset (-1, 0, +1)
  const [melodyOctaveOffset, setMelodyOctaveOffset] = useState<number>(0);

  // Variation seed for regeneration
  const [variationSeed, setVariationSeed] = useState<number>(0);

  // Scale display options
  const [selectedScaleType, setSelectedScaleType] = useState<ScalePresetType>('major');
  const [scaleScope, setScaleScope] = useState<'key' | 'chord'>('key');

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<'both' | 'melody_only'>('both');
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null);

  // Collapsible toggle for compact view if needed
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Sync loaded melody when user loads a saved progression
  const lastLoadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedMelody && loadedMelody.id !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = loadedMelody.id;
      if (loadedMelody.style) setSelectedStyle(loadedMelody.style);
      if (loadedMelody.instrument) setMelodyInstrument(loadedMelody.instrument);
      if (typeof loadedMelody.octaveOffset === 'number') setMelodyOctaveOffset(loadedMelody.octaveOffset);
      if (typeof loadedMelody.variationSeed === 'number') setVariationSeed(loadedMelody.variationSeed);
      if (loadedMelody.scaleType) setSelectedScaleType(loadedMelody.scaleType as ScalePresetType);
    }
  }, [loadedMelody]);

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopMelody();
    };
  }, []);

  // Detect key from timeline (or fallback to inspectedChord or C)
  const effectiveTimeline = useMemo(() => {
    if (timeline.length > 0) return timeline;
    if (inspectedChord) {
      return [
        {
          id: 'temp-1',
          chord: inspectedChord,
          durationBeats: 4,
          genreContext: selectedGenre,
          octaveOffset: 0,
        },
      ];
    }
    return [];
  }, [timeline, inspectedChord, selectedGenre]);

  const chords = useMemo(() => effectiveTimeline.map((t) => t.chord), [effectiveTimeline]);
  const detectedKey = useMemo(() => detectKeyFromChords(chords), [chords]);

  // Adjust default scale type based on key mode
  useEffect(() => {
    if (detectedKey.isMinor) {
      setSelectedScaleType('minor');
    } else {
      setSelectedScaleType('major');
    }
  }, [detectedKey.isMinor, detectedKey.root]);

  // Generate 5 melody suggestions for the current progression
  const melodySuggestions = useMemo(() => {
    return generateMelodySuggestions(effectiveTimeline, selectedGenre, variationSeed);
  }, [effectiveTimeline, selectedGenre, variationSeed]);

  // Current selected suggestion
  const currentSuggestion = useMemo(() => {
    return (
      melodySuggestions.find((s) => s.style === selectedStyle) ||
      melodySuggestions[0] ||
      null
    );
  }, [melodySuggestions, selectedStyle]);

  // Keep parent in sync for saving progression with melody (guarded against feedback loops)
  const lastEmittedRef = useRef<string>('');

  useEffect(() => {
    if (currentSuggestion && onMelodyChange) {
      // Create a stable fingerprint to prevent cyclical re-renders
      const fingerprint = `${currentSuggestion.id}-${selectedStyle}-${melodyInstrument}-${melodyOctaveOffset}-${variationSeed}-${selectedScaleType}`;
      if (lastEmittedRef.current === fingerprint) {
        return;
      }
      lastEmittedRef.current = fingerprint;

      onMelodyChange({
        id: currentSuggestion.id,
        name: currentSuggestion.name,
        style: selectedStyle,
        instrument: melodyInstrument,
        octaveOffset: melodyOctaveOffset,
        variationSeed,
        notes: currentSuggestion.notes,
        totalBeats: currentSuggestion.totalBeats,
        tags: currentSuggestion.tags,
        scaleType: selectedScaleType,
      });
    }
  }, [
    currentSuggestion,
    selectedStyle,
    melodyInstrument,
    melodyOctaveOffset,
    variationSeed,
    selectedScaleType,
    onMelodyChange,
  ]);

  // Currently playing melody note object
  const currentPlayingNote = useMemo(() => {
    if (
      activeNoteIndex !== null &&
      currentSuggestion &&
      currentSuggestion.notes[activeNoteIndex]
    ) {
      return currentSuggestion.notes[activeNoteIndex];
    }
    return null;
  }, [activeNoteIndex, currentSuggestion]);

  // Active chord being accompanied
  const currentAccompanimentChord = useMemo(() => {
    if (activeChordIndex !== null && effectiveTimeline[activeChordIndex]) {
      return effectiveTimeline[activeChordIndex].chord;
    }
    if (inspectedChord) return inspectedChord;
    if (effectiveTimeline[0]) return effectiveTimeline[0].chord;
    return undefined;
  }, [activeChordIndex, effectiveTimeline, inspectedChord]);

  // Scale root and semitones for the visualizer
  const { displayRoot, scaleSemitones } = useMemo(() => {
    let root = detectedKey.root;
    let type = selectedScaleType;

    if (scaleScope === 'chord' && currentAccompanimentChord) {
      root = currentAccompanimentChord.root;
      // If chord is minor, use minor scale or dorian
      if (
        currentAccompanimentChord.quality === 'minor' ||
        currentAccompanimentChord.quality === 'm7'
      ) {
        type = selectedScaleType === 'major' ? 'minor' : selectedScaleType;
      }
    }

    const semitones = getScaleSemitones(root, type);
    return { displayRoot: root, scaleSemitones: semitones };
  }, [detectedKey.root, selectedScaleType, scaleScope, currentAccompanimentChord]);

  // Handle Playback: Melody + Chords synchronized
  const handlePlayWithChords = () => {
    if (isPlaying) {
      handleStop();
      return;
    }
    if (!currentSuggestion || effectiveTimeline.length === 0) return;

    setIsPlaying(true);
    setPlaybackMode('both');

    let backingStyle: BackingTrackStyle = 'none';
    try {
      const saved = localStorage.getItem('harmoniq_backing_style');
      if (saved && ['rock', 'funk', 'reggae', 'shuffle', 'disco', 'bossa', 'punk', 'techno'].includes(saved)) {
        backingStyle = saved as BackingTrackStyle;
      }
    } catch {
      // ignore
    }

    audioEngine.playMelodyWithChords(
      currentSuggestion.notes,
      effectiveTimeline,
      tempoBpm,
      melodyInstrument,
      chordInstrument,
      (noteIdx, chordIdx) => {
        if (noteIdx !== null) setActiveNoteIndex(noteIdx);
        if (chordIdx !== null) setActiveChordIndex(chordIdx);
      },
      () => {
        setIsPlaying(false);
        setActiveNoteIndex(null);
        setActiveChordIndex(null);
      },
      melodyOctaveOffset,
      0,
      backingStyle,
      audioEngine.getBackingVolume()
    );
  };

  // Handle Playback: Melody Solo
  const handlePlayMelodySolo = () => {
    if (isPlaying) {
      handleStop();
      return;
    }
    if (!currentSuggestion) return;

    setIsPlaying(true);
    setPlaybackMode('melody_only');

    audioEngine.playMelody(
      currentSuggestion.notes,
      tempoBpm,
      melodyInstrument,
      (noteIdx) => {
        setActiveNoteIndex(noteIdx);
        if (noteIdx !== null && currentSuggestion.notes[noteIdx]) {
          setActiveChordIndex(currentSuggestion.notes[noteIdx].chordIndex);
        }
      },
      () => {
        setIsPlaying(false);
        setActiveNoteIndex(null);
        setActiveChordIndex(null);
      },
      melodyOctaveOffset
    );
  };

  // Stop playback
  const handleStop = () => {
    audioEngine.stopAll();
    setIsPlaying(false);
    setActiveNoteIndex(null);
    setActiveChordIndex(null);
  };

  // Play single note preview when user clicks on melody note pill or fretboard/piano
  const handlePlaySingleNote = (noteStr: string, inst: InstrumentType = melodyInstrument) => {
    audioEngine.playSingleNote(noteStr, inst, 0.5, 0.8, melodyOctaveOffset);
  };

  // Regenerate variation
  const handleRegenerateVariation = () => {
    handleStop();
    setVariationSeed((prev) => prev + 1);
  };

  return (
    <div
      id="melody-suggestion-panel"
      className="bg-[#12151d] border border-[#232836] rounded-none p-3.5 sm:p-4 shadow-sm"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202534] flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#181c28] border border-[#252c40] text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-200">
                Sugestão de Melodias & Escala do Acompanhamento
              </h3>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-none bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                Tonalidade: {detectedKey.root} {detectedKey.isMinor ? 'Menor' : 'Maior'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Melodias guiadas para a harmonia com visualização completa das notas da escala no braço ou teclado
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-none text-slate-400 hover:text-slate-200 border border-[#232836] hover:bg-[#181c26] transition-colors"
          title={isExpanded ? 'Recolher Painel' : 'Expandir Painel'}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-3.5">
          {/* Style Selector Tabs & Variation Generator */}
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            {/* Melody Style Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
              {melodySuggestions.map((sug) => {
                const isSelected = selectedStyle === sug.style;
                return (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => {
                      if (isPlaying) handleStop();
                      setSelectedStyle(sug.style);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-none border transition-all flex items-center gap-1.5 whitespace-nowrap active:translate-y-0.5 ${
                      isSelected
                        ? 'bg-[#1e2332] text-slate-100 border-indigo-500/60 shadow-xs'
                        : 'bg-[#141722] hover:bg-[#1b202e] text-slate-400 border-[#232836]'
                    }`}
                  >
                    <Music className="w-3 h-3 text-indigo-400/80" />
                    <span>{sug.name.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Random variation generator button */}
              <button
                type="button"
                onClick={handleRegenerateVariation}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-[#161924] hover:bg-[#1d2232] text-slate-300 text-xs font-light border border-[#262c3e] transition-colors active:translate-y-0.5"
                title="Gerar uma nova variação melódica para esta progressão"
              >
                <RotateCcw className="w-3 h-3 text-amber-400/80" />
                <span>Nova Variação</span>
              </button>

              {/* Quick MIDI export button for melody + harmony */}
              {onOpenExportMidi && (
                <button
                  type="button"
                  onClick={onOpenExportMidi}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-normal border border-indigo-700/50 transition-colors active:translate-y-0.5"
                  title="Exportar esta melodia e progressão como MIDI (.mid)"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>Exportar MIDI</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Melody Description & Controls */}
          {currentSuggestion && (
            <div className="bg-[#0f1118] border border-[#202534] p-3 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-medium text-slate-200">
                    {currentSuggestion.name}
                  </h4>
                  {currentSuggestion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-light px-1.5 py-0.5 rounded-none bg-[#161a26] text-slate-400 border border-[#242b3c]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-light">
                  {currentSuggestion.description}
                </p>
              </div>

              {/* Playback action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Play Both (Melody + Chords) */}
                <button
                  type="button"
                  onClick={handlePlayWithChords}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border transition-all active:translate-y-0.5 ${
                    isPlaying && playbackMode === 'both'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-indigo-600/80 hover:bg-indigo-500/80 text-white border-indigo-500/50 shadow-xs'
                  }`}
                  title="Tocar a melodia junto com o acompanhamento dos acordes"
                >
                  {isPlaying && playbackMode === 'both' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tocar Melodia + Acordes</span>
                    </>
                  )}
                </button>

                {/* Play Melody Only */}
                <button
                  type="button"
                  onClick={handlePlayMelodySolo}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-none border transition-all active:translate-y-0.5 ${
                    isPlaying && playbackMode === 'melody_only'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-[#181d28] hover:bg-[#202636] text-slate-300 border-[#283042]'
                  }`}
                  title="Ouvir somente a linha melódica isolada"
                >
                  {isPlaying && playbackMode === 'melody_only' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400/80" />
                      <span>Apenas Melodia</span>
                    </>
                  )}
                </button>

                {/* Settings dropdowns: Instrument & Octave */}
                <div className="flex items-center gap-1 border-l border-[#242b3c] pl-2 text-xs">
                  {/* Melody Instrument */}
                  <select
                    value={melodyInstrument}
                    onChange={(e) => setMelodyInstrument(e.target.value as InstrumentType)}
                    className="bg-[#141722] text-slate-300 border border-[#232836] px-2 py-1 text-xs rounded-none outline-none font-light"
                    title="Instrumento da Melodia"
                  >
                    <option value="guitar">🎸 Violão / Guitarra</option>
                    <option value="piano">🎹 Teclado / Piano</option>
                  </select>

                  {/* Melody Octave Offset */}
                  <div className="flex rounded-none border border-[#232836] overflow-hidden text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMelodyOctaveOffset(-1)}
                      className={`px-1.5 py-1 transition-colors ${
                        melodyOctaveOffset === -1
                          ? 'bg-[#202636] text-slate-200'
                          : 'bg-[#141722] text-slate-400 hover:text-slate-300'
                      }`}
                      title="Oitava Mais Grave (-1)"
                    >
                      -8va
                    </button>
                    <button
                      type="button"
                      onClick={() => setMelodyOctaveOffset(0)}
                      className={`px-1.5 py-1 transition-colors border-x border-[#232836] ${
                        melodyOctaveOffset === 0
                          ? 'bg-[#202636] text-slate-200'
                          : 'bg-[#141722] text-slate-400 hover:text-slate-300'
                      }`}
                      title="Oitava Normal"
                    >
                      Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => setMelodyOctaveOffset(1)}
                      className={`px-1.5 py-1 transition-colors ${
                        melodyOctaveOffset === 1
                          ? 'bg-[#202636] text-slate-200'
                          : 'bg-[#141722] text-slate-400 hover:text-slate-300'
                      }`}
                      title="Oitava Mais Aguda (+1)"
                    >
                      +8va
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Melody Step Strip (Notas da Melodia no Tempo) */}
          {currentSuggestion && currentSuggestion.notes.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-light">
                <span>Passo a Passo da Melodia (clique em qualquer nota para testar):</span>
                <span>
                  {currentSuggestion.notes.length} notas •{' '}
                  {currentSuggestion.totalBeats} tempos ({tempoBpm} BPM)
                </span>
              </div>

              {/* Scrollable notes timeline strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5">
                {currentSuggestion.notes.map((noteItem, nIdx) => {
                  const isNoteActive = activeNoteIndex === nIdx;
                  const isChordActive = activeChordIndex === noteItem.chordIndex;
                  const chordObj = effectiveTimeline[noteItem.chordIndex]?.chord;

                  return (
                    <button
                      key={noteItem.id}
                      type="button"
                      onClick={() => {
                        setActiveNoteIndex(nIdx);
                        setActiveChordIndex(noteItem.chordIndex);
                        handlePlaySingleNote(noteItem.note);
                      }}
                      className={`px-2.5 py-2 rounded-none border text-left flex flex-col transition-all cursor-pointer select-none shrink-0 ${
                        isNoteActive
                          ? 'bg-amber-400 text-slate-950 font-medium scale-105 shadow-sm border-amber-300 ring-1 ring-amber-300'
                          : isChordActive
                          ? 'bg-[#1c2230] text-slate-200 border-indigo-500/50'
                          : 'bg-[#141722] hover:bg-[#191d2a] text-slate-300 border-[#222736]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-normal text-sm">{noteItem.noteName}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-none ${
                            isNoteActive
                              ? 'bg-black/20 text-slate-900'
                              : 'bg-[#0f1118] text-slate-400 border border-[#202534]'
                          }`}
                        >
                          {noteItem.degree || 'Nota'}
                        </span>
                      </div>
                      <div
                        className={`text-[9px] mt-0.5 font-light ${
                          isNoteActive ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {chordObj ? chordObj.symbol : `C${noteItem.chordIndex + 1}`} • {noteItem.durationBeats}t
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scale Visualizer Section: Guitar Fretboard OR Piano Keyboard */}
          <div className="space-y-3 pt-2 border-t border-[#202534]">
            {/* Visualizer Top Bar: View Mode Switch (Guitar vs Piano) and Scale Selector */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-200">
                  Visualização das Notas da Escala:
                </span>
                {/* Switch between Guitar Neck and Piano Keyboard */}
                <div className="flex rounded-none border border-[#232836] overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setVisualizerMode('guitar')}
                    className={`px-3 py-1 transition-colors flex items-center gap-1.5 ${
                      visualizerMode === 'guitar'
                        ? 'bg-[#1e2332] text-slate-100'
                        : 'bg-[#12151d] text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>🎸 Braço da Guitarra / Violão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualizerMode('piano')}
                    className={`px-3 py-1 transition-colors border-l border-[#232836] flex items-center gap-1.5 ${
                      visualizerMode === 'piano'
                        ? 'bg-[#1e2332] text-slate-100'
                        : 'bg-[#12151d] text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>🎹 Teclado / Piano</span>
                  </button>
                </div>
              </div>

              {/* Scale Formula Selector & Scope */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Scope: Key Scale vs Current Chord Scale */}
                <div className="flex rounded-none border border-[#232836] overflow-hidden text-[10px]">
                  <button
                    type="button"
                    onClick={() => setScaleScope('key')}
                    className={`px-2 py-1 transition-colors ${
                      scaleScope === 'key'
                        ? 'bg-[#202636] text-slate-200'
                        : 'bg-[#141722] text-slate-400 hover:text-slate-300'
                    }`}
                    title="Escala da Tonalidade Geral"
                  >
                    Tonalidade ({detectedKey.root})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScaleScope('chord')}
                    className={`px-2 py-1 transition-colors border-l border-[#232836] ${
                      scaleScope === 'chord'
                        ? 'bg-[#202636] text-slate-200'
                        : 'bg-[#141722] text-slate-400 hover:text-slate-300'
                    }`}
                    title="Escala centrada no acorde em reprodução"
                  >
                    Acorde Atual ({currentAccompanimentChord?.symbol || detectedKey.root})
                  </button>
                </div>

                {/* Scale Preset Formula */}
                <select
                  value={selectedScaleType}
                  onChange={(e) => setSelectedScaleType(e.target.value as ScalePresetType)}
                  className="bg-[#141722] text-slate-300 border border-[#232836] px-2 py-1 text-xs rounded-none outline-none font-light"
                  title="Fórmula da Escala Melódica"
                >
                  <option value="major">Maior Natural (7 notas)</option>
                  <option value="minor">Menor Natural (7 notas)</option>
                  <option value="pentatonic_major">Pentatônica Maior (5 notas)</option>
                  <option value="pentatonic_minor">Pentatônica Menor (5 notas)</option>
                  <option value="blues">Escala Blues (6 notas)</option>
                  <option value="dorian">Dórico (Modo Menor)</option>
                  <option value="mixolydian">Mixolídio (Dominante)</option>
                </select>
              </div>
            </div>

            {/* Active Scale Info Banner */}
            <div className="bg-[#10131a] border border-[#202534] px-3 py-1.5 rounded-none flex items-center justify-between text-xs text-slate-400 font-light flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-normal">
                  Escala em exibição: {displayRoot} {SCALE_LABELS[selectedScaleType]}
                </span>
                <span className="text-[10px] text-slate-400">
                  (Notas:{' '}
                  {scaleSemitones
                    .map((st) => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][st])
                    .join(' - ')}
                  )
                </span>
              </div>
              {currentPlayingNote && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-normal animate-pulse">
                  <span>Nota Atual na Melodia:</span>
                  <span className="px-1.5 py-0.5 bg-amber-400/20 border border-amber-500/40 rounded-none font-medium">
                    {currentPlayingNote.note} ({currentPlayingNote.degree})
                  </span>
                </div>
              )}
            </div>

            {/* Render selected Instrument Fretboard / Keyboard */}
            {visualizerMode === 'guitar' ? (
              <GuitarScaleFretboard
                rootNote={displayRoot}
                scaleSemitones={scaleSemitones}
                activeChord={currentAccompanimentChord}
                activeMelodyMidi={currentPlayingNote ? currentPlayingNote.midi : null}
                onPlayNote={handlePlaySingleNote}
                instrument={melodyInstrument}
              />
            ) : (
              <PianoScaleKeyboard
                rootNote={displayRoot}
                scaleSemitones={scaleSemitones}
                activeChord={currentAccompanimentChord}
                activeMelodyMidi={currentPlayingNote ? currentPlayingNote.midi : null}
                onPlayNote={handlePlaySingleNote}
                instrument={melodyInstrument}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

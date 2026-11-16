import React, { useState, useMemo, useEffect } from 'react';
import {
  ChordDefinition,
  Genre,
  InstrumentType,
  MelodyNote,
  TimelineChordItem,
} from '../types';
import {
  ROOT_KEY_OPTIONS,
  SCALE_DICTIONARY_DATABASE,
} from '../data/scaleDictionary';
import {
  analyzeProgressionForImprovisation,
  detectBestScaleForProgression,
  MelodicPhraseSuggestion,
  RhythmicPatternSuggestion,
} from '../utils/improvisationGuide';
import { audioEngine } from '../utils/audioPlayer';
import {
  Compass,
  Play,
  Square,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Volume2,
  Target,
  Activity,
  Music,
  Wand2,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ImprovisationGuidePanelProps {
  timeline: TimelineChordItem[];
  selectedGenre: Genre;
  tempoBpm: number;
  instrument: InstrumentType;
  inspectedChord?: ChordDefinition;
  selectedTimelineIndex: number | null;
  selectedScaleRoot: string;
  selectedScaleId: string;
  onScaleRootChange: (root: string) => void;
  onScaleIdChange: (scaleId: string) => void;
  onSelectTimelineIndex?: (index: number) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const ImprovisationGuidePanel: React.FC<ImprovisationGuidePanelProps> = ({
  timeline,
  selectedGenre,
  tempoBpm,
  instrument,
  inspectedChord,
  selectedTimelineIndex,
  selectedScaleRoot,
  selectedScaleId,
  onScaleRootChange,
  onScaleIdChange,
  onSelectTimelineIndex,
  isExpanded: controlledExpanded,
  onToggleExpanded,
}) => {
  const [internalExpanded, setInternalExpanded] = useState<boolean>(true);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const handleToggleExpanded = () => {
    if (onToggleExpanded) onToggleExpanded();
    else setInternalExpanded((prev) => !prev);
  };
  const [variationSeed, setVariationSeed] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'all' | 'focus'>('focus');
  const [focusedChordIdx, setFocusedChordIdx] = useState<number>(0);
  const [detectionNote, setDetectionNote] = useState<string | null>(null);
  const [collapsedCardKeys, setCollapsedCardKeys] = useState<Record<string, boolean>>({});

  const toggleCardCollapsed = (cardKey: string) => {
    setCollapsedCardKeys((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // Playback state
  const [playingTargetId, setPlayingTargetId] = useState<string | null>(null);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [activeFullChordIdx, setActiveFullChordIdx] = useState<number | null>(null);

  // Use timeline or fallback to inspectedChord if timeline is temporarily empty
  const effectiveTimeline = useMemo<TimelineChordItem[]>(() => {
    if (timeline.length > 0) return timeline;
    if (inspectedChord) {
      return [
        {
          id: 'guide-fallback',
          chord: inspectedChord,
          durationBeats: 4,
          genreContext: selectedGenre,
          octaveOffset: 0,
        },
      ];
    }
    return [];
  }, [timeline, inspectedChord, selectedGenre]);

  useEffect(() => {
    if (
      selectedTimelineIndex !== null &&
      selectedTimelineIndex >= 0 &&
      selectedTimelineIndex < effectiveTimeline.length
    ) {
      setFocusedChordIdx(selectedTimelineIndex);
    } else {
      setFocusedChordIdx((prev) => (prev >= effectiveTimeline.length ? 0 : prev));
    }
  }, [selectedTimelineIndex, effectiveTimeline.length]);

  useEffect(() => {
    return () => {
      audioEngine.stopMelody();
    };
  }, []);

  // Run progression + selected scale analysis
  const analysis = useMemo(() => {
    return analyzeProgressionForImprovisation(
      effectiveTimeline,
      selectedScaleRoot,
      selectedScaleId,
      selectedGenre,
      variationSeed
    );
  }, [effectiveTimeline, selectedScaleRoot, selectedScaleId, selectedGenre, variationSeed]);

  const stopPlayback = () => {
    audioEngine.stopAll();
    setPlayingTargetId(null);
    setActiveNoteIdx(null);
    setActiveFullChordIdx(null);
  };

  // Detect & apply best scale for the current chord progression
  const handleDetectBestScale = () => {
    const detected = detectBestScaleForProgression(effectiveTimeline, selectedGenre);
    onScaleRootChange(detected.root);
    onScaleIdChange(detected.scaleId);
    setDetectionNote(detected.reason);
    window.setTimeout(() => {
      setDetectionNote(null);
    }, 4500);
  };

  // Play a rhythmic pattern demo using the chord's primary target note
  const handlePlayRhythmPattern = (
    chordItem: TimelineChordItem,
    pattern: RhythmicPatternSuggestion,
    targetNoteName: string
  ) => {
    if (playingTargetId === pattern.id) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setPlayingTargetId(pattern.id);

    const demoNotes: MelodyNote[] = pattern.hitStarts.map((start, idx) => ({
      id: `${pattern.id}-demo-${idx}`,
      note: `${targetNoteName}4`,
      noteName: targetNoteName,
      octave: 4,
      midi: 60,
      durationBeats: pattern.hitDurations[idx] || 0.5,
      startBeat: start,
      chordIndex: 0,
      role: 'root',
    }));

    audioEngine.playMelodyWithChords(
      demoNotes,
      [{ ...chordItem, durationBeats: chordItem.durationBeats || 4 }],
      tempoBpm,
      instrument,
      instrument,
      (nIdx) => {
        setActiveNoteIdx(nIdx);
      },
      () => {
        setPlayingTargetId(null);
        setActiveNoteIdx(null);
      },
      0,
      chordItem.octaveOffset ?? 0
    );
  };

  // Play a short melodic phrase (solo or with backing chord)
  const handlePlayPhrase = (
    chordItem: TimelineChordItem,
    phrase: MelodicPhraseSuggestion,
    withChord: boolean
  ) => {
    const playKey = `${phrase.id}-${withChord ? 'chord' : 'solo'}`;
    if (playingTargetId === playKey) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setPlayingTargetId(playKey);

    const localNotes: MelodyNote[] = phrase.notes.map((n) => ({
      ...n,
      chordIndex: 0,
    }));

    if (withChord) {
      audioEngine.playMelodyWithChords(
        localNotes,
        [{ ...chordItem, durationBeats: phrase.totalBeats || 4 }],
        tempoBpm,
        instrument,
        instrument,
        (nIdx) => {
          setActiveNoteIdx(nIdx);
        },
        () => {
          setPlayingTargetId(null);
          setActiveNoteIdx(null);
        },
        0,
        chordItem.octaveOffset ?? 0
      );
    } else {
      audioEngine.playMelody(
        localNotes,
        tempoBpm,
        instrument,
        (nIdx) => {
          setActiveNoteIdx(nIdx);
        },
        () => {
          setPlayingTargetId(null);
          setActiveNoteIdx(null);
        },
        0
      );
    }
  };

  // Play full progression combining one phrase per chord cleanly
  const handlePlayFullGuide = () => {
    if (playingTargetId === 'full-guide') {
      stopPlayback();
      return;
    }
    if (analysis.chordGuides.length === 0) return;

    stopPlayback();
    setPlayingTargetId('full-guide');

    const combinedNotes: MelodyNote[] = [];
    let offsetBeats = 0;

    analysis.chordGuides.forEach((guide, cIdx) => {
      // Alternate between Target, Modal, and Bridge phrases across chords for musical variety
      const phrase = guide.phrases[cIdx % guide.phrases.length] || guide.phrases[0];
      if (phrase) {
        phrase.notes.forEach((n) => {
          combinedNotes.push({
            ...n,
            chordIndex: cIdx,
            startBeat: n.startBeat + offsetBeats,
          });
        });
      }
      offsetBeats += guide.item.durationBeats || 4;
    });

    audioEngine.playMelodyWithChords(
      combinedNotes,
      effectiveTimeline,
      tempoBpm,
      instrument,
      instrument,
      (nIdx, cIdx) => {
        setActiveNoteIdx(nIdx);
        setActiveFullChordIdx(cIdx);
      },
      () => {
        setPlayingTargetId(null);
        setActiveNoteIdx(null);
        setActiveFullChordIdx(null);
      },
      0,
      0
    );
  };

  // Deduplicate repeated chords (same symbol + duration) when user chooses 'all' view
  const uniqueChordEntries = useMemo(() => {
    const seen = new Map<string, { guide: (typeof analysis.chordGuides)[number]; positions: number[] }>();
    analysis.chordGuides.forEach((guide) => {
      const key = `${guide.item.chord.id}-${guide.item.durationBeats || 4}`;
      const existing = seen.get(key);
      if (existing) {
        existing.positions.push(guide.chordIndex);
      } else {
        seen.set(key, { guide, positions: [guide.chordIndex] });
      }
    });
    return Array.from(seen.values());
  }, [analysis.chordGuides]);

  const activeFocusIndex =
    playingTargetId === 'full-guide' && activeFullChordIdx !== null
      ? activeFullChordIdx
      : focusedChordIdx;

  const displayedEntries = useMemo(() => {
    if (viewMode === 'focus') {
      const focused = analysis.chordGuides[activeFocusIndex] || analysis.chordGuides[0];
      return focused ? [{ guide: focused, positions: [focused.chordIndex] }] : [];
    }
    return uniqueChordEntries;
  }, [viewMode, analysis.chordGuides, activeFocusIndex, uniqueChordEntries]);

  return (
    <section
      id="improvisation-guide-section"
      className="bg-[#141720] border border-[#232836] rounded-none p-3.5 md:p-4 shadow-xs space-y-3.5"
    >
      {/* Panel Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${isExpanded ? 'border-b border-[#212636] pb-3' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-none bg-[#1a1e2a] text-emerald-400 border border-[#272d3e] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-medium text-slate-200">
                Guia de Improviso
              </h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 border ${
                  analysis.overallCompatibility >= 85
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
                    : analysis.overallCompatibility >= 60
                    ? 'bg-amber-950/40 text-amber-300 border-amber-700/50'
                    : 'bg-rose-950/40 text-rose-300 border-rose-700/50'
                }`}
              >
                Aderência {analysis.overallCompatibility}%
              </span>
              {!isExpanded && (
                <span className="text-[11px] font-normal px-2 py-0.5 bg-[#1e2433] text-indigo-300 border border-indigo-500/40">
                  {selectedScaleRoot} {analysis.scaleDef.name.split(' ')[0]} • {effectiveTimeline.length}{' '}
                  {effectiveTimeline.length === 1 ? 'acorde' : 'acordes'}
                </span>
              )}
            </div>
            {isExpanded && (
              <p className="text-xs text-slate-400 font-light">
                Analisa a progressão atual e sugere padrões rítmicos e frases curtas por acorde na escala selecionada
              </p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {isExpanded && (
            <>
              <button
                id="btn-guide-detect-scale"
                type="button"
                onClick={handleDetectBestScale}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#181c26] hover:bg-[#202636] text-amber-300 border border-amber-600/40 text-xs font-normal transition-colors active:translate-y-0.5"
                title="Detectar automaticamente o tom e a escala mais compatível com a progressão atual"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Detectar Escala</span>
              </button>

              <button
                id="btn-guide-new-variations"
                type="button"
                onClick={() => setVariationSeed((s) => s + 1)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#181c26] hover:bg-[#202636] text-slate-300 border border-[#272d3e] text-xs font-normal transition-colors active:translate-y-0.5"
                title="Gerar novas variações de motivos e padrões rítmicos"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Novos Motivos</span>
              </button>

              <button
                id="btn-guide-play-full"
                type="button"
                onClick={handlePlayFullGuide}
                disabled={effectiveTimeline.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium border transition-all active:translate-y-0.5 disabled:opacity-40 ${
                  playingTargetId === 'full-guide'
                    ? 'bg-amber-600/80 hover:bg-amber-500/80 text-white border-amber-500/60'
                    : 'bg-emerald-700/80 hover:bg-emerald-600/80 text-emerald-100 border-emerald-500/50'
                }`}
                title="Ouvir todas as frases conectadas sobre a progressão completa"
              >
                {playingTargetId === 'full-guide' ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Parar Guia</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Ouvir Guia Completo</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            id="btn-toggle-improv-guide"
            type="button"
            onClick={handleToggleExpanded}
            className="p-1.5 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#272d3e] transition-colors"
            title={isExpanded ? 'Recolher Guia de Improviso' : 'Expandir Guia de Improviso'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Compact Scale Sync Bar + View Mode Toggle (avoids duplicating ScaleDictionaryPanel notes grid) */}
          <div className="px-3 py-2.5 bg-[#10131c] border border-[#1f2536] space-y-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Escala:</span>
                </span>

                {/* Root Selector */}
                <select
                  id="select-guide-scale-root"
                  value={selectedScaleRoot}
                  onChange={(e) => onScaleRootChange(e.target.value)}
                  className="bg-[#171b26] border border-[#283044] focus:border-indigo-500 text-slate-200 text-xs px-2.5 py-1 rounded-none outline-none cursor-pointer"
                  aria-label="Selecionar tom da escala para improviso"
                >
                  {ROOT_KEY_OPTIONS.map((opt) => (
                    <option key={opt.note} value={opt.note}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Scale / Mode Selector */}
                <select
                  id="select-guide-scale-id"
                  value={selectedScaleId}
                  onChange={(e) => onScaleIdChange(e.target.value)}
                  className="bg-[#171b26] border border-[#283044] focus:border-indigo-500 text-slate-200 text-xs px-2.5 py-1 rounded-none outline-none cursor-pointer"
                  aria-label="Selecionar escala ou modo para improviso"
                >
                  {SCALE_DICTIONARY_DATABASE.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle: Focus (1 chord at a time) vs Unique Chords */}
              <div className="flex items-center gap-2">
                <div className="inline-flex p-0.5 bg-[#171b24] border border-[#242a3a] text-[11px]">
                  <button
                    id="btn-guide-view-focus"
                    type="button"
                    onClick={() => setViewMode('focus')}
                    className={`px-2.5 py-1 transition-colors ${
                      viewMode === 'focus'
                        ? 'bg-[#222838] text-slate-100 border border-indigo-500/50'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    Focar Acorde
                  </button>
                  <button
                    id="btn-guide-view-all"
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`px-2.5 py-1 transition-colors ${
                      viewMode === 'all'
                        ? 'bg-[#222838] text-slate-100 border border-indigo-500/50'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                    title="Exibir um cartão por acorde único da progressão"
                  >
                    Acordes Únicos ({uniqueChordEntries.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Detection Toast or Overall Analysis Summary */}
            {detectionNote ? (
              <div className="px-2.5 py-1.5 bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{detectionNote}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                {analysis.progressionSummary}
              </p>
            )}
          </div>

          {/* Progression Quick Step Selector Strip */}
          {analysis.chordGuides.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 min-w-0">
                <span className="text-[11px] text-slate-400 font-light shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Progressão:</span>
                </span>
                {analysis.chordGuides.map((g, idx) => {
                  const isActive =
                    activeFullChordIdx === idx ||
                    (viewMode === 'focus' && activeFocusIndex === idx);
                  return (
                    <button
                      key={`guide-pill-${g.item.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setFocusedChordIdx(idx);
                        onSelectTimelineIndex?.(idx);
                        if (viewMode === 'all') {
                          const targetKey = `${g.item.chord.id}-${g.item.durationBeats || 4}`;
                          const el = document.getElementById(`guide-chord-key-${targetKey}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#222838] text-slate-100 border-indigo-500/70 shadow-xs'
                          : 'bg-[#161a24] hover:bg-[#1c212f] text-slate-300 border-[#242a3a]'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                      <span className="font-medium">{g.item.chord.symbol}</span>
                      <span
                        className={`w-1.5 h-1.5 ${
                          g.compatibilityLevel === 'perfect'
                            ? 'bg-emerald-400'
                            : g.compatibilityLevel === 'partial'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        title={`Aderência ${g.compatibilityPercent}%`}
                      />
                    </button>
                  );
                })}
              </div>

              {viewMode === 'focus' && analysis.chordGuides.length > 1 && (
                <div className="flex items-center gap-1 shrink-0 pb-1">
                  <button
                    id="btn-guide-prev-chord"
                    type="button"
                    onClick={() => {
                      const prevIdx =
                        (activeFocusIndex - 1 + analysis.chordGuides.length) %
                        analysis.chordGuides.length;
                      setFocusedChordIdx(prevIdx);
                      onSelectTimelineIndex?.(prevIdx);
                    }}
                    className="p-1 bg-[#161a24] hover:bg-[#222838] text-slate-300 border border-[#242a3a] transition-colors"
                    title="Acorde anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-guide-next-chord"
                    type="button"
                    onClick={() => {
                      const nextIdx = (activeFocusIndex + 1) % analysis.chordGuides.length;
                      setFocusedChordIdx(nextIdx);
                      onSelectTimelineIndex?.(nextIdx);
                    }}
                    className="p-1 bg-[#161a24] hover:bg-[#222838] text-slate-300 border border-[#242a3a] transition-colors"
                    title="Próximo acorde"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Per-Chord Improvisation Cards */}
          {displayedEntries.length === 0 ? (
            <div className="p-6 text-center bg-[#10131c] border border-dashed border-[#262c3e] text-xs text-slate-400">
              Adicione acordes à Linha do Tempo para receber sugestões de padrões rítmicos e frases melódicas.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedEntries.map(({ guide, positions }) => {
                const isCardActiveInFullPlay =
                  activeFullChordIdx !== null && positions.includes(activeFullChordIdx);
                const primaryTarget =
                  guide.targetNotes[0]?.note || analysis.scaleNotes[0]?.note || 'C';
                const chordKey = `${guide.item.chord.id}-${guide.item.durationBeats || 4}`;
                const isCardCollapsed = !!collapsedCardKeys[chordKey];

                return (
                  <div
                    key={`guide-card-${guide.item.id}-${guide.chordIndex}-${viewMode}`}
                    id={`guide-chord-key-${chordKey}`}
                    className={`p-3.5 border rounded-none space-y-3 transition-all ${
                      isCardActiveInFullPlay
                        ? 'bg-[#1a2030] border-emerald-500/70 shadow-sm'
                        : 'bg-[#11141d] border-[#212738]'
                    }`}
                  >
                    {/* Card Header: Chord + Harmonic Function + Target/Color Notes */}
                    <div className={`flex flex-wrap items-start justify-between gap-2.5 ${!isCardCollapsed ? 'pb-2.5 border-b border-[#1d2332]' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        <div className="min-w-11 px-1.5 h-11 bg-[#181d2b] border border-[#2c344a] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-mono text-slate-400 leading-none">
                            {positions.map((p) => `#${p + 1}`).join(', ')}
                          </span>
                          <span className="text-base font-semibold text-indigo-300 leading-tight mt-0.5">
                            {guide.item.chord.symbol}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-slate-200">
                              {guide.harmonicFunction}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#171b27] text-slate-300 border border-[#283044]">
                              {guide.item.durationBeats || 4} tempos
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                                guide.compatibilityLevel === 'perfect'
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40'
                                  : guide.compatibilityLevel === 'partial'
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-700/40'
                                  : 'bg-rose-950/40 text-rose-300 border-rose-700/40'
                              }`}
                            >
                              {guide.compatibilityPercent}% compatível
                            </span>
                          </div>

                          {!isCardCollapsed && (
                            <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                              {guide.guidanceSummary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Note Roles Summary + Card Collapse Button */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] ml-auto">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/30 border border-emerald-700/40 text-emerald-300">
                          <Target className="w-3 h-3" />
                          <span>
                            Alvos: {guide.targetNotes.map((t) => `${t.note}(${t.roleInChord})`).join(', ') || '—'}
                          </span>
                        </span>
                        {guide.colorNotes.length > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-950/30 border border-indigo-700/40 text-indigo-300">
                            Cor: {guide.colorNotes.slice(0, 3).map((c) => c.note).join(', ')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleCardCollapsed(chordKey)}
                          className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#272d3e] transition-colors"
                          title={isCardCollapsed ? 'Expandir detalhes do acorde' : 'Recolher detalhes do acorde'}
                          aria-expanded={!isCardCollapsed}
                        >
                          {isCardCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Two-Column Body: Left = Rhythmic Patterns, Right = Melodic Phrases */}
                    {!isCardCollapsed && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      {/* Rhythmic Patterns Column (5 cols) */}
                      <div className="lg:col-span-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                          <Activity className="w-3.5 h-3.5 text-amber-400" />
                          <span>Padrões Rítmicos Sugeridos</span>
                        </div>

                        <div className="space-y-2">
                          {guide.rhythmPatterns.map((rp) => {
                            const isPlayingRhythm = playingTargetId === rp.id;
                            return (
                              <div
                                key={rp.id}
                                className={`p-2.5 border space-y-2 transition-colors ${
                                  isPlayingRhythm
                                    ? 'bg-[#192030] border-amber-500/60'
                                    : 'bg-[#141824] border-[#23293a]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-medium text-slate-200">
                                        {rp.name}
                                      </span>
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-950/40 text-amber-300 border border-amber-800/40">
                                        {rp.feelTag}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-indigo-300 mt-0.5">
                                      Pulso: {rp.notation}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlayRhythmPattern(guide.item, rp, primaryTarget)
                                    }
                                    className={`flex items-center gap-1 px-2 py-1 text-[10px] border shrink-0 transition-colors ${
                                      isPlayingRhythm
                                        ? 'bg-amber-600/80 text-white border-amber-500/60'
                                        : 'bg-[#1a1e2a] hover:bg-[#23293a] text-slate-300 border-[#293145]'
                                    }`}
                                    title="Ouvir padrão rítmico sobre o acorde"
                                  >
                                    {isPlayingRhythm ? (
                                      <Square className="w-2.5 h-2.5 fill-current" />
                                    ) : (
                                      <Volume2 className="w-3 h-3 text-amber-400" />
                                    )}
                                    <span>{isPlayingRhythm ? 'Parar' : 'Ouvir Ritmo'}</span>
                                  </button>
                                </div>

                                {/* Visual Beat Grid */}
                                <div className="flex items-center gap-1">
                                  {rp.slots.map((slot, sIdx) => (
                                    <div
                                      key={`${rp.id}-slot-${sIdx}`}
                                      style={{ flexGrow: Math.max(1, Math.round(slot.durationBeats * 2)) }}
                                      className={`py-1 px-1 text-center text-[10px] font-mono border ${
                                        slot.active
                                          ? slot.accent
                                            ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 font-semibold'
                                            : 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50'
                                          : 'bg-[#0e1118] text-slate-600 border-[#1e2433] border-dashed'
                                      }`}
                                      title={
                                        slot.active
                                          ? slot.accent
                                            ? 'Ataque acentuado'
                                            : 'Nota executada'
                                          : 'Pausa / Respiração'
                                      }
                                    >
                                      {slot.active ? slot.label : '—'}
                                    </div>
                                  ))}
                                </div>

                                <p className="text-[10px] text-slate-400 font-light leading-snug">
                                  {rp.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Short Melodic Phrases Column (7 cols) */}
                      <div className="lg:col-span-7 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Frases Melódicas Curtas ({selectedScaleRoot} {analysis.scaleDef.name.split(' ')[0]})</span>
                        </div>

                        <div className="space-y-2">
                          {guide.phrases.map((phrase) => {
                            const soloKey = `${phrase.id}-solo`;
                            const chordKey = `${phrase.id}-chord`;
                            const isPlayingThisPhrase =
                              playingTargetId === soloKey || playingTargetId === chordKey;

                            const tagStyle =
                              phrase.tag === 'Modal'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-700/50'
                                : phrase.tag === 'Conexão' || phrase.tag === 'Resolução'
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
                                : 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50';

                            return (
                              <div
                                key={phrase.id}
                                className={`p-2.5 border space-y-2 transition-colors ${
                                  isPlayingThisPhrase
                                    ? 'bg-[#192032] border-indigo-500/70'
                                    : 'bg-[#141824] border-[#23293a]'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.2 border ${tagStyle}`}>
                                      {phrase.tag}
                                    </span>
                                    <span className="text-xs font-medium text-slate-200">
                                      {phrase.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-light">
                                      • {phrase.rhythmName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayPhrase(guide.item, phrase, false)}
                                      className={`flex items-center gap-1 px-2 py-1 text-[10px] border transition-colors ${
                                        playingTargetId === soloKey
                                          ? 'bg-indigo-600 text-white border-indigo-400'
                                          : 'bg-[#1a1e2a] hover:bg-[#23293a] text-slate-300 border-[#293145]'
                                      }`}
                                      title="Ouvir frase melódica isolada"
                                    >
                                      {playingTargetId === soloKey ? (
                                        <Square className="w-2.5 h-2.5 fill-current" />
                                      ) : (
                                        <Play className="w-2.5 h-2.5 fill-current text-indigo-400" />
                                      )}
                                      <span>Solo</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handlePlayPhrase(guide.item, phrase, true)}
                                      className={`flex items-center gap-1 px-2 py-1 text-[10px] border transition-colors ${
                                        playingTargetId === chordKey
                                          ? 'bg-emerald-600 text-white border-emerald-400'
                                          : 'bg-[#1a1e2a] hover:bg-[#23293a] text-emerald-300 border-emerald-700/40'
                                      }`}
                                      title="Ouvir frase junto com o acorde de acompanhamento"
                                    >
                                      {playingTargetId === chordKey ? (
                                        <Square className="w-2.5 h-2.5 fill-current" />
                                      ) : (
                                        <Volume2 className="w-3 h-3 text-emerald-400" />
                                      )}
                                      <span>c/ Acorde</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Melodic Note Steps */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {phrase.steps.map((step, sIdx) => {
                                    const isHighlighted =
                                      isPlayingThisPhrase && activeNoteIdx === sIdx;
                                    return (
                                      <button
                                        key={`${phrase.id}-step-${sIdx}`}
                                        type="button"
                                        onClick={() =>
                                          audioEngine.playSingleNote(
                                            step.note,
                                            instrument,
                                            0.5,
                                            0.85
                                          )
                                        }
                                        className={`px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all active:translate-y-0.5 ${
                                          isHighlighted
                                            ? 'bg-emerald-500/30 text-slate-100 border-emerald-400 scale-105'
                                            : step.isCharacteristic
                                            ? 'bg-amber-950/40 text-amber-200 border-amber-600/50 hover:border-amber-400'
                                            : step.isChordTarget
                                            ? 'bg-indigo-950/50 text-indigo-200 border-indigo-600/50 hover:border-indigo-400'
                                            : 'bg-[#171b27] text-slate-300 border-[#262d40] hover:border-slate-500'
                                        }`}
                                        title={`Nota ${step.note} (Grau ${step.degree} • ${step.durationBeats}t)${
                                          step.isChordTarget ? ' — Nota-Alvo do Acorde' : ''
                                        }${
                                          step.isCharacteristic ? ' — Nota Característica da Escala' : ''
                                        }`}
                                      >
                                        <span className="font-semibold">{step.note}</span>
                                        <span className="text-[9px] opacity-75">{step.degree}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <p className="text-[10px] text-slate-400 font-light leading-snug">
                                  {phrase.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

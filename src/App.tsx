import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Genre,
  InstrumentType,
  DisplayMode,
  ChordDefinition,
  TimelineChordItem,
  SavedProgression,
  SavedMelodyConfig,
  ChordRhythmPattern,
  BackingTrackStyle,
} from './types';
import {
  CHORD_DATABASE,
  GENRE_PRESETS,
  getNextChordSuggestions,
  getGenreLabel,
} from './data/musicTheory';
import { audioEngine } from './utils/audioPlayer';
import { AndroidHeader } from './components/AndroidHeader';
import { ChordTimeline } from './components/ChordTimeline';
import { MelodySuggestionPanel } from './components/MelodySuggestionPanel';
import { ChordSuggestions } from './components/ChordSuggestions';
import { ChordInspector } from './components/ChordInspector';
import { ScaleDictionaryPanel } from './components/ScaleDictionaryPanel';
import { ChordPickerModal } from './components/ChordPickerModal';
import {
  FavoritesLibrary,
  SaveProgressionModal,
} from './components/FavoritesLibrary';
import { ExportMidiModal } from './components/ExportMidiModal';
import { downloadMidiFile } from './utils/midiExport';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAuth } from './context/AuthContext';
import { useSyncProgressions } from './utils/useSyncProgressions';
import { transposeTimeline, transposeMelody } from './utils/transposition';

const LOCAL_STORAGE_KEY = 'harmoniq_saved_progressions';

export default function App() {
  // Application State
  const [selectedGenre, setSelectedGenre] = useState<Genre>('pop');
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('guitar');
  const [tempoBpm, setTempoBpm] = useState<number>(110);
  const [backingStyle, setBackingStyle] = useState<BackingTrackStyle>(() => {
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('harmoniq_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
      return true;
    } catch {
      return true;
    }
  });
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);

  // Octave Offset for currently inspected chord (-2, -1, 0, +1, +2)
  const [inspectedOctaveOffset, setInspectedOctaveOffset] = useState<number>(0);

  // Modals state
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);

  // Timeline State (starts with initial chord C in Pop mode for instant joy)
  const [timeline, setTimeline] = useState<TimelineChordItem[]>([
    {
      id: 'init-1',
      chord: CHORD_DATABASE['C'],
      durationBeats: 4,
      genreContext: 'pop',
      octaveOffset: 0,
    },
  ]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  // Active chord being viewed in the Inspector (defaults to first chord or C)
  const [inspectedChord, setInspectedChord] = useState<ChordDefinition>(
    CHORD_DATABASE['C']
  );

  // Active melody configuration synced with MelodySuggestionPanel
  const [currentMelodyConfig, setCurrentMelodyConfig] = useState<SavedMelodyConfig | null>(null);

  // Cumulative semitones shifted by transposition
  const [totalTransposition, setTotalTransposition] = useState<number>(0);

  const handleMelodyChange = useCallback((melody: SavedMelodyConfig) => {
    setCurrentMelodyConfig((prev) => {
      if (
        prev &&
        prev.id === melody.id &&
        prev.style === melody.style &&
        prev.instrument === melody.instrument &&
        prev.octaveOffset === melody.octaveOffset &&
        prev.variationSeed === melody.variationSeed &&
        prev.scaleType === melody.scaleType
      ) {
        return prev;
      }
      return melody;
    });
  }, []);

  const { user } = useAuth();
  const {
    progressions: savedProgressions,
    saveProgression: syncSaveProgression,
    deleteProgression: syncDeleteProgression,
    isSyncing,
    syncStatus,
  } = useSyncProgressions(user);

  // Dark/Light mode synchronization
  useEffect(() => {
    try {
      localStorage.setItem('harmoniq_theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Adjust default BPM, Instrument and Backing Track groove when genre changes
  const handleGenreChange = (newGenre: Genre) => {
    setSelectedGenre(newGenre);
    let defaultBacking: BackingTrackStyle = 'none';
    if (newGenre === 'rock') {
      setInstrument('guitar');
      setTempoBpm(128);
      defaultBacking = 'rock';
    } else if (newGenre === 'punk') {
      setInstrument('guitar');
      setTempoBpm(168);
      defaultBacking = 'punk';
    } else if (newGenre === 'techno') {
      setInstrument('piano');
      setTempoBpm(132);
      defaultBacking = 'techno';
    } else if (newGenre === 'electronic') {
      setInstrument('piano');
      setTempoBpm(126);
      defaultBacking = 'disco';
    } else if (newGenre === 'ballad') {
      setInstrument('piano');
      setTempoBpm(78);
      defaultBacking = 'none';
    } else if (newGenre === 'acoustic') {
      setInstrument('guitar');
      setTempoBpm(88);
      defaultBacking = 'bossa';
    } else if (newGenre === 'blues') {
      setInstrument('guitar');
      setTempoBpm(96);
      defaultBacking = 'shuffle';
    } else if (newGenre === 'jazz') {
      setInstrument('piano');
      setTempoBpm(110);
      defaultBacking = 'bossa';
    } else if (newGenre === 'pop') {
      setTempoBpm(116);
      defaultBacking = 'funk';
    }
    setBackingStyle(defaultBacking);
    try {
      localStorage.setItem('harmoniq_backing_style', defaultBacking);
    } catch {
      // ignore
    }
  };

  // Derive intelligent suggestions for next chord
  const currentChords = useMemo(() => timeline.map((item) => item.chord), [timeline]);
  const suggestions = useMemo(() => {
    return getNextChordSuggestions(currentChords, selectedGenre);
  }, [currentChords, selectedGenre]);

  const lastChordInTimeline = currentChords.length > 0 ? currentChords[currentChords.length - 1] : null;

  // Add chord to timeline
  const handleSelectAndAddChord = (chord: ChordDefinition, octaveOffset = inspectedOctaveOffset) => {
    setInspectedChord(chord);
    setInspectedOctaveOffset(octaveOffset);
    const newItem: TimelineChordItem = {
      id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      chord,
      durationBeats: 4,
      genreContext: selectedGenre,
      octaveOffset,
    };
    const newTimeline = [...timeline, newItem];
    setTimeline(newTimeline);
    setSelectedIndex(newTimeline.length - 1);
  };

  // Replace currently selected chord in timeline with an inversion or variation
  const handleReplaceSelectedChord = (replacementChord: ChordDefinition) => {
    if (selectedIndex === null || !timeline[selectedIndex]) {
      // If nothing selected, add as new chord
      handleSelectAndAddChord(replacementChord);
      return;
    }

    const copy = [...timeline];
    const existing = copy[selectedIndex];
    copy[selectedIndex] = {
      ...existing,
      chord: replacementChord,
    };

    setTimeline(copy);
    setInspectedChord(replacementChord);
  };

  // Just preview chord without adding
  const handlePreviewOnly = (chord: ChordDefinition) => {
    setInspectedChord(chord);
  };

  // Select chord in timeline
  const handleSelectTimelineIndex = (index: number) => {
    setSelectedIndex(index);
    if (timeline[index]) {
      setInspectedChord(timeline[index].chord);
      setInspectedOctaveOffset(timeline[index].octaveOffset ?? 0);
    }
  };

  // Update octave of inspected chord & currently selected timeline chord
  const handleOctaveChange = (newOffset: number) => {
    setInspectedOctaveOffset(newOffset);
    if (selectedIndex !== null && timeline[selectedIndex]) {
      const copy = [...timeline];
      copy[selectedIndex] = {
        ...copy[selectedIndex],
        octaveOffset: newOffset,
      };
      setTimeline(copy);
    }
  };

  // Update octave of specific timeline item
  const handleUpdateChordOctave = (index: number, newOctaveOffset: number) => {
    if (index >= 0 && index < timeline.length) {
      const copy = [...timeline];
      copy[index] = {
        ...copy[index],
        octaveOffset: newOctaveOffset,
      };
      setTimeline(copy);
      if (selectedIndex === index) {
        setInspectedOctaveOffset(newOctaveOffset);
      }
    }
  };

  // Update rhythm pattern of specific timeline item
  const handleUpdateChordRhythm = (index: number, newRhythm: ChordRhythmPattern) => {
    if (index >= 0 && index < timeline.length) {
      const copy = [...timeline];
      copy[index] = {
        ...copy[index],
        rhythmPattern: newRhythm,
      };
      setTimeline(copy);
    }
  };

  // Remove chord from timeline
  const handleRemoveChord = (index: number) => {
    const updated = timeline.filter((_, idx) => idx !== index);
    setTimeline(updated);
    if (selectedIndex === index) {
      if (updated.length > 0) {
        const nextIdx = Math.max(0, index - 1);
        setSelectedIndex(nextIdx);
        setInspectedChord(updated[nextIdx].chord);
        setInspectedOctaveOffset(updated[nextIdx].octaveOffset ?? 0);
      } else {
        setSelectedIndex(null);
      }
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Reorder chord in timeline
  const handleMoveChord = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= timeline.length) return;
    const copy = [...timeline];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setTimeline(copy);
    setSelectedIndex(toIndex);
  };

  // Clear timeline
  const handleClearTimeline = () => {
    audioEngine.stopSequence();
    setTimeline([]);
    setSelectedIndex(null);
    setTotalTransposition(0);
  };

  // Transpose the entire progression while preserving harmonic relationships
  const handleTransposeProgression = useCallback((deltaSemitones: number) => {
    if (timeline.length === 0 || deltaSemitones === 0) return;

    const updatedTimeline = transposeTimeline(timeline, deltaSemitones);
    setTimeline(updatedTimeline);
    setTotalTransposition((prev) => (prev + deltaSemitones) % 12);

    // Update currently inspected chord if selected
    if (selectedIndex !== null && updatedTimeline[selectedIndex]) {
      setInspectedChord(updatedTimeline[selectedIndex].chord);
    } else if (updatedTimeline.length > 0) {
      setInspectedChord(updatedTimeline[0].chord);
    }

    // Transpose melody if active so it stays harmonically aligned
    if (currentMelodyConfig && currentMelodyConfig.notes.length > 0) {
      setCurrentMelodyConfig((prev) => (prev ? transposeMelody(prev, deltaSemitones) : null));
    }

    // Play brief audio preview of the current chord in the new key
    if (updatedTimeline.length > 0) {
      const activeIdx = selectedIndex !== null && updatedTimeline[selectedIndex] ? selectedIndex : 0;
      audioEngine.playChord(
        updatedTimeline[activeIdx].chord,
        instrument,
        1.2,
        updatedTimeline[activeIdx].octaveOffset ?? 0
      );
    }
  }, [timeline, selectedIndex, currentMelodyConfig, instrument]);

  // Save current progression to personal favorites (syncs to Firestore when logged in)
  const handleSaveCurrentProgression = (
    name: string,
    description: string,
    includeMelody: boolean = true
  ) => {
    if (timeline.length === 0) return;
    const newProg: SavedProgression = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      description,
      genre: selectedGenre,
      chords: timeline.map((t) => t.chord),
      tempoBpm,
      instrument,
      createdAt: Date.now(),
      isPreset: false,
      melody: includeMelody && currentMelodyConfig ? currentMelodyConfig : undefined,
    };

    syncSaveProgression(newProg);
  };

  // Delete saved progression
  const handleDeleteProgression = (id: string) => {
    syncDeleteProgression(id);
  };

  // Helper to safely resolve chord definitions
  const resolveChordItem = useCallback((c: any): ChordDefinition | null => {
    if (!c) return null;
    if (typeof c === 'string') return CHORD_DATABASE[c] || null;
    if (c.symbol && c.notes) return c as ChordDefinition;
    if (c.name && CHORD_DATABASE[c.name]) return CHORD_DATABASE[c.name];
    if (c.symbol && CHORD_DATABASE[c.symbol]) return CHORD_DATABASE[c.symbol];
    return null;
  }, []);

  // Direct export of a saved progression to MIDI
  const handleExportSavedProgressionMidi = (prog: SavedProgression) => {
    const validChords = (prog.chords || []).map(resolveChordItem).filter((c): c is ChordDefinition => c !== null);
    const timelineItems: TimelineChordItem[] = validChords.map((c, idx) => ({
      id: `export-${c.id || idx}-${idx}`,
      chord: c,
      durationBeats: 4,
      genreContext: prog.genre,
      octaveOffset: 0,
    }));

    downloadMidiFile(
      {
        timeline: timelineItems,
        melodyNotes: prog.melody?.notes || null,
        tempoBpm: prog.tempoBpm || 110,
        instrument: prog.instrument || 'piano',
        songTitle: prog.name,
        includeChords: true,
        includeMelody: Boolean(prog.melody?.notes && prog.melody.notes.length > 0),
      },
      `${prog.name || 'harmoniq-progressao'}.mid`
    );
  };

  // Load progression into timeline
  const handleLoadProgression = (prog: SavedProgression) => {
    audioEngine.stopAll();
    setSelectedGenre(prog.genre);
    setTempoBpm(prog.tempoBpm || 110);
    setInstrument(prog.instrument || 'piano');

    const validChords = (prog.chords || []).map(resolveChordItem).filter((c): c is ChordDefinition => c !== null);
    const newTimeline: TimelineChordItem[] = validChords.map((c, idx) => ({
      id: `load-${Date.now()}-${idx}`,
      chord: c,
      durationBeats: 4,
      genreContext: prog.genre,
      octaveOffset: 0,
    }));

    setTimeline(newTimeline);
    setTotalTransposition(0);
    if (newTimeline.length > 0) {
      setSelectedIndex(0);
      setInspectedChord(newTimeline[0].chord);
      setInspectedOctaveOffset(newTimeline[0].octaveOffset ?? 0);
    } else {
      setSelectedIndex(null);
    }

    // Restore saved melody if present
    if (prog.melody) {
      setCurrentMelodyConfig(prog.melody);
    }

    if (newTimeline.length > 0) {
      setSelectedIndex(0);
      setInspectedChord(newTimeline[0].chord);
      setInspectedOctaveOffset(0);
      audioEngine.playChord(newTimeline[0].chord, prog.instrument || 'piano', 1.4, 0);
    }
  };

  const defaultSaveName = useMemo(() => {
    if (timeline.length === 0) return 'Minha Nova Progressão';
    const symbols = timeline.map((t) => t.chord.symbol).join(' - ');
    return `${getGenreLabel(selectedGenre)} (${symbols})`;
  }, [timeline, selectedGenre]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0c0e12] text-slate-400' : 'bg-slate-100 text-slate-700'} font-sans transition-colors duration-200 ${isMobileFrameMode ? 'p-3 md:py-6 flex justify-center items-start' : 'p-3 sm:p-5'}`}>
      {/* Outer Shell container (supports Android Phone Mock Frame or Responsive Full-Width) */}
      <div
        className={`w-full transition-all duration-200 ${
          isMobileFrameMode
            ? `max-w-md ${isDarkMode ? 'bg-[#12151d] border-[#232836]' : 'bg-white border-slate-300 shadow-2xl'} rounded-none shadow-xl border overflow-hidden relative`
            : 'max-w-6xl mx-auto'
        }`}
      >
        {/* Android Phone Status Bar (when in mobile frame) */}
        {isMobileFrameMode && (
          <div className={`${isDarkMode ? 'bg-[#0e1017] text-slate-500 border-[#1e2330]' : 'bg-slate-100 text-slate-600 border-slate-200'} px-5 pt-2.5 pb-2 flex items-center justify-between text-xs font-normal select-none border-b`}>
            <span>09:41</span>
            {/* Camera punch-hole */}
            <div className={`w-2.5 h-2.5 rounded-none ${isDarkMode ? 'bg-black border-[#2d3448]' : 'bg-slate-800 border-slate-600'} border mx-auto`}></div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className={`space-y-3.5 ${isMobileFrameMode ? 'p-3 max-h-[85vh] overflow-y-auto' : ''}`}>
          {/* Header & Genre Tabs */}
          <AndroidHeader
            selectedGenre={selectedGenre}
            onSelectGenre={handleGenreChange}
            onOpenFavorites={() => setIsFavoritesOpen(true)}
            savedCount={savedProgressions.filter((p) => !p.isPreset).length}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            isMobileFrameMode={isMobileFrameMode}
            onToggleMobileFrameMode={() => setIsMobileFrameMode(!isMobileFrameMode)}
            syncStatus={syncStatus}
            isSyncing={isSyncing}
            onScrollToScaleDictionary={() => {
              const el = document.getElementById('scale-dictionary-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          />

          {/* Timeline Sequencer */}
          <ChordTimeline
            timeline={timeline}
            selectedIndex={selectedIndex}
            onSelectIndex={handleSelectTimelineIndex}
            onRemoveChord={handleRemoveChord}
            onMoveChord={handleMoveChord}
            onClearTimeline={handleClearTimeline}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
            onOpenExportMidi={() => setIsMidiModalOpen(true)}
            onOpenPickerModal={() => setIsPickerOpen(true)}
            tempoBpm={tempoBpm}
            onTempoChange={setTempoBpm}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            onUpdateChordOctave={handleUpdateChordOctave}
            onUpdateChordRhythm={handleUpdateChordRhythm}
            activeBackingStyle={backingStyle}
            onBackingStyleChange={setBackingStyle}
            onTransposeProgression={handleTransposeProgression}
            totalTransposition={totalTransposition}
          />

          {/* Smart Next Chord Suggestions Grid (Placed directly after the Timeline) */}
          <ChordSuggestions
            suggestions={suggestions}
            currentLastChord={lastChordInTimeline}
            genre={selectedGenre}
            instrument={instrument}
            onSelectAndAdd={handleSelectAndAddChord}
            onPreviewOnly={handlePreviewOnly}
            onOpenFullPicker={() => setIsPickerOpen(true)}
            currentOctaveOffset={inspectedOctaveOffset}
          />

          {/* Melody Suggestions & Scale Visualizer (Fretboard & Keyboard) */}
          <MelodySuggestionPanel
            timeline={timeline}
            selectedGenre={selectedGenre}
            tempoBpm={tempoBpm}
            chordInstrument={instrument}
            inspectedChord={inspectedChord}
            loadedMelody={currentMelodyConfig}
            onMelodyChange={handleMelodyChange}
            onOpenExportMidi={() => setIsMidiModalOpen(true)}
          />

          {/* Dicionário de Escalas & Modos (Seletor de Tom e Modo, Estrutura Intervalar e Digitações) */}
          <ScaleDictionaryPanel
            initialRoot={timeline[0]?.chord?.root || 'C'}
            initialScaleId="lydian"
            defaultInstrument={instrument}
          />

          {/* Active Chord Inspector (Diagrams for Violão / Teclado + Escala Correspondente + Octave Controls + Inversions) */}
          <ChordInspector
            chord={inspectedChord}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            instrument={instrument}
            onAddToTimeline={handleSelectAndAddChord}
            onReplaceSelectedInTimeline={handleReplaceSelectedChord}
            selectedTimelineChord={selectedIndex !== null ? timeline[selectedIndex] || null : null}
            isInTimeline={timeline.some((t) => t.chord.id === inspectedChord.id)}
            octaveOffset={inspectedOctaveOffset}
            onOctaveChange={handleOctaveChange}
          />
        </div>

        {/* Android Navigation Bar (when in mobile frame) */}
        {isMobileFrameMode && (
          <div className={`py-2 ${isDarkMode ? 'bg-[#0e1017] border-[#1e2330]' : 'bg-slate-100 border-slate-200'} flex justify-center items-center border-t`}>
            <div className={`w-24 h-0.5 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-400'} rounded-none`}></div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChordPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectChord={handleSelectAndAddChord}
        instrument={instrument}
      />

      <FavoritesLibrary
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        savedProgressions={savedProgressions}
        onLoadProgression={handleLoadProgression}
        onDeleteProgression={handleDeleteProgression}
        activeGenre={selectedGenre}
        onExportMidi={handleExportSavedProgressionMidi}
      />

      <SaveProgressionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCurrentProgression}
        defaultName={defaultSaveName}
        currentMelody={currentMelodyConfig}
      />

      <ExportMidiModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        timeline={timeline}
        tempoBpm={tempoBpm}
        instrument={instrument}
        songTitle={defaultSaveName}
        melodyNotes={currentMelodyConfig?.notes || null}
        melodyStyleName={currentMelodyConfig?.style}
        initialBackingStyle={backingStyle}
      />

      <OfflineIndicator />
    </div>
  );
}

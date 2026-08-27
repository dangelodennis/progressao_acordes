import React, { useState, useEffect, useMemo } from 'react';
import {
  Genre,
  InstrumentType,
  DisplayMode,
  ChordDefinition,
  TimelineChordItem,
  SavedProgression,
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
import { ChordSuggestions } from './components/ChordSuggestions';
import { ChordInspector } from './components/ChordInspector';
import { ChordPickerModal } from './components/ChordPickerModal';
import {
  FavoritesLibrary,
  SaveProgressionModal,
} from './components/FavoritesLibrary';

const LOCAL_STORAGE_KEY = 'harmoniq_saved_progressions';

export default function App() {
  // Application State
  const [selectedGenre, setSelectedGenre] = useState<Genre>('pop');
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('guitar');
  const [tempoBpm, setTempoBpm] = useState<number>(110);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);

  // Octave Offset for currently inspected chord (-2, -1, 0, +1, +2)
  const [inspectedOctaveOffset, setInspectedOctaveOffset] = useState<number>(0);

  // Modals state
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

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

  // Favorites / Saved Progressions (Initialized with presets and merged with localStorage)
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allPresets = [
        ...GENRE_PRESETS.pop,
        ...GENRE_PRESETS.rock,
        ...GENRE_PRESETS.ballad,
        ...GENRE_PRESETS.blues,
        ...GENRE_PRESETS.acoustic,
      ];
      if (stored) {
        const userSaved: SavedProgression[] = JSON.parse(stored);
        return [...userSaved, ...allPresets];
      }
      return allPresets;
    } catch {
      return [
        ...GENRE_PRESETS.pop,
        ...GENRE_PRESETS.rock,
        ...GENRE_PRESETS.ballad,
      ];
    }
  });

  // Dark mode effect (always dark gray theme by default)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Adjust default BPM and Instrument when genre changes
  const handleGenreChange = (newGenre: Genre) => {
    setSelectedGenre(newGenre);
    if (newGenre === 'rock') {
      setInstrument('guitar');
      setTempoBpm(128);
    } else if (newGenre === 'ballad') {
      setInstrument('piano');
      setTempoBpm(78);
    } else if (newGenre === 'pop') {
      setTempoBpm(116);
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
  };

  // Save current progression to personal favorites
  const handleSaveCurrentProgression = (name: string, description: string) => {
    if (timeline.length === 0) return;
    const newProg: SavedProgression = {
      id: `user-${Date.now()}`,
      name,
      description,
      genre: selectedGenre,
      chords: timeline.map((t) => t.chord),
      tempoBpm,
      instrument,
      createdAt: Date.now(),
      isPreset: false,
    };

    const updated = [newProg, ...savedProgressions];
    setSavedProgressions(updated);

    // Save only user progressions in localStorage
    const userOnly = updated.filter((p) => !p.isPreset);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userOnly));
    } catch {
      // ignore
    }
  };

  // Delete saved progression
  const handleDeleteProgression = (id: string) => {
    const updated = savedProgressions.filter((p) => p.id !== id);
    setSavedProgressions(updated);
    const userOnly = updated.filter((p) => !p.isPreset);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userOnly));
    } catch {
      // ignore
    }
  };

  // Load progression into timeline
  const handleLoadProgression = (prog: SavedProgression) => {
    audioEngine.stopSequence();
    setSelectedGenre(prog.genre);
    setTempoBpm(prog.tempoBpm || 110);
    setInstrument(prog.instrument || 'piano');

    const newTimeline: TimelineChordItem[] = prog.chords.map((c, idx) => ({
      id: `load-${Date.now()}-${idx}`,
      chord: c,
      durationBeats: 4,
      genreContext: prog.genre,
      octaveOffset: 0,
    }));

    setTimeline(newTimeline);
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
    <div className={`min-h-screen bg-[#15171e] text-slate-100 font-sans transition-colors duration-150 ${isMobileFrameMode ? 'p-3 md:py-6 flex justify-center items-start' : 'p-3 sm:p-5'}`}>
      {/* Outer Shell container (supports Android Phone Mock Frame or Responsive Full-Width) */}
      <div
        className={`w-full transition-all duration-200 ${
          isMobileFrameMode
            ? 'max-w-md bg-[#181b24] rounded-none shadow-2xl border-4 border-[#2d3342] overflow-hidden relative'
            : 'max-w-6xl mx-auto'
        }`}
      >
        {/* Android Phone Status Bar (when in mobile frame) */}
        {isMobileFrameMode && (
          <div className="bg-[#12141a] text-slate-300 px-5 pt-2.5 pb-2 flex items-center justify-between text-xs font-bold select-none border-b border-[#2d3342]">
            <span>09:41</span>
            {/* Camera punch-hole */}
            <div className="w-3 h-3 rounded-none bg-black border border-[#384050] mx-auto"></div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className={`space-y-4 ${isMobileFrameMode ? 'p-3 max-h-[85vh] overflow-y-auto' : ''}`}>
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
            onOpenPickerModal={() => setIsPickerOpen(true)}
            tempoBpm={tempoBpm}
            onTempoChange={setTempoBpm}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            onUpdateChordOctave={handleUpdateChordOctave}
          />

          {/* Active Chord Inspector (Diagrams for Violão / Teclado + Escala Correspondente + Octave Controls) */}
          <ChordInspector
            chord={inspectedChord}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            instrument={instrument}
            onAddToTimeline={handleSelectAndAddChord}
            isInTimeline={timeline.some((t) => t.chord.id === inspectedChord.id)}
            octaveOffset={inspectedOctaveOffset}
            onOctaveChange={handleOctaveChange}
          />

          {/* Smart Next Chord Suggestions Grid */}
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
        </div>

        {/* Android Navigation Bar (when in mobile frame) */}
        {isMobileFrameMode && (
          <div className="py-2 bg-[#12141a] flex justify-center items-center border-t border-[#2d3342]">
            <div className="w-28 h-1 bg-slate-500 rounded-none"></div>
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
      />

      <SaveProgressionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCurrentProgression}
        defaultName={defaultSaveName}
      />
    </div>
  );
}

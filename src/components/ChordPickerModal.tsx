import React, { useState } from 'react';
import { ChordDefinition, InstrumentType } from '../types';
import { CHORD_DATABASE } from '../data/musicTheory';
import { audioEngine } from '../utils/audioPlayer';
import { X, Search, Volume2, Plus, Sparkles } from 'lucide-react';

interface ChordPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChord: (chord: ChordDefinition) => void;
  instrument: InstrumentType;
}

export const ChordPickerModal: React.FC<ChordPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectChord,
  instrument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQualityFilter, setSelectedQualityFilter] = useState<string>('all');
  const [selectedRootFilter, setSelectedRootFilter] = useState<string>('all');

  if (!isOpen) return null;

  const allChords = Object.values(CHORD_DATABASE);

  const roots = ['all', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb'];
  const qualities = [
    { id: 'all', label: 'Todos' },
    { id: 'major', label: 'Maiores' },
    { id: 'minor', label: 'Menores' },
    { id: '7', label: 'com 7ª (Dom)' },
    { id: 'maj7', label: '7M (Maj7)' },
    { id: 'm7', label: 'm7 (Menor 7)' },
    { id: 'sus4', label: 'Suspensos' },
    { id: '5', label: 'Power Chords (5)' },
  ];

  const filteredChords = allChords.filter((c) => {
    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchSymbol = c.symbol.toLowerCase().includes(q);
      const matchNotes = c.noteNames.join(' ').toLowerCase().includes(q);
      if (!matchName && !matchSymbol && !matchNotes) return false;
    }
    // Root filter
    if (selectedRootFilter !== 'all' && c.root !== selectedRootFilter) {
      return false;
    }
    // Quality filter
    if (selectedQualityFilter !== 'all' && c.quality !== selectedQualityFilter) {
      return false;
    }
    return true;
  });

  const handleChordClick = (chord: ChordDefinition) => {
    audioEngine.playChord(chord, instrument, 1.4);
    onSelectChord(chord);
    onClose();
  };

  const handlePreviewSound = (e: React.MouseEvent, chord: ChordDefinition) => {
    e.stopPropagation();
    audioEngine.playChord(chord, instrument, 1.4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="chord-picker-modal"
        className="bg-[#12151d] border border-[#232836] w-full max-w-2xl rounded-none p-4 md:p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202534]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#181c28] border border-[#252c40] text-indigo-300 flex items-center justify-center font-normal">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">
                Biblioteca Geral de Acordes
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Selecione qualquer acorde para adicionar à sua progressão
              </p>
            </div>
          </div>

          <button
            id="btn-close-picker-modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#252a3a] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="py-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-chords"
              type="text"
              placeholder="Buscar acorde (ex: C, Dm7, Fmaj7, Am)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-none bg-[#0f1117] border border-[#222736] text-slate-200 focus:border-indigo-500/60 outline-none font-light"
            />
          </div>
        </div>

        {/* Filters: Root & Qualities */}
        <div className="space-y-2 pb-2.5">
          {/* Roots filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-normal text-slate-400 shrink-0 mr-1">
              Tônica:
            </span>
            {roots.map((r) => (
              <button
                key={`root-filter-${r}`}
                type="button"
                onClick={() => setSelectedRootFilter(r)}
                className={`px-2 py-0.5 text-xs font-normal rounded-none border transition-all ${
                  selectedRootFilter === r
                    ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                    : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
                }`}
              >
                {r === 'all' ? 'Todas' : r}
              </button>
            ))}
          </div>

          {/* Qualities filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-normal text-slate-400 shrink-0 mr-1">
              Tipo:
            </span>
            {qualities.map((q) => (
              <button
                key={`quality-filter-${q.id}`}
                type="button"
                onClick={() => setSelectedQualityFilter(q.id)}
                className={`px-2 py-0.5 text-xs font-normal rounded-none border transition-all whitespace-nowrap ${
                  selectedQualityFilter === q.id
                    ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                    : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chords Grid List */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 min-h-[220px]">
          {filteredChords.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <p className="text-xs font-normal">Nenhum acorde encontrado para estes filtros.</p>
              <p className="text-[11px] text-slate-500 font-light mt-1">Tente buscar por outra tônica ou tipo.</p>
            </div>
          ) : (
            filteredChords.map((chord) => (
              <div
                key={`picker-item-${chord.id}`}
                id={`picker-chord-${chord.id}`}
                onClick={() => handleChordClick(chord)}
                className="group relative p-2.5 rounded-none bg-[#161922] hover:bg-[#1b202c] border border-[#232836] hover:border-indigo-500/50 transition-all cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {chord.symbol}
                    </span>
                    <span className="text-[9px] font-normal uppercase px-1 rounded-none bg-[#12141a] text-slate-400 border border-[#222736]">
                      {chord.quality}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-light truncate max-w-[110px]">
                    {chord.noteNames.join(' ')}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handlePreviewSound(e, chord)}
                    className="p-1 rounded-none bg-[#1a1e28] hover:bg-[#222836] text-slate-400 hover:text-slate-300 border border-[#272d3e] transition-colors"
                    title="Ouvir acorde"
                  >
                    <Volume2 className="w-3 h-3 text-indigo-400/80" />
                  </button>
                  <div className="p-1 rounded-none bg-[#1f2433] group-hover:bg-indigo-600/80 text-slate-300 group-hover:text-white border border-[#2b3348]">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2.5 border-t border-[#202534] flex items-center justify-between text-xs text-slate-400 font-light">
          <span>{filteredChords.length} acordes disponíveis</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-300 border border-[#272d3e] text-xs font-normal"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

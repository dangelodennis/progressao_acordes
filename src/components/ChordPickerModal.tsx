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
        className="bg-[#1a1d26] border border-[#384052] w-full max-w-2xl rounded-none p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2d3342]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-indigo-600 border border-indigo-400 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Biblioteca Geral de Acordes
              </h3>
              <p className="text-xs text-slate-400">
                Selecione qualquer acorde para adicionar à sua progressão
              </p>
            </div>
          </div>

          <button
            id="btn-close-picker-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-300 border border-[#384050] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-chords"
              type="text"
              placeholder="Buscar acorde (ex: C, Dm7, Fmaj7, Am)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-none bg-[#13151c] border border-[#2e3444] text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Filters: Root & Qualities */}
        <div className="space-y-2 pb-3">
          {/* Roots filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
              Tônica:
            </span>
            {roots.map((r) => (
              <button
                key={`root-filter-${r}`}
                type="button"
                onClick={() => setSelectedRootFilter(r)}
                className={`px-2.5 py-1 text-xs font-black rounded-none border transition-all ${
                  selectedRootFilter === r
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                    : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
                }`}
              >
                {r === 'all' ? 'Todas' : r}
              </button>
            ))}
          </div>

          {/* Qualities filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
              Tipo:
            </span>
            {qualities.map((q) => (
              <button
                key={`quality-filter-${q.id}`}
                type="button"
                onClick={() => setSelectedQualityFilter(q.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-none border transition-all whitespace-nowrap ${
                  selectedQualityFilter === q.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                    : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chords Grid List */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-h-[220px]">
          {filteredChords.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <p className="text-xs font-bold">Nenhum acorde encontrado para estes filtros.</p>
              <p className="text-[11px] text-slate-500 mt-1">Tente buscar por outra tônica ou tipo.</p>
            </div>
          ) : (
            filteredChords.map((chord) => (
              <div
                key={`picker-item-${chord.id}`}
                id={`picker-chord-${chord.id}`}
                onClick={() => handleChordClick(chord)}
                className="group relative p-3 rounded-none bg-[#202430] hover:bg-[#262c3a] border border-[#2e3444] hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">
                      {chord.symbol}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1 rounded-none bg-[#181b24] text-indigo-300 border border-[#384050]">
                      {chord.quality}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {chord.noteNames.join(' ')}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handlePreviewSound(e, chord)}
                    className="p-1.5 rounded-none bg-[#282d3c] hover:bg-[#333a4d] text-slate-300 border border-[#384050] transition-colors"
                    title="Ouvir acorde"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                  <div className="p-1.5 rounded-none bg-indigo-600 group-hover:bg-indigo-500 text-white border border-indigo-400">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#2d3342] flex items-center justify-between text-xs text-slate-400">
          <span>{filteredChords.length} acordes disponíveis</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-200 border border-[#384050] text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

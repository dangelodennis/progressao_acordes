import React, { useState } from 'react';
import { SavedProgression, Genre } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import {
  Bookmark,
  Play,
  Pause,
  Trash2,
  FolderHeart,
  ArrowRight,
  X,
} from 'lucide-react';
import { getGenreLabel } from '../data/musicTheory';

interface FavoritesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  savedProgressions: SavedProgression[];
  onLoadProgression: (prog: SavedProgression) => void;
  onDeleteProgression: (id: string) => void;
  activeGenre: Genre;
}

export const FavoritesLibrary: React.FC<FavoritesLibraryProps> = ({
  isOpen,
  onClose,
  savedProgressions,
  onLoadProgression,
  onDeleteProgression,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = savedProgressions.filter((prog) => {
    if (filterGenre !== 'all' && prog.genre !== filterGenre) return false;
    return true;
  });

  const handlePlayProgression = (prog: SavedProgression) => {
    if (playingId === prog.id) {
      audioEngine.stopSequence();
      setPlayingId(null);
    } else {
      setPlayingId(prog.id);
      const items = prog.chords.map((c, idx) => ({
        id: `prev-${prog.id}-${idx}`,
        chord: c,
        durationBeats: 4,
        octaveOffset: 0,
      }));
      audioEngine.playSequence(
        items,
        prog.tempoBpm || 110,
        prog.instrument || 'piano',
        false,
        () => {},
        () => setPlayingId(null),
        0
      );
    }
  };

  const handleLoad = (prog: SavedProgression) => {
    audioEngine.stopSequence();
    setPlayingId(null);
    onLoadProgression(prog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="favorites-library-modal"
        className="bg-[#1a1d26] border border-[#384052] w-full max-w-2xl rounded-none p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2d3342]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <FolderHeart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Biblioteca de Favoritos
              </h3>
              <p className="text-xs text-slate-400">
                Suas progressões salvas e modelos harmônicos para consulta rápida
              </p>
            </div>
          </div>

          <button
            id="btn-close-favorites-modal"
            type="button"
            onClick={() => {
              audioEngine.stopSequence();
              setPlayingId(null);
              onClose();
            }}
            className="p-1.5 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-300 border border-[#384050] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterGenre('all')}
            className={`px-3 py-1 text-xs font-black rounded-none border transition-all ${
              filterGenre === 'all'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
            }`}
          >
            Todas ({savedProgressions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('rock')}
            className={`px-3 py-1 text-xs font-black rounded-none border transition-all ${
              filterGenre === 'rock'
                ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
            }`}
          >
            🎸 Rock
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('pop')}
            className={`px-3 py-1 text-xs font-black rounded-none border transition-all ${
              filterGenre === 'pop'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
            }`}
          >
            ✨ Pop
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('ballad')}
            className={`px-3 py-1 text-xs font-black rounded-none border transition-all ${
              filterGenre === 'ballad'
                ? 'bg-amber-600 text-white border-amber-400 shadow-xs'
                : 'bg-[#202430] hover:bg-[#282d3b] text-slate-300 border-[#313747]'
            }`}
          >
            🌙 Ballad
          </button>
        </div>

        {/* Progression List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhuma progressão encontrada nesta categoria.
            </div>
          ) : (
            filtered.map((prog) => {
              const isCurrentlyPlaying = playingId === prog.id;

              return (
                <div
                  key={prog.id}
                  id={`fav-item-${prog.id}`}
                  className={`p-4 rounded-none border transition-all ${
                    isCurrentlyPlaying
                      ? 'bg-[#242836] border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-[#202430] hover:bg-[#252a38] border-[#2e3444]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">
                          {prog.name}
                        </h4>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-none bg-[#181b24] text-indigo-300 border border-[#384050] uppercase">
                          {getGenreLabel(prog.genre)}
                        </span>
                        {prog.isPreset && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-none bg-amber-950/60 text-amber-300 border border-amber-500/40">
                            Modelo
                          </span>
                        )}
                      </div>

                      {prog.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {prog.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons: Play & Load */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePlayProgression(prog)}
                        className={`p-2 rounded-none text-xs font-bold border transition-all active:translate-y-0.5 ${
                          isCurrentlyPlaying
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-[#282d3c] hover:bg-[#333a4d] text-slate-200 border-[#384050]'
                        }`}
                        title={isCurrentlyPlaying ? 'Pausar' : 'Tocar Prévia'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoad(prog)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 transition-all active:translate-y-0.5"
                      >
                        <span>Carregar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {!prog.isPreset && (
                        <button
                          type="button"
                          onClick={() => onDeleteProgression(prog.id)}
                          className="p-1.5 rounded-none bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chord sequence badges preview */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {prog.chords.map((chord, cIdx) => (
                      <span
                        key={`${prog.id}-c-${cIdx}`}
                        className="px-2 py-0.5 rounded-none bg-[#181b24] font-black text-xs text-indigo-300 border border-[#384050]"
                      >
                        {chord.symbol}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-400 font-medium ml-2">
                      {prog.tempoBpm} BPM • {prog.instrument === 'guitar' ? '🎸 Violão' : '🎹 Piano'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Modal for saving current progression
interface SaveProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName: string;
}

export const SaveProgressionModal: React.FC<SaveProgressionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1a1d26] border border-[#384052] w-full max-w-md rounded-none p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d3342]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-extrabold text-white">
              Salvar em Favoritos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nome da Progressão *
            </label>
            <input
              id="input-progression-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Minha Balada Romântica em Dó"
              className="w-full px-3 py-2 text-xs rounded-none bg-[#13151c] border border-[#2e3444] text-white focus:border-indigo-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Descrição / Notas (Opcional)
            </label>
            <textarea
              id="input-progression-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Refrão com violão de dedo e solo em escala menor..."
              className="w-full px-3 py-2 text-xs rounded-none bg-[#13151c] border border-[#2e3444] text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-none text-xs font-bold text-slate-400 hover:text-slate-200 border border-transparent"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-save-progression"
              type="submit"
              className="px-4 py-2 rounded-none text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 shadow-sm"
            >
              Salvar na Biblioteca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

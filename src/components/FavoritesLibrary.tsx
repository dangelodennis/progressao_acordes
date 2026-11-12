import React, { useState, useEffect, useMemo } from 'react';
import { SavedProgression, Genre, SavedMelodyConfig, TimelineChordItem } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import {
  Bookmark,
  Play,
  Pause,
  Trash2,
  FolderHeart,
  ArrowRight,
  X,
  Music,
  Download,
  Clock,
  AlertTriangle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { getGenreLabel, CHORD_DATABASE } from '../data/musicTheory';
import { ChordDefinition } from '../types';
import { formatProgressionDateTime } from '../utils/useSyncProgressions';

function resolveChordItem(c: any): ChordDefinition | null {
  if (!c) return null;
  if (typeof c === 'string') return CHORD_DATABASE[c] || null;
  if (c.symbol && c.notes) return c as ChordDefinition;
  if (c.name && CHORD_DATABASE[c.name]) return CHORD_DATABASE[c.name];
  if (c.symbol && CHORD_DATABASE[c.symbol]) return CHORD_DATABASE[c.symbol];
  return null;
}

interface FavoritesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  savedProgressions: SavedProgression[];
  onLoadProgression: (prog: SavedProgression) => void;
  onDeleteProgression: (id: string) => void;
  activeGenre: Genre;
  onExportMidi?: (prog: SavedProgression) => void;
  currentTimelineLength?: number;
  onOverwriteProgression?: (prog: SavedProgression) => void;
}

export const FavoritesLibrary: React.FC<FavoritesLibraryProps> = ({
  isOpen,
  onClose,
  savedProgressions,
  onLoadProgression,
  onDeleteProgression,
  onExportMidi,
  currentTimelineLength = 0,
  onOverwriteProgression,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [confirmOverwriteId, setConfirmOverwriteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = savedProgressions.filter((prog) => {
    if (filterGenre !== 'all' && prog.genre !== filterGenre) return false;
    return true;
  });

  const handlePlayProgression = (prog: SavedProgression) => {
    if (playingId === prog.id) {
      audioEngine.stopAll();
      setPlayingId(null);
    } else {
      audioEngine.stopAll();
      setPlayingId(prog.id);
      const rawChords = Array.isArray(prog.chords) ? prog.chords : [];
      const validChords = rawChords.map(resolveChordItem).filter((c): c is ChordDefinition => c !== null);
      const items: TimelineChordItem[] = validChords.map((c, idx) => ({
        id: `prev-${prog.id}-${idx}`,
        chord: c,
        durationBeats: 4,
        genreContext: prog.genre,
        octaveOffset: 0,
      }));

      if (prog.melody && prog.melody.notes && prog.melody.notes.length > 0) {
        audioEngine.playMelodyWithChords(
          prog.melody.notes,
          items,
          prog.tempoBpm || 110,
          prog.melody.instrument || 'guitar',
          prog.instrument || 'piano',
          () => {},
          () => setPlayingId(null),
          prog.melody.octaveOffset || 0,
          0
        );
      } else {
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
    }
  };

  const handleLoad = (prog: SavedProgression) => {
    audioEngine.stopAll();
    setPlayingId(null);
    onLoadProgression(prog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="favorites-library-modal"
        className="bg-[#12151d] border border-[#232836] w-full max-w-2xl rounded-none p-4 md:p-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202534]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#181c28] border border-[#252c40] text-amber-400/80 flex items-center justify-center font-normal">
              <FolderHeart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">
                Biblioteca de Favoritos
              </h3>
              <p className="text-xs text-slate-400 font-light">
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
            className="p-1 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#252a3a] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterGenre('all')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'all'
                ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            Todas ({savedProgressions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('rock')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'rock'
                ? 'bg-[#222838] text-slate-100 border-rose-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            🎸 Rock
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('pop')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'pop'
                ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            ✨ Pop
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('electronic')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'electronic'
                ? 'bg-[#222838] text-slate-100 border-cyan-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            ⚡ Eletrônica
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('techno')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'techno'
                ? 'bg-[#222838] text-slate-100 border-purple-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            🎛️ Techno
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('punk')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'punk'
                ? 'bg-[#222838] text-slate-100 border-red-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            💥 Punk
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('ballad')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'ballad'
                ? 'bg-[#222838] text-slate-100 border-amber-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            🌙 Ballad
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('acoustic')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'acoustic'
                ? 'bg-[#222838] text-slate-100 border-emerald-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            🪕 Acústico
          </button>
          <button
            type="button"
            onClick={() => setFilterGenre('jazz')}
            className={`px-2.5 py-1 text-xs font-normal rounded-none border transition-all ${
              filterGenre === 'jazz'
                ? 'bg-[#222838] text-slate-100 border-blue-500/60 shadow-xs'
                : 'bg-[#161922] hover:bg-[#1d222e] text-slate-400 border-[#232836]'
            }`}
          >
            🎷 Jazz
          </button>
        </div>

        {/* Progression List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-light text-xs">
              Nenhuma progressão encontrada nesta categoria.
            </div>
          ) : (
            filtered.map((prog) => {
              const isCurrentlyPlaying = playingId === prog.id;

              return (
                <div
                  key={prog.id}
                  id={`fav-item-${prog.id}`}
                  className={`p-3 rounded-none border transition-all ${
                    isCurrentlyPlaying
                      ? 'bg-[#1b202c] border-indigo-500/60 shadow-xs'
                      : 'bg-[#161922] hover:bg-[#1b202c] border-[#232836]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-xs text-slate-200">
                          {prog.name}
                        </h4>
                        <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-none bg-[#12141a] text-slate-400 border border-[#222736] uppercase">
                          {getGenreLabel(prog.genre)}
                        </span>
                        {prog.isPreset && (
                          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-none bg-amber-950/30 text-amber-400 border border-amber-500/30">
                            Modelo
                          </span>
                        )}
                      </div>

                      {prog.description && (
                        <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-1">
                          {prog.description}
                        </p>
                      )}

                      {/* Date & Time saved / updated */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400 font-light flex-wrap">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>
                          {prog.isPreset
                            ? 'Modelo padrão Harmoniq'
                            : prog.updatedAt && prog.updatedAt > (prog.createdAt + 60000)
                            ? `Atualizada em ${formatProgressionDateTime(prog.updatedAt)}`
                            : `Salva em ${formatProgressionDateTime(prog.createdAt)}`}
                        </span>
                        {!prog.isPreset && prog.updatedAt && prog.updatedAt > (prog.createdAt + 60000) && (
                          <span className="text-[9px] text-amber-400 font-mono px-1 bg-amber-950/40 border border-amber-800/50">
                            editada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Play, Load, Overwrite, Export, Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => handlePlayProgression(prog)}
                        className={`p-1.5 rounded-none text-xs font-normal border transition-all active:translate-y-0.5 ${
                          isCurrentlyPlaying
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-[#1a1e28] hover:bg-[#222836] text-slate-300 border-[#272d3e]'
                        }`}
                        title={isCurrentlyPlaying ? 'Pausar' : 'Tocar Prévia'}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoad(prog)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-indigo-600/80 hover:bg-indigo-500/80 text-white text-xs font-normal border border-indigo-500/50 transition-all active:translate-y-0.5"
                      >
                        <span>Carregar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Overwrite with current timeline */}
                      {!prog.isPreset && onOverwriteProgression && currentTimelineLength > 0 && (
                        confirmOverwriteId === prog.id ? (
                          <div className="inline-flex items-center gap-1 p-0.5 bg-amber-950/40 border border-amber-600/60 text-xs animate-in fade-in duration-100">
                            <span className="text-[10px] text-amber-200 px-1">Sobrescrever?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onOverwriteProgression(prog);
                                setConfirmOverwriteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium"
                              title="Confirmar substituição"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmOverwriteId(null)}
                              className="px-1.5 py-0.5 bg-[#181c26] hover:bg-[#222836] text-slate-400 text-[10px]"
                              title="Cancelar"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmOverwriteId(prog.id)}
                            className="p-1.5 rounded-none bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 border border-amber-700/40 text-xs transition-colors flex items-center gap-1"
                            title={`Sobrescrever "${prog.name}" com os ${currentTimelineLength} acordes atuais da linha do tempo`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="hidden xl:inline text-[10px]">Sobrescrever</span>
                          </button>
                        )
                      )}

                      {onExportMidi && (
                        <button
                          type="button"
                          onClick={() => onExportMidi(prog)}
                          className="p-1.5 rounded-none bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-700/40 text-xs transition-colors"
                          title="Exportar esta progressão em MIDI (.mid)"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}

                      {!prog.isPreset && (
                        <button
                          type="button"
                          onClick={() => onDeleteProgression(prog.id)}
                          className="p-1 rounded-none bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chord sequence badges preview */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {Array.isArray(prog.chords) &&
                      prog.chords.map((chord, cIdx) => {
                        const resolved = resolveChordItem(chord);
                        const symbol =
                          resolved?.symbol ||
                          (typeof chord === 'string' ? chord : (chord as any)?.name || (chord as any)?.symbol || '?');
                        return (
                          <span
                            key={`${prog.id}-c-${cIdx}`}
                            className="px-1.5 py-0.5 rounded-none bg-[#12141a] font-normal text-xs text-slate-300 border border-[#222736]"
                          >
                            {symbol}
                          </span>
                        );
                      })}
                    <span className="text-[10px] text-slate-400 font-light ml-1.5">
                      {prog.tempoBpm} BPM • {prog.instrument === 'guitar' ? '🎸 Violão' : '🎹 Piano'}
                    </span>
                  </div>

                  {/* Melody indication if attached */}
                  {prog.melody && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#1e2330] text-[11px] text-indigo-300/90 font-light">
                      <Music className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>
                        Melodia salva:{' '}
                        <strong className="font-normal text-slate-200">
                          {prog.melody.name}
                        </strong>{' '}
                        ({prog.melody.instrument === 'guitar' ? '🎸 Violão' : '🎹 Piano'})
                      </span>
                    </div>
                  )}
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
  onSave: (name: string, description: string, includeMelody: boolean, overwriteId?: string) => void;
  defaultName: string;
  currentMelody?: SavedMelodyConfig | null;
  existingProgressions?: SavedProgression[];
}

export const SaveProgressionModal: React.FC<SaveProgressionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
  currentMelody,
  existingProgressions = [],
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [includeMelody, setIncludeMelody] = useState(true);
  const [overwriteMode, setOverwriteMode] = useState<'overwrite' | 'copy'>('overwrite');

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDescription('');
      setOverwriteMode('overwrite');
    }
  }, [defaultName, isOpen]);

  // Check if a saved progression with the exact same name already exists
  const trimmedName = name.trim().toLowerCase();
  const matchingExisting = useMemo(() => {
    if (!trimmedName) return null;
    return (
      existingProgressions.find(
        (p) => !p.isPreset && p.name.trim().toLowerCase() === trimmedName
      ) || null
    );
  }, [trimmedName, existingProgressions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;

    if (matchingExisting && overwriteMode === 'overwrite') {
      onSave(
        finalName,
        description.trim() || matchingExisting.description || '',
        includeMelody,
        matchingExisting.id
      );
    } else {
      const saveName =
        matchingExisting && overwriteMode === 'copy'
          ? `${finalName} (Cópia)`
          : finalName;
      onSave(saveName, description.trim(), includeMelody);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#12151d] border border-[#232836] w-full max-w-md rounded-none p-4 md:p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#202534]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-400/80" />
            <h3 className="text-sm font-medium text-slate-200">
              Salvar em Favoritos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-3">
          {/* Quick select existing progression to overwrite */}
          {existingProgressions.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Ou atualize uma salva:</span>
              <select
                value={matchingExisting?.id || ''}
                onChange={(e) => {
                  const selected = existingProgressions.find((p) => p.id === e.target.value);
                  if (selected) {
                    setName(selected.name);
                    if (selected.description) setDescription(selected.description);
                    setOverwriteMode('overwrite');
                  }
                }}
                className="bg-[#161a24] text-slate-300 text-[11px] border border-[#232938] px-2 py-0.5 rounded-none outline-none cursor-pointer max-w-[210px] truncate"
              >
                <option value="">-- Escolher existente --</option>
                {existingProgressions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-normal text-slate-300 mb-1">
              Nome da Progressão *
            </label>
            <input
              id="input-progression-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Minha Balada Romântica em Dó"
              className="w-full px-3 py-1.5 text-xs rounded-none bg-[#0f1117] border border-[#222736] text-slate-200 focus:border-indigo-500/60 outline-none font-normal"
            />
          </div>

          {/* Overwrite Duplicate Notice & Choices */}
          {matchingExisting && (
            <div className="p-3 rounded-none bg-amber-950/30 border border-amber-600/50 space-y-2 text-xs animate-in fade-in duration-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-medium text-amber-200">
                    Já existe uma progressão com o nome "{matchingExisting.name}"
                  </div>
                  <div className="text-[11px] text-amber-300/80 font-light flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>
                      {matchingExisting.updatedAt && matchingExisting.updatedAt > (matchingExisting.createdAt + 60000)
                        ? `Atualizada em ${formatProgressionDateTime(matchingExisting.updatedAt)}`
                        : `Salva em ${formatProgressionDateTime(matchingExisting.createdAt)}`}
                    </span>
                    <span>•</span>
                    <span>
                      {matchingExisting.chords.map((c) => resolveChordItem(c)?.symbol || '?').join(' - ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overwrite Choice */}
              <div className="pt-2 border-t border-amber-800/40 flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-normal">
                  <input
                    type="radio"
                    name="save-overwrite-choice"
                    checked={overwriteMode === 'overwrite'}
                    onChange={() => setOverwriteMode('overwrite')}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span className="font-medium text-amber-300">Sobrescrever existente</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-light">
                  <input
                    type="radio"
                    name="save-overwrite-choice"
                    checked={overwriteMode === 'copy'}
                    onChange={() => setOverwriteMode('copy')}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span>Salvar como nova cópia</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-normal text-slate-300 mb-1">
              Descrição / Notas (Opcional)
            </label>
            <textarea
              id="input-progression-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Refrão com violão de dedo e solo em escala menor..."
              className="w-full px-3 py-1.5 text-xs rounded-none bg-[#0f1117] border border-[#222736] text-slate-200 focus:border-indigo-500/60 outline-none font-light"
            />
          </div>

          {/* Melody information and toggle */}
          {currentMelody && (
            <div className="p-2.5 rounded-none bg-[#0e1017] border border-[#202534] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-normal">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Salvar melodia junto</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMelody}
                    onChange={(e) => setIncludeMelody(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-[#1f2432] peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-none after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="text-[11px] text-slate-400 font-light flex items-center justify-between">
                <span className="text-slate-300 truncate max-w-[220px]">
                  {currentMelody.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase shrink-0">
                  {currentMelody.instrument === 'guitar' ? '🎸 Violão' : '🎹 Piano'} •{' '}
                  {currentMelody.notes.length} notas
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-none text-xs font-normal text-slate-400 hover:text-slate-200 border border-transparent"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-save-progression"
              type="submit"
              className={`px-3.5 py-1.5 rounded-none text-xs font-normal border shadow-xs transition-all flex items-center gap-1.5 active:translate-y-0.5 ${
                matchingExisting && overwriteMode === 'overwrite'
                  ? 'bg-amber-600/90 hover:bg-amber-500/90 text-white border-amber-500 font-medium'
                  : 'bg-indigo-600/80 hover:bg-indigo-500/80 text-white border-indigo-500/50'
              }`}
            >
              {matchingExisting && overwriteMode === 'overwrite' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sobrescrever "{matchingExisting.name}"</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Salvar na Biblioteca</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

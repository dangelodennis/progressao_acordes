import React from 'react';
import { Genre } from '../types';
import {
  Radio,
  Moon,
  Sun,
  Smartphone,
  Maximize2,
  FolderHeart,
  Music4,
  BookOpen,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthButton } from './AuthButton';

interface AndroidHeaderProps {
  selectedGenre: Genre;
  onSelectGenre: (genre: Genre) => void;
  onOpenFavorites: () => void;
  savedCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileFrameMode: boolean;
  onToggleMobileFrameMode: () => void;
  syncStatus?: 'synced' | 'local' | 'syncing' | 'error';
  isSyncing?: boolean;
  onScrollToScaleDictionary?: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  selectedGenre,
  onSelectGenre,
  onOpenFavorites,
  savedCount,
  isDarkMode,
  onToggleDarkMode,
  isMobileFrameMode,
  onToggleMobileFrameMode,
  syncStatus = 'local',
  isSyncing = false,
  onScrollToScaleDictionary,
}) => {
  const genres: { id: Genre; label: string; icon: string; desc: string }[] = [
    { id: 'pop', label: 'Pop', icon: '✨', desc: 'Os 4 acordes mágicos, I-V-vi-IV e ganchos marcantes' },
    { id: 'rock', label: 'Rock', icon: '🎸', desc: 'Power chords, bVII e progressões enérgicas' },
    { id: 'electronic', label: 'Eletrônica', icon: '⚡', desc: 'EDM, Synthwave, ganchos eufóricos e pads densos' },
    { id: 'techno', label: 'Techno', icon: '🎛️', desc: 'Loops hipnóticos, cadência sombria e 130+ BPM' },
    { id: 'punk', label: 'Punk Rock', icon: '💥', desc: 'Power chords velozes, 3 acordes e atitude crua' },
    { id: 'ballad', label: 'Ballad', icon: '🌙', desc: 'Acordes maj7, nonas e o emotivo iv menor' },
    { id: 'acoustic', label: 'Acústico', icon: '🪕', desc: 'Dedilhados suaves e acordes abertos' },
    { id: 'blues', label: 'Blues', icon: '🎺', desc: 'Acordes dominantes com 7ª e cadências 12 bar' },
    { id: 'jazz', label: 'Jazz', icon: '🎷', desc: 'ii-V-I sofisticados com 7ª, 9ª e tensões ricas' },
  ];

  return (
    <header className="space-y-3 font-sans">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-[#1a1d26] text-indigo-400 flex items-center justify-center font-medium border border-[#2d3345] shadow-xs">
            <Music4 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-medium tracking-tight text-slate-200">
                Progressão de Acordes
              </h1>
              <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-none bg-[#1e222e] text-slate-400 border border-[#2d3345]">
                STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light tracking-tight">
              Harmonia inteligente, oitavas, escalas e diagramas
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Google Login & Cloud Sync Button */}
          <AuthButton syncStatus={syncStatus} isSyncing={isSyncing} />

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Favorites Button */}
          <button
            id="btn-header-favorites"
            type="button"
            onClick={onOpenFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#1c202a] hover:bg-[#232835] text-slate-300 border border-[#2d3345] text-xs font-normal transition-all active:translate-y-0.5"
            title="Minha Biblioteca de Favoritos"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="hidden sm:inline text-slate-300">Biblioteca</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-none bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center justify-center font-medium">
                {savedCount}
              </span>
            )}
          </button>

          {/* Scale Dictionary Shortcut Button */}
          {onScrollToScaleDictionary && (
            <button
              id="btn-header-scales"
              type="button"
              onClick={onScrollToScaleDictionary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#1c202a] hover:bg-[#232835] text-slate-300 border border-[#2d3345] text-xs font-normal transition-all active:translate-y-0.5"
              title="Abrir Dicionário de Escalas & Modos"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-slate-300">Escalas</span>
            </button>
          )}

          {/* Toggle Mobile Phone Frame / Fullscreen view */}
          <button
            id="btn-toggle-frame"
            type="button"
            onClick={onToggleMobileFrameMode}
            className="p-2 rounded-none bg-[#1c202a] hover:bg-[#232835] text-slate-400 hover:text-slate-200 border border-[#2d3345] transition-colors text-xs hidden md:flex items-center gap-1 active:translate-y-0.5"
            title={isMobileFrameMode ? 'Ver em Tela Cheia' : 'Ver Formato Celular'}
          >
            {isMobileFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-none transition-colors active:translate-y-0.5 border flex items-center justify-center ${
              isDarkMode
                ? 'bg-[#1c202a] hover:bg-[#232835] text-amber-400 hover:text-amber-300 border-[#2d3345]'
                : 'bg-white hover:bg-slate-100 text-indigo-600 hover:text-indigo-700 border-slate-300 shadow-xs'
            }`}
            title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20" />
            )}
          </button>
        </div>
      </div>

      {/* Genre Selector Tabs */}
      <div className="bg-[#141720] border border-[#232836] rounded-none p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-normal uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Estilo Musical</span>
          </span>
          <span className="text-[11px] font-light text-slate-500">
            Regras de harmonia & cadências
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {genres.map((g) => {
            const isSelected = selectedGenre === g.id;

            return (
              <button
                key={g.id}
                id={`genre-tab-${g.id}`}
                type="button"
                onClick={() => onSelectGenre(g.id)}
                className={`p-2.5 rounded-none border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#222838] text-slate-100 border-indigo-500/60 shadow-xs'
                    : 'bg-[#181c26] hover:bg-[#1f2432] border-[#252a38] text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base opacity-85">{g.icon}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-none bg-indigo-400" />
                  )}
                </div>
                <div className="mt-1.5">
                  <h4 className="font-normal text-xs leading-tight">{g.label}</h4>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

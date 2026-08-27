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
} from 'lucide-react';

interface AndroidHeaderProps {
  selectedGenre: Genre;
  onSelectGenre: (genre: Genre) => void;
  onOpenFavorites: () => void;
  savedCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileFrameMode: boolean;
  onToggleMobileFrameMode: () => void;
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
}) => {
  const genres: { id: Genre; label: string; icon: string; desc: string }[] = [
    { id: 'rock', label: 'Rock', icon: '🎸', desc: 'Power chords, bVII e progressões enérgicas' },
    { id: 'pop', label: 'Pop', icon: '✨', desc: 'Os 4 acordes mágicos, I-V-vi-IV e ganchos marcantes' },
    { id: 'ballad', label: 'Ballad', icon: '🌙', desc: 'Acordes maj7, nonas e o emotivo iv menor' },
    { id: 'blues', label: 'Blues', icon: '🎺', desc: 'Acordes dominantes com 7ª e cadências 12 bar' },
    { id: 'acoustic', label: 'Acústico', icon: '🪕', desc: 'Dedilhados suaves e acordes abertos' },
  ];

  return (
    <header className="space-y-3 font-sans">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-indigo-600 text-white flex items-center justify-center font-bold border border-indigo-400/40 shadow-sm">
            <Music4 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                Progressão de Acordes
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Harmonia inteligente, oitavas, escalas e diagramas
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Favorites Button */}
          <button
            id="btn-header-favorites"
            type="button"
            onClick={onOpenFavorites}
            className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-[#242834] hover:bg-[#2c3242] text-amber-300 border border-amber-500/30 text-xs font-bold transition-all active:translate-y-0.5"
            title="Minha Biblioteca de Favoritos"
          >
            <FolderHeart className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Biblioteca</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-none bg-amber-500 text-black text-[10px] flex items-center justify-center font-black">
                {savedCount}
              </span>
            )}
          </button>

          {/* Toggle Mobile Phone Frame / Fullscreen view */}
          <button
            id="btn-toggle-frame"
            type="button"
            onClick={onToggleMobileFrameMode}
            className="p-2 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-300 border border-[#333a4a] transition-colors text-xs hidden md:flex items-center gap-1 active:translate-y-0.5"
            title={isMobileFrameMode ? 'Ver em Tela Cheia' : 'Ver Formato Celular'}
          >
            {isMobileFrameMode ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-300 border border-[#333a4a] transition-colors active:translate-y-0.5"
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Genre Selector Tabs */}
      <div className="bg-[#1a1d26] border border-[#2d3342] rounded-none p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Estilo Musical Principal</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
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
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                    : 'bg-[#222632] hover:bg-[#282d3b] border-[#313747] text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{g.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-none bg-white animate-pulse" />
                  )}
                </div>
                <div className="mt-1.5">
                  <h4 className="font-bold text-xs leading-tight">{g.label}</h4>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

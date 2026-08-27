import React from 'react';
import { ChordDefinition, ChordSuggestion, Genre, InstrumentType } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import { Sparkles, Plus, Volume2, ArrowRight, Grid } from 'lucide-react';
import { getGenreLabel } from '../data/musicTheory';

interface ChordSuggestionsProps {
  suggestions: ChordSuggestion[];
  currentLastChord: ChordDefinition | null;
  genre: Genre;
  instrument: InstrumentType;
  onSelectAndAdd: (chord: ChordDefinition) => void;
  onPreviewOnly: (chord: ChordDefinition) => void;
  onOpenFullPicker: () => void;
  currentOctaveOffset?: number;
}

export const ChordSuggestions: React.FC<ChordSuggestionsProps> = ({
  suggestions,
  currentLastChord,
  genre,
  instrument,
  onSelectAndAdd,
  onPreviewOnly,
  onOpenFullPicker,
  currentOctaveOffset = 0,
}) => {
  const handleCardClick = (chord: ChordDefinition) => {
    audioEngine.playChord(chord, instrument, 1.4, currentOctaveOffset);
    onSelectAndAdd(chord);
  };

  const handlePreviewBtnClick = (e: React.MouseEvent, chord: ChordDefinition) => {
    e.stopPropagation();
    audioEngine.playChord(chord, instrument, 1.4, currentOctaveOffset);
    onPreviewOnly(chord);
  };

  return (
    <div
      id="chord-suggestions-panel"
      className="bg-[#1a1d26] border border-[#2d3342] rounded-none p-4 md:p-5 shadow-lg space-y-3"
    >
      {/* Suggestions Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-none bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>
                {currentLastChord
                  ? `Sugestões após ${currentLastChord.symbol}`
                  : `Escolha o 1º Acorde para ${getGenreLabel(genre)}`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {currentLastChord
                ? `Harmonia inteligente otimizada para o estilo ${getGenreLabel(genre)}`
                : `Selecione um acorde para o app começar a sugerir as próximas transições`}
            </p>
          </div>
        </div>

        {/* Explore all chords button */}
        <button
          id="btn-explore-all-chords"
          type="button"
          onClick={onOpenFullPicker}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#242834] hover:bg-[#2c3242] text-slate-200 text-xs font-bold border border-[#384050] transition-colors active:translate-y-0.5"
        >
          <Grid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Todos os Acordes</span>
        </button>
      </div>

      {/* Grid of smart suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {suggestions.map((item, idx) => {
          const { chord, reason, tag } = item;

          return (
            <div
              key={`${chord.id}-${idx}`}
              id={`suggestion-card-${chord.id}`}
              onClick={() => handleCardClick(chord)}
              className="group relative p-3.5 rounded-none bg-[#202430] hover:bg-[#252a38] border border-[#2e3444] hover:border-indigo-500 transition-all duration-150 cursor-pointer flex flex-col justify-between hover:shadow-md"
            >
              {/* Top tag & preview audio button */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-none bg-[#181b24] text-indigo-300 border border-[#384050]">
                  {tag}
                </span>

                <button
                  id={`btn-preview-${chord.id}`}
                  type="button"
                  onClick={(e) => handlePreviewBtnClick(e, chord)}
                  className="p-1.5 rounded-none bg-[#282d3c] hover:bg-[#333a4d] text-slate-300 border border-[#384050] transition-colors active:translate-y-0.5"
                  title="Ouvir acorde e ver detalhes"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>

              {/* Main Chord Info */}
              <div className="flex items-center gap-3 my-1">
                <div className="w-12 h-12 rounded-none bg-[#181b24] text-white flex items-center justify-center font-black text-xl border border-[#384050] group-hover:border-indigo-400 group-hover:bg-indigo-600 transition-colors shadow-sm">
                  {chord.symbol}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-white truncate">
                    {chord.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    Notas: {chord.noteNames.join(' ')}
                  </p>
                </div>
              </div>

              {/* Reason / Musical context */}
              <div className="mt-2.5 pt-2 border-t border-[#2e3444] text-xs">
                <p className="text-slate-300 text-[11px] leading-snug line-clamp-2">
                  {reason}
                </p>
              </div>

              {/* Bottom call to action */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                <span className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar na Timeline
                </span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { ChordDefinition, ChordSuggestion, Genre, InstrumentType } from '../types';
import { audioEngine } from '../utils/audioPlayer';
import { Sparkles, Plus, Volume2, ArrowRight, Grid, Dices } from 'lucide-react';
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
  onGenerateRandomProgression?: () => void;
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
  onGenerateRandomProgression,
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
      className="bg-[#141720] border border-[#232836] rounded-none p-3.5 md:p-4 shadow-xs space-y-3"
    >
      {/* Suggestions Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#181c26] border border-[#252a38] text-amber-400/80 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <span>
                {currentLastChord
                  ? `Sugestões após ${currentLastChord.symbol}`
                  : `Escolha o 1º Acorde para ${getGenreLabel(genre)}`}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-light">
              {currentLastChord
                ? `Harmonia inteligente otimizada para o estilo ${getGenreLabel(genre)}`
                : `Selecione um acorde para o app começar a sugerir as próximas transições`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onGenerateRandomProgression && (
            <button
              id="btn-generate-random-suggestions"
              type="button"
              onClick={onGenerateRandomProgression}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-normal border border-amber-500/30 transition-all active:translate-y-0.5"
              title={`Gerar uma progressão aleatória completa no estilo ${getGenreLabel(genre)}`}
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerar Aleatória</span>
            </button>
          )}

          {/* Explore all chords button */}
          <button
            id="btn-explore-all-chords"
            type="button"
            onClick={onOpenFullPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-300 text-xs font-normal border border-[#262c3c] transition-colors active:translate-y-0.5"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Todos os Acordes</span>
          </button>
        </div>
      </div>

      {/* Grid of smart suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {suggestions.map((item, idx) => {
          const { chord, reason, tag } = item;

          return (
            <div
              key={`${chord.id}-${idx}`}
              id={`suggestion-card-${chord.id}`}
              onClick={() => handleCardClick(chord)}
              className="group relative p-3 rounded-none bg-[#161922] hover:bg-[#1b202c] border border-[#242938] hover:border-indigo-500/50 transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-xs"
            >
              {/* Top tag & preview audio button */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[9px] font-normal uppercase px-1.5 py-0.5 rounded-none bg-[#12141a] text-slate-400 border border-[#222736]">
                  {tag}
                </span>

                <button
                  id={`btn-preview-${chord.id}`}
                  type="button"
                  onClick={(e) => handlePreviewBtnClick(e, chord)}
                  className="p-1 rounded-none bg-[#1a1e28] hover:bg-[#222836] text-slate-400 hover:text-slate-300 border border-[#272d3e] transition-colors active:translate-y-0.5"
                  title="Ouvir acorde e ver detalhes"
                >
                  <Volume2 className="w-3 h-3 text-indigo-400/80" />
                </button>
              </div>

              {/* Main Chord Info */}
              <div className="flex items-center gap-2.5 my-1">
                <div className="w-10 h-10 rounded-none bg-[#12141a] text-slate-200 flex items-center justify-center font-medium text-lg border border-[#262c3e] group-hover:border-indigo-500/60 group-hover:bg-[#1e2332] transition-colors shadow-xs">
                  {chord.symbol}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-xs text-slate-200 truncate">
                    {chord.name}
                  </h4>
                  <p className="text-[10px] font-light text-slate-400 truncate">
                    Notas: {chord.noteNames.join(' ')}
                  </p>
                </div>
              </div>

              {/* Reason / Musical context */}
              <div className="mt-2 pt-2 border-t border-[#202534] text-xs">
                <p className="text-slate-400 font-light text-[11px] leading-snug line-clamp-2">
                  {reason}
                </p>
              </div>

              {/* Bottom call to action */}
              <div className="mt-2 flex items-center justify-between text-[11px] font-normal text-indigo-400/80 group-hover:text-indigo-300">
                <span className="flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Adicionar
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

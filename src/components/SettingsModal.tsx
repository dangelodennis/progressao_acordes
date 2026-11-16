import React, { useEffect } from 'react';
import {
  ChordDefinition,
  ChordTimbre,
  CHORD_TIMBRE_OPTIONS,
  ChordPlaybackStyle,
  CHORD_PLAYBACK_STYLE_OPTIONS,
  InstrumentType,
} from '../types';
import { audioEngine } from '../utils/audioPlayer';
import {
  Settings,
  X,
  Volume2,
  AudioWaveform,
  Check,
  Sun,
  Moon,
  Smartphone,
  Maximize2,
  Music,
  Sparkles,
  Download,
  Wifi,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chordTimbre: ChordTimbre;
  onChordTimbreChange: (timbre: ChordTimbre) => void;
  chordPlaybackStyle: ChordPlaybackStyle;
  onChordPlaybackStyleChange: (style: ChordPlaybackStyle) => void;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  previewChord: ChordDefinition;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileFrameMode: boolean;
  onToggleMobileFrameMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  chordTimbre,
  onChordTimbreChange,
  chordPlaybackStyle,
  onChordPlaybackStyleChange,
  instrument,
  onInstrumentChange,
  previewChord,
  isDarkMode,
  onToggleDarkMode,
  isMobileFrameMode,
  onToggleMobileFrameMode,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTimbre = (timbre: ChordTimbre) => {
    onChordTimbreChange(timbre);
    audioEngine.setChordTimbre(timbre);
    audioEngine.playChord(previewChord, instrument, 1.5, 0);
  };

  const handleSelectPlaybackStyle = (style: ChordPlaybackStyle) => {
    onChordPlaybackStyleChange(style);
    audioEngine.setChordPlaybackStyle(style);
    audioEngine.playChord(previewChord, instrument, 1.6, 0, style);
  };

  const handlePreviewCurrentTimbre = () => {
    audioEngine.playChord(previewChord, instrument, 1.6, 0);
  };

  return (
    <div
      id="settings-panel-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3.5"
      onClick={onClose}
    >
      <div
        className="bg-[#12151e] border border-[#232838] w-full max-w-lg p-4 sm:p-5 shadow-2xl relative rounded-none space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202535]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-indigo-950/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-sm font-medium text-slate-100">
                Configurações do Estúdio
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Timbre do motor de áudio, instrumento e interface
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-200 border border-transparent hover:border-[#272d3e] transition-colors"
            title="Fechar Configurações"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Chord Audio Engine Timbre Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AudioWaveform className="w-3.5 h-3.5 text-amber-400" />
                <span>Timbre dos Acordes (Audio Engine)</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">
                Escolha o caráter sonoro usado ao tocar acordes na linha do tempo e pré-escutas
              </p>
            </div>

            <button
              id="btn-preview-chord-timbre"
              type="button"
              onClick={handlePreviewCurrentTimbre}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#181d2a] hover:bg-[#212838] text-indigo-300 border border-indigo-500/40 text-xs transition-colors active:translate-y-0.5"
              title={`Ouvir acorde ${previewChord.symbol} com o timbre atual`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Testar ({previewChord.symbol})</span>
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Seletor de timbre dos acordes"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {CHORD_TIMBRE_OPTIONS.map((option) => {
              const isSelected = chordTimbre === option.id;
              return (
                <button
                  key={option.id}
                  id={`btn-timbre-${option.id}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectTimbre(option.id)}
                  className={`p-3 rounded-none border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#1c2336] border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/30'
                      : 'bg-[#151822] hover:bg-[#1a1f2c] border-[#242a3b] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{option.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                          isSelected
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                            : 'bg-[#11141d] text-slate-400 border-[#242a3b]'
                        }`}
                      >
                        {option.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-light leading-snug">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1b: Individual Chord Playback Style (Block vs Arpeggio) */}
        <div className="pt-3 border-t border-[#202535] space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execução de Acordes Individuais</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">
                Define se cliques e pré-escutas de acordes tocam todas as notas juntas ou em arpejo
              </p>
            </div>

            <button
              id="btn-toggle-chord-arpeggio"
              type="button"
              role="switch"
              aria-checked={chordPlaybackStyle === 'arpeggio'}
              onClick={() =>
                handleSelectPlaybackStyle(
                  chordPlaybackStyle === 'arpeggio' ? 'block' : 'arpeggio'
                )
              }
              className={`flex items-center gap-2 px-2.5 py-1 rounded-none border text-xs transition-colors active:translate-y-0.5 ${
                chordPlaybackStyle === 'arpeggio'
                  ? 'bg-indigo-950/50 text-indigo-200 border-indigo-500/60'
                  : 'bg-[#181d2a] hover:bg-[#212838] text-slate-300 border-[#292f40]'
              }`}
              title="Alternar entre Acorde em Bloco e Arpejo Individual"
            >
              <span>Arpejo</span>
              <span
                className={`w-7 h-3.5 flex items-center p-0.5 border transition-colors ${
                  chordPlaybackStyle === 'arpeggio'
                    ? 'bg-indigo-600/80 border-indigo-400 justify-end'
                    : 'bg-[#11141d] border-[#2d3448] justify-start'
                }`}
              >
                <span className="w-2.5 h-2.5 bg-white block" />
              </span>
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Modo de execução de acordes individuais"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {CHORD_PLAYBACK_STYLE_OPTIONS.map((option) => {
              const isSelected = chordPlaybackStyle === option.id;
              return (
                <button
                  key={option.id}
                  id={`btn-playback-style-${option.id}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectPlaybackStyle(option.id)}
                  className={`p-3 rounded-none border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#1c2336] border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/30'
                      : 'bg-[#151822] hover:bg-[#1a1f2c] border-[#242a3b] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{option.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                          isSelected
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                            : 'bg-[#11141d] text-slate-400 border-[#242a3b]'
                        }`}
                      >
                        {option.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-light leading-snug">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Instrument */}
        <div className="pt-3 border-t border-[#202535] space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span>Instrumento & Voicing</span>
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-settings-inst-piano"
              type="button"
              onClick={() => onInstrumentChange('piano')}
              className={`px-3 py-2 rounded-none border text-xs flex items-center justify-center gap-2 transition-colors ${
                instrument === 'piano'
                  ? 'bg-[#1c2336] border-indigo-500/70 text-slate-100 font-medium'
                  : 'bg-[#151822] hover:bg-[#1a1f2c] border-[#242a3b] text-slate-400'
              }`}
            >
              <span>🎹 Piano / Teclado</span>
            </button>
            <button
              id="btn-settings-inst-guitar"
              type="button"
              onClick={() => onInstrumentChange('guitar')}
              className={`px-3 py-2 rounded-none border text-xs flex items-center justify-center gap-2 transition-colors ${
                instrument === 'guitar'
                  ? 'bg-[#1c2336] border-indigo-500/70 text-slate-100 font-medium'
                  : 'bg-[#151822] hover:bg-[#1a1f2c] border-[#242a3b] text-slate-400'
              }`}
            >
              <span>🎸 Violão / Guitarra</span>
            </button>
          </div>
        </div>

        {/* Section 3: Visual Preferences */}
        <div className="pt-3 border-t border-[#202535] space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-slate-300">
            Aparência & Layout
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="btn-settings-theme"
              type="button"
              onClick={onToggleDarkMode}
              className="px-3 py-2 rounded-none bg-[#151822] hover:bg-[#1a1f2c] border border-[#242a3b] text-xs text-slate-300 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Tema do Estúdio</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {isDarkMode ? 'Escuro' : 'Claro'}
              </span>
            </button>

            <button
              id="btn-settings-frame"
              type="button"
              onClick={onToggleMobileFrameMode}
              className="px-3 py-2 rounded-none bg-[#151822] hover:bg-[#1a1f2c] border border-[#242a3b] text-xs text-slate-300 flex items-center justify-between transition-colors hidden md:flex"
            >
              <span className="flex items-center gap-2">
                {isMobileFrameMode ? (
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Modo de Exibição</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {isMobileFrameMode ? 'Celular' : 'Tela Cheia'}
              </span>
            </button>
          </div>
        </div>

        {/* Section 4: PWA Installation & Offline Mode */}
        <div className="pt-3 border-t border-[#202535] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplicativo Instalável (PWA)</span>
            </h4>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 border flex items-center gap-1 ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-700/40'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Online • Cache Offline Pronto' : 'Modo Offline'}</span>
            </span>
          </div>

          <div className="p-3 bg-[#151822] border border-[#242a3b] flex flex-wrap items-center justify-between gap-2.5">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                {isInstalled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Aplicativo instalado (Modo Standalone)</span>
                  </>
                ) : (
                  <span>Instalar no Celular ou Computador</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-light leading-snug">
                {isInstalled
                  ? 'Você está executando o Progressão de Acordes como aplicativo nativo com suporte offline.'
                  : isInstallable
                  ? 'Adicione o estúdio à sua tela inicial para abrir em janela própria e usar mesmo sem internet.'
                  : isIOS
                  ? 'No Safari (iPhone/iPad): toque em Compartilhar e depois em "Adicionar à Tela de Início".'
                  : 'No navegador (Chrome/Edge), use o ícone de instalar na barra de endereço ou menu → "Instalar Progressão de Acordes".'}
              </p>
            </div>

            {!isInstalled && isInstallable && (
              <button
                id="btn-settings-install-pwa"
                type="button"
                onClick={() => void install()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-emerald-700/85 hover:bg-emerald-600/85 text-white text-xs font-medium border border-emerald-500/50 transition-colors shrink-0 active:translate-y-0.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#202535] flex justify-end">
          <button
            id="btn-settings-done"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-none bg-indigo-600/85 hover:bg-indigo-500/85 text-white text-xs font-medium border border-indigo-500/50 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { TimelineChordItem, SavedProgression, MelodyNote, InstrumentType, BackingTrackStyle } from '../types';
import { downloadMidiFile } from '../utils/midiExport';
import {
  Download,
  X,
  Music,
  CheckCircle2,
  Sliders,
  FileMusic,
  Sparkles,
  Layers,
  Repeat,
} from 'lucide-react';

interface ExportMidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: TimelineChordItem[];
  tempoBpm: number;
  instrument: InstrumentType;
  songTitle?: string;
  melodyNotes?: MelodyNote[] | null;
  melodyStyleName?: string;
  initialBackingStyle?: BackingTrackStyle;
}

export const ExportMidiModal: React.FC<ExportMidiModalProps> = ({
  isOpen,
  onClose,
  timeline,
  tempoBpm,
  instrument,
  songTitle = 'Harmoniq Progressao',
  melodyNotes,
  melodyStyleName,
  initialBackingStyle,
}) => {
  const [includeChords, setIncludeChords] = useState<boolean>(true);
  const [includeMelody, setIncludeMelody] = useState<boolean>(Boolean(melodyNotes && melodyNotes.length > 0));
  const [includeBacking, setIncludeBacking] = useState<boolean>(true);
  const [backingStyle, setBackingStyle] = useState<BackingTrackStyle>(() => {
    if (initialBackingStyle && initialBackingStyle !== 'none') return initialBackingStyle;
    try {
      const saved = localStorage.getItem('harmoniq_backing_style');
      if (saved && saved !== 'none') return saved as BackingTrackStyle;
    } catch {
      // ignore
    }
    return 'rock';
  });

  const [enableLooping, setEnableLooping] = useState<boolean>(false);
  const [loopCount, setLoopCount] = useState<number>(4);

  const [filename, setFilename] = useState<string>(() => {
    const safeTitle = songTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    return safeTitle || 'harmoniq-progressao';
  });
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const hasMelody = Boolean(melodyNotes && melodyNotes.length > 0);
  const effectiveCycles = enableLooping ? loopCount : 1;

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!includeChords && !includeMelody && !includeBacking) return;

    const exportBaseName =
      enableLooping && !filename.toLowerCase().includes('loop')
        ? `${filename}-loop`
        : filename;

    downloadMidiFile(
      {
        timeline,
        melodyNotes: includeMelody ? melodyNotes : null,
        tempoBpm,
        instrument,
        songTitle: exportBaseName,
        includeChords,
        includeMelody: includeMelody && hasMelody,
        includeBackingTrack: includeBacking && backingStyle !== 'none',
        backingStyle: includeBacking ? backingStyle : 'none',
        enableLooping,
        loopCount,
      },
      `${exportBaseName}.mid`
    );

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  const singleCycleBeats = timeline.reduce((sum, item) => sum + (item.durationBeats || 4), 0);
  const totalExportBeats = singleCycleBeats * effectiveCycles;
  const totalMeasures = (totalExportBeats / 4).toFixed(singleCycleBeats % 4 === 0 ? 0 : 1);
  const totalDurationSeconds = ((totalExportBeats * 60) / tempoBpm).toFixed(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="midi-export-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3.5"
    >
      <div className="bg-[#12151e] border border-[#232838] w-full max-w-md p-4 sm:p-5 shadow-2xl relative rounded-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202535]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-indigo-950/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 id="midi-export-modal-title" className="text-sm font-medium text-slate-100 flex items-center gap-2">
                Exportar Arquivo MIDI (.mid)
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Compatível com Ableton, FL Studio, Logic Pro, Reaper, Cubase ou GarageBand
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-200 border border-transparent hover:border-[#272d3e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-slate-100">
              Arquivo MIDI gerado com sucesso!
            </h4>
            <p className="text-xs text-slate-400 font-light">
              O download de <span className="text-indigo-400 font-mono">{enableLooping && !filename.toLowerCase().includes('loop') ? `${filename}-loop.mid` : `${filename}.mid`}</span> foi iniciado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleExport} className="space-y-4 pt-3.5">
            {/* File details overview */}
            <div className="p-3 bg-[#161a25] border border-[#23293a] space-y-2 rounded-none text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-light">Progressão:</span>
                <span className="font-medium text-slate-200">
                  {timeline.map((t) => t.chord.symbol).join(' → ') || 'Vazia'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-light">Tempo (Andamento):</span>
                <span className="font-mono text-indigo-400 font-medium">{tempoBpm} BPM</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-light">Compassos / Duração:</span>
                <span className="font-mono text-slate-200">
                  {totalMeasures} comp. (~{totalDurationSeconds}s)
                  {enableLooping && (
                    <span className="ml-1.5 text-[10px] text-amber-300">
                      ({loopCount === 1 ? 'Clipe alinhado' : `${loopCount}x loop`})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-light">Formato:</span>
                <span className="text-slate-300 font-mono">Standard MIDI (SMF Tipo 1 Multitrack)</span>
              </div>
            </div>

            {/* Track selection checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Pistas para Exportar (Canais MIDI separados):
              </label>

              {/* Chords Track Option */}
              <label
                className={`flex items-start gap-2.5 p-2.5 border rounded-none cursor-pointer transition-colors ${
                  includeChords
                    ? 'bg-[#181d2a] border-indigo-500/50'
                    : 'bg-[#141722] border-[#222838] opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeChords}
                  onChange={(e) => setIncludeChords(e.target.checked)}
                  disabled={timeline.length === 0}
                  className="mt-0.5 accent-indigo-500 rounded-none cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">
                      Pista 1: Harmonia / Acordes
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                      Canal 1 (Piano/Violão)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light">
                    Notas completas dos acordes divididas em compassos de 4 tempos com marcadores de nome de acorde.
                  </p>
                </div>
              </label>

              {/* Melody Track Option */}
              <label
                className={`flex items-start gap-2.5 p-2.5 border rounded-none cursor-pointer transition-colors ${
                  !hasMelody
                    ? 'opacity-40 cursor-not-allowed bg-[#141722] border-[#222838]'
                    : includeMelody
                    ? 'bg-[#181d2a] border-indigo-500/50'
                    : 'bg-[#141722] border-[#222838] opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeMelody}
                  onChange={(e) => setIncludeMelody(e.target.checked)}
                  disabled={!hasMelody}
                  className="mt-0.5 accent-indigo-500 rounded-none cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">
                      Pista 2: Linha Melódica (Solo / Lead)
                    </span>
                    {hasMelody ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                        {melodyNotes?.length} notas ({melodyStyleName || 'Melodia Ativa'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-light text-slate-400">
                        (Nenhuma melodia gerada no painel)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-light">
                    Linha melódica sequenciada com ritmo, graus da escala e notas solo independentes.
                  </p>
                </div>
              </label>

              {/* Backing Track Option (Bass & Drums GM) */}
              <div
                className={`p-2.5 border rounded-none transition-colors space-y-2 ${
                  includeBacking
                    ? 'bg-[#181d2a] border-indigo-500/50'
                    : 'bg-[#141722] border-[#222838] opacity-70'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBacking}
                    onChange={(e) => setIncludeBacking(e.target.checked)}
                    className="mt-0.5 accent-indigo-500 rounded-none cursor-pointer"
                  />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-200">
                        Pistas 3 & 4: Backing Track (Baixo + Bateria GM)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-amber-950/40 text-amber-300 border border-amber-800/40">
                        Canais 3 & 10 (GM)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light">
                      Linha de contrabaixo afinada nos acordes e bateria completa mapeada em General MIDI.
                    </p>
                  </div>
                </label>

                {includeBacking && (
                  <div className="flex items-center gap-2 pt-1 pl-6 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-light">Estilo do Groove:</span>
                    <select
                      value={backingStyle}
                      onChange={(e) => setBackingStyle(e.target.value as BackingTrackStyle)}
                      className="bg-[#12151e] border border-[#252c3e] text-slate-200 text-xs py-1 px-2 rounded-none outline-none cursor-pointer focus:border-indigo-500"
                    >
                      <option value="rock">🥁 Rock Clássico (8ths drive)</option>
                      <option value="funk">🕺 Funk (Slap & 16ths groove)</option>
                      <option value="reggae">🌴 Reggae (One Drop & deep roots)</option>
                      <option value="shuffle">🎷 Blues Shuffle (Walking bass)</option>
                      <option value="disco">🪩 Disco (Octaves & 4x4)</option>
                      <option value="bossa">☕ Bossa Nova (Rimshot acústico)</option>
                      <option value="punk">⚡ Punk Rock (Fast 8ths)</option>
                      <option value="techno">🎛️ Techno (Sub 4x4 & rolling bass)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* DAW Continuous Loop Option */}
            <div
              className={`p-3 border rounded-none transition-colors space-y-2.5 ${
                enableLooping
                  ? 'bg-[#171d2c] border-amber-500/50'
                  : 'bg-[#141722] border-[#222838]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1 border rounded-none ${
                    enableLooping
                      ? 'bg-amber-950/50 border-amber-600/50 text-amber-300'
                      : 'bg-[#181c28] border-[#252b3b] text-slate-400'
                  }`}>
                    <Repeat className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-200">
                        Modo Loop Contínuo (Para DAW)
                      </span>
                      {enableLooping && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-950/40 text-amber-300 border border-amber-700/50">
                          LOOP ATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-light leading-snug">
                      Alinha o fim exato da trilha ao compasso e grava marcadores de loop para arrastar direto no Ableton, FL Studio ou Logic.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  id="toggle-midi-looping"
                  type="button"
                  role="switch"
                  aria-checked={enableLooping}
                  onClick={() => setEnableLooping((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border transition-colors ${
                    enableLooping
                      ? 'bg-amber-500/80 border-amber-400'
                      : 'bg-[#1a1f2c] border-[#2d3548]'
                  }`}
                  title={enableLooping ? 'Desativar Modo Loop' : 'Ativar Modo Loop'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 bg-white transition-transform ${
                      enableLooping ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {enableLooping && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#242c40] flex-wrap">
                  <span className="text-[11px] text-slate-300 font-light">
                    Repetições da frase no arquivo:
                  </span>
                  <div className="inline-flex border border-[#283146] bg-[#12151e]">
                    {[
                      { val: 1, label: '1x (Clipe)' },
                      { val: 2, label: '2x' },
                      { val: 4, label: '4x' },
                      { val: 8, label: '8x' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        id={`btn-midi-loop-${opt.val}`}
                        type="button"
                        onClick={() => setLoopCount(opt.val)}
                        className={`px-2 py-1 text-[11px] font-mono transition-colors ${
                          loopCount === opt.val
                            ? 'bg-amber-500/20 text-amber-300 font-medium border-r border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200 border-r border-[#242b3d] last:border-r-0'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filename input */}
            <div className="space-y-1">
              <label htmlFor="midi-filename-input" className="text-xs font-medium text-slate-300 block">
                Nome do Arquivo (.mid):
              </label>
              <div className="flex items-center bg-[#10131b] border border-[#242a3a] px-2.5 py-1.5 rounded-none">
                <input
                  id="midi-filename-input"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="nome-do-arquivo"
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-hidden font-mono"
                  required
                />
                <span className="text-xs text-slate-500 font-mono ml-1">
                  {enableLooping && !filename.toLowerCase().includes('loop') ? '-loop.mid' : '.mid'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#202535]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-none bg-[#161a25] hover:bg-[#1d2232] text-slate-300 text-xs font-normal border border-[#272d3e] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={(!includeChords && !includeMelody && !includeBacking) || timeline.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium border border-indigo-500/60 shadow-xs transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar MIDI</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

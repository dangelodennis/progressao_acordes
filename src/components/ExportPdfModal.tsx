import React, { useState, useEffect, useMemo } from 'react';
import { TimelineChordItem, InstrumentType, DisplayMode } from '../types';
import { downloadProgressionPdf, PdfDiagramMode } from '../utils/pdfExport';
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: TimelineChordItem[];
  tempoBpm: number;
  instrument: InstrumentType;
  defaultDisplayMode: DisplayMode;
  genreLabel: string;
  songTitle: string;
  onSongTitleChange: (title: string) => void;
  artistOrSubtitle: string;
  onArtistOrSubtitleChange: (subtitle: string) => void;
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  fallbackTitle: string;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  timeline,
  tempoBpm,
  instrument,
  defaultDisplayMode,
  genreLabel,
  songTitle,
  onSongTitleChange,
  artistOrSubtitle,
  onArtistOrSubtitleChange,
  lyrics,
  onLyricsChange,
  fallbackTitle,
}) => {
  const [diagramMode, setDiagramMode] = useState<PdfDiagramMode>(defaultDisplayMode || 'guitar');
  const [uniqueDiagramsOnly, setUniqueDiagramsOnly] = useState<boolean>(true);
  const [includeScaleInfo, setIncludeScaleInfo] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const effectiveTitle = songTitle.trim() || fallbackTitle || 'Minha Progressão';

  useEffect(() => {
    if (isOpen) {
      setDiagramMode(defaultDisplayMode || 'guitar');
      const base = (songTitle.trim() || fallbackTitle || 'harmoniq-cifra')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFilename(base || 'harmoniq-cifra');
      setDownloadSuccess(false);
    }
  }, [isOpen, defaultDisplayMode, songTitle, fallbackTitle]);

  const uniqueChordCount = useMemo(() => {
    return new Set(timeline.map((t) => t.chord.symbol)).size;
  }, [timeline]);

  if (!isOpen) return null;

  const totalBeats = timeline.reduce((sum, item) => sum + (item.durationBeats || 4), 0);
  const totalMeasures = (totalBeats / 4).toFixed(totalBeats % 4 === 0 ? 0 : 1);

  const handleInsertLyricsTemplate = () => {
    const chordLine = timeline.map((t) => t.chord.symbol.padEnd(6, ' ')).join('  ').trimEnd();
    const template = [
      '[Intro]',
      chordLine || 'C     G     Am    F',
      '',
      '[Verso 1]',
      chordLine || 'C     G     Am    F',
      'Escreva aqui os versos alinhados com os acordes...',
      '',
      '[Refrão]',
      chordLine || 'C     G     Am    F',
      'Escreva aqui o refrão da música...',
    ].join('\n');

    onLyricsChange(lyrics.trim() ? `${lyrics.trimEnd()}\n\n${template}` : template);
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeline.length === 0) return;

    downloadProgressionPdf(
      {
        timeline,
        songTitle: effectiveTitle,
        artistOrSubtitle,
        genreLabel,
        tempoBpm,
        instrument,
        diagramMode,
        uniqueDiagramsOnly,
        includeScaleInfo,
        lyrics,
      },
      filename || effectiveTitle
    );

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  const safeDisplayFilename =
    (filename || 'harmoniq-cifra')
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'harmoniq-cifra';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-export-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3.5"
    >
      <div className="bg-[#12151e] border border-[#232838] w-full max-w-lg p-4 sm:p-5 shadow-2xl relative rounded-none max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202535]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-rose-950/40 border border-rose-700/50 flex items-center justify-center text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="pdf-export-modal-title" className="text-sm font-medium text-slate-100">
                Exportar Cifra & Progressão em PDF
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Gera um arquivo .pdf pronto para impressão com acordes, diagramas e letra
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-slate-400 hover:text-slate-200 border border-transparent hover:border-[#272d3e] transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-2.5 text-center">
            <div className="w-12 h-12 rounded-none bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-slate-100">
              Arquivo PDF gerado com sucesso!
            </h4>
            <p className="text-xs text-slate-400 font-light">
              O download de <span className="text-rose-300 font-mono">{safeDisplayFilename}.pdf</span> foi iniciado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleExport} className="space-y-3.5 pt-3.5">
            {/* Summary Info Box */}
            <div className="p-2.5 bg-[#161a25] border border-[#23293a] space-y-1.5 rounded-none text-xs">
              <div className="flex items-center justify-between gap-2 text-slate-300">
                <span className="text-slate-400 font-light">Progressão:</span>
                <span className="font-medium text-slate-200 truncate max-w-[280px]">
                  {timeline.map((t) => t.chord.symbol).join(' → ') || 'Vazia'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-light">Estrutura & Diagramas:</span>
                <span className="font-mono text-[11px] text-indigo-300">
                  {totalMeasures} comp. • {tempoBpm} BPM • {uniqueChordCount} {uniqueChordCount === 1 ? 'acorde único' : 'acordes únicos'}
                </span>
              </div>
            </div>

            {/* Song Title & Artist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="pdf-song-title" className="text-xs font-medium text-slate-300 block">
                  Título da Música
                </label>
                <input
                  id="pdf-song-title"
                  type="text"
                  value={songTitle}
                  onChange={(e) => onSongTitleChange(e.target.value)}
                  placeholder={fallbackTitle || 'Ex: Minha Nova Canção'}
                  className="w-full bg-[#10131b] border border-[#242a3a] focus:border-indigo-500 px-2.5 py-1.5 text-xs text-slate-200 rounded-none outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="pdf-artist-subtitle" className="text-xs font-medium text-slate-300 block">
                  Artista / Subtítulo (Opcional)
                </label>
                <input
                  id="pdf-artist-subtitle"
                  type="text"
                  value={artistOrSubtitle}
                  onChange={(e) => onArtistOrSubtitleChange(e.target.value)}
                  placeholder="Ex: Tom Original / Arranjo"
                  className="w-full bg-[#10131b] border border-[#242a3a] focus:border-indigo-500 px-2.5 py-1.5 text-xs text-slate-200 rounded-none outline-none"
                />
              </div>
            </div>

            {/* Diagram Format Selector */}
            <div className="p-2.5 bg-[#151924] border border-[#222838] space-y-2.5 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-200">
                  Diagramas de Posição
                </span>

                <div className="inline-flex p-0.5 rounded-none bg-[#10131b] border border-[#242a3a]">
                  {(
                    [
                      { id: 'guitar', label: '🎸 Violão' },
                      { id: 'piano', label: '🎹 Teclado' },
                      { id: 'both', label: 'Ambos' },
                    ] as { id: PdfDiagramMode; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      id={`btn-pdf-diagram-${opt.id}`}
                      type="button"
                      onClick={() => setDiagramMode(opt.id)}
                      className={`px-2.5 py-1 text-[11px] font-normal rounded-none transition-colors ${
                        diagramMode === opt.id
                          ? 'bg-[#222838] text-slate-100 border border-indigo-500/60'
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1 border-t border-[#1e2433]">
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    id="chk-pdf-unique-diagrams"
                    type="checkbox"
                    checked={uniqueDiagramsOnly}
                    onChange={(e) => setUniqueDiagramsOnly(e.target.checked)}
                    className="accent-indigo-500 rounded-none cursor-pointer"
                  />
                  <span>Agrupar diagramas por acordes únicos</span>
                </label>

                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    id="chk-pdf-include-scales"
                    type="checkbox"
                    checked={includeScaleInfo}
                    onChange={(e) => setIncludeScaleInfo(e.target.checked)}
                    className="accent-indigo-500 rounded-none cursor-pointer"
                  />
                  <span>Incluir nome da escala</span>
                </label>
              </div>
            </div>

            {/* Optional Song Lyrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="pdf-lyrics-textarea" className="text-xs font-medium text-slate-300">
                  Letra da Música (Opcional)
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-pdf-insert-template"
                    type="button"
                    onClick={handleInsertLyricsTemplate}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-normal bg-[#1a1f2d] hover:bg-[#23293b] text-indigo-300 border border-indigo-700/40 rounded-none transition-colors"
                    title="Inserir estrutura de verso/refrão usando os acordes atuais da timeline"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Inserir Modelo c/ Acordes</span>
                  </button>

                  {lyrics.trim().length > 0 && (
                    <button
                      id="btn-pdf-clear-lyrics"
                      type="button"
                      onClick={() => onLyricsChange('')}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-normal bg-[#1a1e28] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#262c3e] rounded-none transition-colors"
                      title="Limpar letra"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="pdf-lyrics-textarea"
                rows={5}
                value={lyrics}
                onChange={(e) => onLyricsChange(e.target.value)}
                placeholder={'Cole ou digite a letra da música aqui (opcional)...\nDica: linhas com cifras acima da letra (ex: "C      G      Am") ou seções como "[Refrão]" são formatadas automaticamente.'}
                className="w-full bg-[#10131b] border border-[#242a3a] focus:border-indigo-500 px-2.5 py-2 text-xs text-slate-200 font-mono leading-relaxed rounded-none outline-none resize-y"
              />
              <p className="text-[10px] text-slate-400 font-light">
                {lyrics.trim().length > 0
                  ? `${lyrics.trim().split('\n').length} linha(s) serão incluídas abaixo dos diagramas.`
                  : 'Se ficar em branco, o PDF será gerado apenas com a progressão e os diagramas.'}
              </p>
            </div>

            {/* Filename input */}
            <div className="space-y-1">
              <label htmlFor="pdf-filename-input" className="text-xs font-medium text-slate-300 block">
                Nome do Arquivo (.pdf)
              </label>
              <div className="flex items-center bg-[#10131b] border border-[#242a3a] px-2.5 py-1.5 rounded-none">
                <input
                  id="pdf-filename-input"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="harmoniq-cifra"
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-hidden font-mono"
                />
                <span className="text-xs text-slate-500 font-mono ml-1">.pdf</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[#202535]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-none bg-[#161a25] hover:bg-[#1d2232] text-slate-300 text-xs font-normal border border-[#272d3e] transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-export-pdf"
                type="submit"
                disabled={timeline.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-none bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium border border-rose-500/60 shadow-xs transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

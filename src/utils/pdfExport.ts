import { jsPDF } from 'jspdf';
import { ChordDefinition, InstrumentType, TimelineChordItem } from '../types';
import { getTimelineKeyRoot } from './transposition';

export type PdfDiagramMode = 'guitar' | 'piano' | 'both';

export interface PdfExportOptions {
  timeline: TimelineChordItem[];
  songTitle: string;
  artistOrSubtitle?: string;
  genreLabel?: string;
  tempoBpm: number;
  instrument: InstrumentType;
  diagramMode: PdfDiagramMode;
  uniqueDiagramsOnly?: boolean;
  includeScaleInfo?: boolean;
  lyrics?: string;
}

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN_X = 15;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 180mm

/**
 * Normalizes strings to Latin-1 / WinAnsi safe characters for built-in jsPDF fonts
 */
function pdfSafeText(text: string): string {
  return (text || '')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/•/g, '-')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/✕/g, 'X')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');
}

/**
 * Draws a crisp vector guitar chord diagram inside the PDF
 */
function drawGuitarDiagramPdf(
  doc: jsPDF,
  chord: ChordDefinition,
  x: number,
  y: number,
  boxWidth: number
): void {
  const { frets, fingers, baseFret = 1, barre } = chord.guitar;

  // Determine visible fret span (4 frets standard, expand to 5 if needed)
  let maxRelFret = 4;
  for (const f of frets) {
    if (f > 0) {
      const rel = f - baseFret + 1;
      if (rel > maxRelFret && rel <= 6) {
        maxRelFret = rel;
      }
    }
  }
  const numFrets = Math.min(5, Math.max(4, maxRelFret));
  const numStrings = 6;

  const gridWidth = 22;
  const gridHeight = numFrets === 5 ? 24 : 21;
  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  const gridLeft = x + (boxWidth - gridWidth) / 2 + 1.5;
  const gridTop = y + 10.5;

  // Chord symbol title above diagram
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 28, 42);
  doc.text(pdfSafeText(chord.symbol), x + boxWidth / 2, y + 4.5, { align: 'center' });

  // Base fret marker (e.g. "3a") if > 1
  if (baseFret > 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`${baseFret}a`, gridLeft - 2.2, gridTop + fretSpacing * 0.7, { align: 'right' });
  }

  // Top nut or thin line
  if (baseFret === 1) {
    doc.setFillColor(30, 41, 59);
    doc.rect(gridLeft, gridTop - 0.9, gridWidth, 1.1, 'F');
  } else {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.35);
    doc.line(gridLeft, gridTop, gridLeft + gridWidth, gridTop);
  }

  // Horizontal fret lines
  doc.setDrawColor(180, 188, 200);
  doc.setLineWidth(0.22);
  for (let f = 1; f <= numFrets; f++) {
    const fy = gridTop + f * fretSpacing;
    doc.line(gridLeft, fy, gridLeft + gridWidth, fy);
  }

  // Vertical string lines (6th to 1st)
  for (let s = 0; s < numStrings; s++) {
    const sx = gridLeft + s * stringSpacing;
    doc.setDrawColor(110, 120, 138);
    doc.setLineWidth(0.32 - s * 0.03);
    doc.line(sx, gridTop, sx, gridTop + gridHeight);
  }

  // Barre block if present
  if (barre) {
    const relBarreFret = barre.fret - baseFret + 1;
    if (relBarreFret >= 1 && relBarreFret <= numFrets) {
      const fromIdx = 6 - barre.fromString;
      const toIdx = 6 - barre.toString;
      const bx1 = gridLeft + Math.min(fromIdx, toIdx) * stringSpacing - 1.2;
      const bw = Math.abs(toIdx - fromIdx) * stringSpacing + 2.4;
      const by = gridTop + (relBarreFret - 1) * fretSpacing + fretSpacing * 0.28;
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(bx1, by, bw, fretSpacing * 0.44, 'F');
    }
  }

  // Open / Muted symbols & Finger dots
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
  for (let s = 0; s < numStrings; s++) {
    const fretVal = frets[s] ?? -1;
    const sx = gridLeft + s * stringSpacing;

    if (fretVal === -1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(190, 18, 60); // rose-700
      doc.text('x', sx, gridTop - 2.1, { align: 'center' });
    } else if (fretVal === 0) {
      doc.setDrawColor(5, 150, 105); // emerald-600
      doc.setLineWidth(0.35);
      doc.circle(sx, gridTop - 2.7, 0.95, 'S');
    } else {
      const relFret = fretVal - baseFret + 1;
      if (relFret >= 1 && relFret <= numFrets) {
        const cy = gridTop + (relFret - 0.5) * fretSpacing;
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.circle(sx, cy, 1.55, 'F');

        const finger = fingers ? fingers[s] : null;
        if (finger && finger > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(255, 255, 255);
          doc.text(String(finger), sx, cy + 0.65, { align: 'center' });
        }
      }
    }

    // String names underneath
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(stringNames[s], sx, gridTop + gridHeight + 3, { align: 'center' });
  }
}

/**
 * Draws a crisp 2-octave vector piano chord diagram inside the PDF
 */
function drawPianoDiagramPdf(
  doc: jsPDF,
  chord: ChordDefinition,
  x: number,
  y: number,
  boxWidth: number
): void {
  const notesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const whiteCountTotal = 14; // 2 octaves
  const kbWidth = Math.min(boxWidth - 6, 36);
  const whiteW = kbWidth / whiteCountTotal;
  const whiteH = 12.5;
  const blackW = whiteW * 0.62;
  const blackH = whiteH * 0.6;

  const kbLeft = x + (boxWidth - kbWidth) / 2;
  const kbTop = y + 8;

  // Normalized note names (strip octave, handle flats enharmonically for highlight match)
  const enharmonicMap: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
    Cb: 'B',
    Fb: 'E',
    'E#': 'F',
    'B#': 'C',
  };
  const normalizePitch = (n: string) => {
    const clean = n.replace(/\d+$/, '');
    return enharmonicMap[clean] || clean;
  };

  const activeSet = new Set((chord.noteNames || []).map(normalizePitch));
  const rootNorm = normalizePitch(chord.root);

  // Chord symbol title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 28, 42);
  doc.text(pdfSafeText(chord.symbol), x + boxWidth / 2, y + 4.5, { align: 'center' });

  // Draw white keys first
  let whiteIdx = 0;
  const blackKeysToDraw: { left: number; noteNorm: string }[] = [];

  for (let oct = 0; oct < 2; oct++) {
    for (const noteName of notesOrder) {
      const isBlack = noteName.includes('#');
      if (!isBlack) {
        const kx = kbLeft + whiteIdx * whiteW;
        const isChordNote = activeSet.has(noteName);
        const isRoot = noteName === rootNorm;

        if (isChordNote) {
          if (isRoot) {
            doc.setFillColor(245, 158, 11); // amber-500
          } else {
            doc.setFillColor(79, 70, 229); // indigo-600
          }
        } else {
          doc.setFillColor(255, 255, 255);
        }

        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.2);
        doc.rect(kx, kbTop, whiteW, whiteH, 'FD');
        whiteIdx++;
      } else {
        const kx = kbLeft + whiteIdx * whiteW - blackW / 2;
        blackKeysToDraw.push({ left: kx, noteNorm: noteName });
      }
    }
  }

  // Draw black keys on top
  for (const bk of blackKeysToDraw) {
    const isChordNote = activeSet.has(bk.noteNorm);
    const isRoot = bk.noteNorm === rootNorm;

    if (isChordNote) {
      if (isRoot) {
        doc.setFillColor(217, 119, 6); // amber-600
      } else {
        doc.setFillColor(99, 102, 241); // indigo-500
      }
    } else {
      doc.setFillColor(30, 41, 59);
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.18);
    doc.rect(bk.left, kbTop, blackW, blackH, 'FD');
  }

  // Note names caption beneath keyboard
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const notesLine = pdfSafeText((chord.noteNames || []).join(' - '));
  doc.text(notesLine, x + boxWidth / 2, kbTop + whiteH + 4, { align: 'center' });
}

/**
 * Builds the jsPDF document containing the chord progression, chord diagrams, and optional lyrics.
 */
export function buildProgressionPdf(options: PdfExportOptions): jsPDF {
  const {
    timeline,
    songTitle,
    artistOrSubtitle,
    genreLabel,
    tempoBpm,
    instrument,
    diagramMode,
    uniqueDiagramsOnly = true,
    includeScaleInfo = false,
    lyrics = '',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let cursorY = MARGIN_TOP;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = MARGIN_TOP;
      // Subtle continuation header on new pages
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 148);
      doc.text(pdfSafeText(`${songTitle || 'Progressao de Acordes'} (continuacao)`), MARGIN_X, cursorY);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(MARGIN_X, cursorY + 2, PAGE_WIDTH - MARGIN_X, cursorY + 2);
      cursorY += 8;
    }
  };

  // =========================================================================
  // 1. HEADER BAND
  // =========================================================================
  doc.setFillColor(79, 70, 229); // indigo-600 accent bar
  doc.rect(MARGIN_X, cursorY, 3, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(
    pdfSafeText(songTitle.trim() || 'Progressao de Acordes'),
    CONTENT_WIDTH - 8
  );
  doc.text(titleLines[0] || 'Progressao de Acordes', MARGIN_X + 6, cursorY + 5.5);

  const keyRoot = getTimelineKeyRoot(timeline);
  const totalBeats = timeline.reduce((sum, item) => sum + (item.durationBeats || 4), 0);
  const totalMeasures = (totalBeats / 4).toFixed(totalBeats % 4 === 0 ? 0 : 1);
  const totalSeconds = Math.round((totalBeats * 60) / (tempoBpm || 110));

  const metaParts: string[] = [];
  if (artistOrSubtitle?.trim()) metaParts.push(artistOrSubtitle.trim());
  if (genreLabel) metaParts.push(`Estilo: ${genreLabel}`);
  if (keyRoot) metaParts.push(`Tom: ${keyRoot}`);
  metaParts.push(`${tempoBpm} BPM`);
  metaParts.push(`${totalMeasures} compassos (~${totalSeconds}s)`);
  metaParts.push(`Instrumento: ${instrument === 'guitar' ? 'Violao/Guitarra' : 'Piano/Teclado'}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const metaLine = doc.splitTextToSize(pdfSafeText(metaParts.join('  |  ')), CONTENT_WIDTH - 8);
  doc.text(metaLine, MARGIN_X + 6, cursorY + 11.5);

  cursorY += 16 + Math.max(0, (metaLine.length - 1) * 4);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X, cursorY);
  cursorY += 7;

  // =========================================================================
  // 2. CHORD PROGRESSION SEQUENCE GRID
  // =========================================================================
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SEQUENCIA DA PROGRESSAO', MARGIN_X, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${timeline.length} ${timeline.length === 1 ? 'acorde' : 'acordes'} (${totalBeats} tempos)`,
    PAGE_WIDTH - MARGIN_X,
    cursorY,
    { align: 'right' }
  );
  cursorY += 4.5;

  if (timeline.length > 0) {
    const cols = 4;
    const gap = 3;
    const cardW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
    const cardH = 16;

    for (let i = 0; i < timeline.length; i += cols) {
      ensureSpace(cardH + 3);
      for (let c = 0; c < cols; c++) {
        const idx = i + c;
        if (idx >= timeline.length) break;

        const item = timeline[idx];
        const cx = MARGIN_X + c * (cardW + gap);
        const cy = cursorY;

        // Card box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.28);
        doc.rect(cx, cy, cardW, cardH, 'FD');

        // Left indigo bar on card
        doc.setFillColor(99, 102, 241);
        doc.rect(cx, cy, 1.3, cardH, 'F');

        // Step index + duration
        const stepStr = String(idx + 1).padStart(2, '0');
        const durBeats = item.durationBeats || 4;
        const octTag =
          item.octaveOffset && item.octaveOffset !== 0
            ? ` | ${item.octaveOffset > 0 ? `+${item.octaveOffset}` : item.octaveOffset} 8va`
            : '';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(`#${stepStr}`, cx + 3, cy + 4);
        doc.text(pdfSafeText(`${durBeats}t${octTag}`), cx + cardW - 2.2, cy + 4, { align: 'right' });

        // Chord symbol
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(pdfSafeText(item.chord.symbol), cx + 3, cy + 10);

        // Chord note names
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        const noteText = pdfSafeText((item.chord.noteNames || []).join(' - '));
        doc.text(noteText, cx + 3, cy + 14);
      }
      cursorY += cardH + 2.5;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum acorde na linha do tempo.', MARGIN_X, cursorY + 5);
    cursorY += 10;
  }

  cursorY += 4;

  // =========================================================================
  // 3. CHORD POSITION DIAGRAMS
  // =========================================================================
  const chordsForDiagrams: ChordDefinition[] = [];
  if (uniqueDiagramsOnly) {
    const seenSymbols = new Set<string>();
    for (const item of timeline) {
      if (!seenSymbols.has(item.chord.symbol)) {
        seenSymbols.add(item.chord.symbol);
        chordsForDiagrams.push(item.chord);
      }
    }
  } else {
    for (const item of timeline) {
      chordsForDiagrams.push(item.chord);
    }
  }

  if (chordsForDiagrams.length > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('DIAGRAMAS DE POSICAO DOS ACORDES', MARGIN_X, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const modeLabel =
      diagramMode === 'both'
        ? 'Violao & Teclado'
        : diagramMode === 'guitar'
        ? 'Violao / Guitarra'
        : 'Teclado / Piano';
    doc.text(
      pdfSafeText(`${modeLabel} (${chordsForDiagrams.length} ${chordsForDiagrams.length === 1 ? 'diagrama' : 'diagramas'})`),
      PAGE_WIDTH - MARGIN_X,
      cursorY,
      { align: 'right' }
    );
    cursorY += 4.5;

    const diagCols = diagramMode === 'both' ? 2 : diagramMode === 'piano' ? 3 : 4;
    const diagGap = 3.5;
    const diagCardW = (CONTENT_WIDTH - diagGap * (diagCols - 1)) / diagCols;

    // Calculate consistent card height based on mode & optional scale caption
    const baseHeight =
      diagramMode === 'both' ? 42 : diagramMode === 'guitar' ? 42 : 30;
    const diagCardH = includeScaleInfo ? baseHeight + 8 : baseHeight;

    for (let i = 0; i < chordsForDiagrams.length; i += diagCols) {
      ensureSpace(diagCardH + 3);
      for (let c = 0; c < diagCols; c++) {
        const idx = i + c;
        if (idx >= chordsForDiagrams.length) break;

        const chord = chordsForDiagrams[idx];
        const dx = MARGIN_X + c * (diagCardW + diagGap);
        const dy = cursorY;

        // Container box
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(215, 222, 232);
        doc.setLineWidth(0.28);
        doc.rect(dx, dy, diagCardW, diagCardH, 'FD');

        if (diagramMode === 'guitar') {
          drawGuitarDiagramPdf(doc, chord, dx, dy + 1, diagCardW);
        } else if (diagramMode === 'piano') {
          drawPianoDiagramPdf(doc, chord, dx, dy + 1.5, diagCardW);
        } else {
          // Side-by-side Guitar + Piano inside wider 2-col card
          const halfW = diagCardW / 2;
          drawGuitarDiagramPdf(doc, chord, dx, dy + 1, halfW);
          drawPianoDiagramPdf(doc, chord, dx + halfW, dy + 5, halfW);
        }

        if (includeScaleInfo && chord.scale?.name) {
          doc.setDrawColor(235, 239, 245);
          doc.setLineWidth(0.2);
          doc.line(dx + 2, dy + diagCardH - 6.5, dx + diagCardW - 2, dy + diagCardH - 6.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(79, 70, 229);
          const scaleStr = pdfSafeText(`Escala: ${chord.scale.name}`);
          const clippedScale = doc.splitTextToSize(scaleStr, diagCardW - 4)[0] || '';
          doc.text(clippedScale, dx + diagCardW / 2, dy + diagCardH - 2.6, { align: 'center' });
        }
      }
      cursorY += diagCardH + 3;
    }
  }

  // =========================================================================
  // 4. LYRICS SECTION (Rendered only when lyrics exist)
  // =========================================================================
  const trimmedLyrics = lyrics.trim();
  if (trimmedLyrics.length > 0) {
    cursorY += 4;
    ensureSpace(22);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('LETRA DA MUSICA', MARGIN_X, cursorY);
    cursorY += 5.5;

    const rawLines = lyrics.replace(/\r\n/g, '\n').split('\n');
    const lineHeight = 4.8;

    for (const rawLine of rawLines) {
      const safeLine = pdfSafeText(rawLine);
      const trimmed = safeLine.trim();

      // Blank line -> vertical paragraph gap
      if (trimmed.length === 0) {
        cursorY += 3.2;
        continue;
      }

      // Section label like [Verso 1], [Refrao], [Intro], [Ponte], etc.
      const isSectionHeading = /^\[[^\]]+\]:?$/.test(trimmed);
      if (isSectionHeading) {
        ensureSpace(9);
        cursorY += 1.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(79, 70, 229);
        doc.text(trimmed, MARGIN_X, cursorY);
        cursorY += 5.2;
        continue;
      }

      // Detect chord-only lines above lyrics (e.g. "C      G/B     Am7   F")
      const tokens = trimmed.split(/\s+/);
      const chordTokenRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add)?\d*(\([^)]+\))?(\/[A-G][#b]?)?$/;
      const isChordLine =
        tokens.length > 0 && tokens.every((tok) => chordTokenRegex.test(tok) || tok === '|' || tok === '-');

      if (isChordLine) {
        ensureSpace(lineHeight);
        doc.setFont('courier', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(79, 70, 229);
        doc.text(safeLine, MARGIN_X, cursorY);
        cursorY += lineHeight * 0.92;
      } else {
        doc.setFont('courier', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const wrapped = doc.splitTextToSize(safeLine, CONTENT_WIDTH);
        for (const wLine of wrapped) {
          ensureSpace(lineHeight);
          doc.text(wLine, MARGIN_X, cursorY);
          cursorY += lineHeight;
        }
      }
    }
  }

  // =========================================================================
  // 5. PAGE FOOTERS
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('pt-BR');
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 148);
    doc.text(
      pdfSafeText(`Harmoniq  -  ${songTitle.trim() || 'Progressao de Acordes'}  (${dateStr})`),
      MARGIN_X,
      PAGE_HEIGHT - 7.5
    );
    doc.text(`Pagina ${p} de ${totalPages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 7.5, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Generates and triggers download of the PDF file
 */
export function downloadProgressionPdf(options: PdfExportOptions, filename?: string): void {
  const doc = buildProgressionPdf(options);
  const safeBase = (filename || options.songTitle || 'harmoniq-cifra')
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const finalFilename = `${safeBase || 'harmoniq-cifra'}.pdf`;
  doc.save(finalFilename);
}

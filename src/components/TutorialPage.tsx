import React, { useState, useEffect } from 'react';
import { ChordPlaybackStyle, InstrumentType } from '../types';
import { CHORD_DATABASE } from '../data/musicTheory';
import { audioEngine } from '../utils/audioPlayer';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FolderHeart,
  GraduationCap,
  Music2,
  Play,
  Settings,
  Sparkles,
  Volume2,
} from 'lucide-react';

export type TutorialPanelTarget =
  | 'genre'
  | 'timeline'
  | 'suggestions'
  | 'melody'
  | 'scales'
  | 'improvisation'
  | 'inspector';

interface TutorialPageProps {
  instrument: InstrumentType;
  chordPlaybackStyle?: ChordPlaybackStyle;
  onChordPlaybackStyleChange?: (style: ChordPlaybackStyle) => void;
  onBackToStudio: () => void;
  onOpenStudioPanel: (panelKey: TutorialPanelTarget, elementId?: string) => void;
  onOpenFavorites?: () => void;
  onOpenSettings?: () => void;
}

interface TutorialStepItem {
  number: string;
  title: string;
  description: string;
  tip?: string;
}

interface TutorialChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  targetPanel: TutorialPanelTarget;
  targetElementId: string;
  targetLabel: string;
  overview: string;
  steps: TutorialStepItem[];
}

const TUTORIAL_STORAGE_KEY = 'harmoniq_tutorial_completed';

const CHAPTERS: TutorialChapter[] = [
  {
    id: 'getting-started',
    number: '01',
    title: 'Estilo Musical e Início Rápido',
    subtitle: 'Defina o gênero, BPM automático e ponto de partida',
    targetPanel: 'genre',
    targetElementId: 'genre-tab-pop',
    targetLabel: 'Abrir Estilo Musical no Estúdio',
    overview:
      'O primeiro passo no estúdio é escolher o Estilo Musical no topo. Cada estilo ajusta automaticamente as regras de sugestão harmônica, o andamento (BPM), o instrumento e o groove da bateria/baixo.',
    steps: [
      {
        number: '01.',
        title: 'Escolha um Estilo Musical',
        description:
          'Clique entre Pop, Rock, Eletrônica, Techno, Punk Rock, Ballad, Acústico, Blues ou Jazz. Isso recalcula imediatamente quais próximos acordes fazem mais sentido musical.',
      },
      {
        number: '02.',
        title: 'Use "Gerar Aleatória" para inspiração instantânea',
        description:
          'Sem ideias para começar? O botão Gerar Aleatória cria uma progressão completa coerente com o estilo escolhido, já configurando cadência, duração e andamento.',
      },
      {
        number: '03.',
        title: 'Recolha painéis para focar no que importa',
        description:
          'Cada seção tem um botão de seta no canto superior direito para recolher ou expandir. Você também pode recolher todos os painéis de uma vez pelo botão Recolher Painéis no topo.',
      },
    ],
  },
  {
    id: 'timeline-tension',
    number: '02',
    title: 'Linha do Tempo, Tempos e Tensão',
    subtitle: 'Controle duração, ritmo, transposição e tensão harmônica',
    targetPanel: 'timeline',
    targetElementId: 'chord-timeline-container',
    targetLabel: 'Abrir Linha do Tempo no Estúdio',
    overview:
      'A Linha do Tempo é o coração da sua música. Aqui você organiza a sequência, define quantos tempos dura cada acorde, escolhe o padrão de levada, transpõe o tom e acompanha a curva de tensão harmônica.',
    steps: [
      {
        number: '01.',
        title: 'Ajuste a duração (1t a 8t) e o padrão rítmico',
        description:
          'Embaixo de cada bloco de acorde, use os botões - / + para mudar a duração em tempos (1t até 8t) e escolha a levada (Sustentado, Semínimas, Colcheias, Sincopado, Arpejo ou Valsa).',
      },
      {
        number: '02.',
        title: 'Leia o Indicador de Tensão Harmônica',
        description:
          'Logo abaixo de cada acorde aparece o grau romano e o nível de tensão: Repouso (estável na tônica), Instável (movimento/preparação), Tensão (dominante pedindo resolução) e Resolução (pouso após tensão).',
      },
      {
        number: '03.',
        title: 'Adicione Backing Track e Transponha o Tom',
        description:
          'Ative um acompanhamento de bateria e baixo (Rock, Funk, Bossa, Reggae, Shuffle, Techno etc.) ou use os controles -1 st / +1 st e o seletor de tom para transpor acordes e melodia juntos.',
      },
    ],
  },
  {
    id: 'chord-suggestions',
    number: '03',
    title: 'Sugestões Inteligentes de Acordes',
    subtitle: 'Descubra o próximo acorde ideal sem travar',
    targetPanel: 'suggestions',
    targetElementId: 'chord-suggestions-panel',
    targetLabel: 'Abrir Sugestões de Acordes',
    overview:
      'Com base no último acorde da sua Linha do Tempo e no estilo musical selecionado, o aplicativo calcula e classifica as continuações mais musicais.',
    steps: [
      {
        number: '01.',
        title: 'Ouvir antes de adicionar',
        description:
          'Passe o mouse ou clique no ícone de áudio do cartão para testar a sonoridade do acorde sugerido sem modificar sua sequência atual.',
      },
      {
        number: '02.',
        title: 'Adicionar com um clique',
        description:
          'Clique no acorde sugerido para inseri-lo diretamente ao final da Linha do Tempo e já atualizá-lo no Inspetor de Acordes.',
      },
      {
        number: '03.',
        title: 'Buscar qualquer acorde no catálogo completo',
        description:
          'Precisa de um acorde específico fora das sugestões? Clique em Escolher Acorde / Buscar para abrir o seletor completo com filtro por tônica e qualidade.',
      },
    ],
  },
  {
    id: 'inspector-variations',
    number: '04',
    title: 'Inspetor de Acordes e Variações',
    subtitle: 'Diagramas de violão/teclado, inversões e substituições',
    targetPanel: 'inspector',
    targetElementId: 'chord-inspector-card',
    targetLabel: 'Abrir Inspetor de Acordes',
    overview:
      'Ao clicar em qualquer acorde da Linha do Tempo, o Inspetor exibe como tocá-lo no violão ou no teclado, permite subir ou descer oitavas e sugere variações ricas para substituir acordes simples.',
    steps: [
      {
        number: '01.',
        title: 'Alterne entre Violão e Teclado',
        description:
          'Veja o diagrama de casas/dedos do violão (com indicação de pestana e cordas soltas/abafadas) ou as teclas iluminadas no piano. Clique nas notas individuais para ouvir cada intervalo.',
      },
      {
        number: '02.',
        title: 'Explore a aba Variações e Inversões',
        description:
          'Abra a aba Variações para testar voicings como add9, sus4, maj7 ou acordes com baixo invertido (slash chords como C/E). Clique em Substituir na Timeline para aplicar na música.',
      },
      {
        number: '03.',
        title: 'Controle de Oitava (8va / 8vb)',
        description:
          'Ajuste a região grave ou aguda do acorde selecionado para melhorar a condução de vozes entre blocos vizinhos.',
      },
    ],
  },
  {
    id: 'melody-scales-improv',
    number: '05',
    title: 'Melodias, Escalas e Guia de Improviso',
    subtitle: 'Crie solos, visualize digitações e pratique frases curtas',
    targetPanel: 'improvisation',
    targetElementId: 'improvisation-guide-section',
    targetLabel: 'Abrir Guia de Improviso',
    overview:
      'Três painéis integrados trabalham juntos para criação melódica: Sugestões de Melodia, Dicionário de Escalas & Modos e Guia de Improviso.',
    steps: [
      {
        number: '01.',
        title: 'Gere melodias completas no painel de Melodias',
        description:
          'Escolha um estilo (Lírica, Arpejada, Sincopada, Pentatônica ou Riffs), ajuste a oitava e toque a melodia junto com os acordes ou isolada, acompanhando as notas em tempo real no braço ou teclado.',
      },
      {
        number: '02.',
        title: 'Estude modos no Dicionário de Escalas',
        description:
          'Selecione tom e modo (Jônio, Dórico, Mixolídio, Blues, Menor Harmônica etc.) para ver intervalos, notas características, dicas de solo e digitações interativas.',
      },
      {
        number: '03.',
        title: 'Pratique acorde por acorde no Guia de Improviso',
        description:
          'Clique em Detectar Escala para alinhar automaticamente o modo à sua progressão. Navegue pelos acordes (#1, #2...) para ouvir padrões rítmicos e frases curtas (Solo ou c/ Acorde) destacando notas-alvo.',
      },
    ],
  },
  {
    id: 'export-library',
    number: '06',
    title: 'Biblioteca, Nuvem, MIDI e PDF',
    subtitle: 'Salve projetos, sincronize na conta e gere partituras/arquivos',
    targetPanel: 'timeline',
    targetElementId: 'btn-export-pdf',
    targetLabel: 'Ir para Botões de Salvar & Exportar',
    overview:
      'Quando sua progressão estiver pronta, salve na biblioteca pessoal para reutilizar depois ou exporte em formatos prontos para ensaio e produção musical.',
    steps: [
      {
        number: '01.',
        title: 'Salvar na Biblioteca e Sincronizar na Nuvem',
        description:
          'Clique em Salvar na Linha do Tempo para guardar acordes, durações, melodia e letra. Fazendo login com sua conta Google no topo, suas progressões ficam sincronizadas entre dispositivos.',
      },
      {
        number: '02.',
        title: 'Gerar PDF com Cifra, Diagramas e Letra',
        description:
          'Clique em PDF para montar uma folha de cifra organizada com título, artista, letra opcional e os diagramas de posição (violão ou teclado) de cada acorde usado na música.',
      },
      {
        number: '03.',
        title: 'Exportar arquivo MIDI (.mid)',
        description:
          'Clique em MIDI para baixar um arquivo multitrack contendo os acordes, a melodia sugerida e o backing track para abrir em qualquer DAW (Reaper, Ableton, Logic, FL Studio).',
      },
    ],
  },
  {
    id: 'workflows-tips',
    number: '07',
    title: 'Fluxos, Timbres e Modo Arpejo',
    subtitle: 'Roteiros de composição, timbres e acordes individuais em bloco ou arpejo',
    targetPanel: 'timeline',
    targetElementId: 'btn-timeline-timbre',
    targetLabel: 'Voltar e Configurar Timbre',
    overview:
      'Use estes três roteiros práticos para acelerar seu trabalho e personalize o motor de áudio — incluindo timbres e a opção de tocar acordes individuais em bloco ou como arpejo.',
    steps: [
      {
        number: '01.',
        title: 'Roteiro de Composição Rápida',
        description:
          'Estilo Musical -> Gerar Aleatória -> ajustar tempos e Variações no Inspetor -> escrever letra e exportar PDF ou MIDI.',
      },
      {
        number: '02.',
        title: 'Roteiro de Treino de Improvisação',
        description:
          'Monte 4 acordes na Linha do Tempo -> ative um Backing Track -> abra o Guia de Improviso e clique em Detectar Escala -> ative Loop e pratique sobre cada acorde.',
      },
      {
        number: '03.',
        title: 'Personalize Timbre, Execução em Arpejo e Tema',
        description:
          'Em Config. no topo, escolha o timbre (Acústico, Elétrico, Orquestral ou Sintetizado), ative "Arpejo Individual" em Execução de Acordes Individuais para ouvir as notas em sequência ao clicar nos acordes, e alterne entre Modo Escuro e Modo Claro.',
      },
    ],
  },
];

export const TutorialPage: React.FC<TutorialPageProps> = ({
  instrument,
  chordPlaybackStyle = 'block',
  onChordPlaybackStyleChange,
  onBackToStudio,
  onOpenStudioPanel,
  onOpenFavorites,
  onOpenSettings,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // ignore
    }
  }, [completedIds]);

  const activeChapter = CHAPTERS[activeIndex] || CHAPTERS[0];
  const isChapterCompleted = completedIds.includes(activeChapter.id);
  const completedCount = completedIds.length;

  const toggleCompleted = (chapterId: string) => {
    setCompletedIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handlePlayChordDemo = (demoId: string, chordKey: string) => {
    const chord = CHORD_DATABASE[chordKey] || CHORD_DATABASE['C'];
    setActiveDemoId(demoId);
    audioEngine.playChord(chord, instrument, 1.3, 0);
    window.setTimeout(() => {
      setActiveDemoId((curr) => (curr === demoId ? null : curr));
    }, 900);
  };

  const handlePlayChordStyleDemo = (demoId: string, style: ChordPlaybackStyle) => {
    const chord = CHORD_DATABASE['Cmaj7'] || CHORD_DATABASE['C'];
    setActiveDemoId(demoId);
    audioEngine.playChord(chord, instrument, 1.5, 0, style);
    window.setTimeout(() => {
      setActiveDemoId((curr) => (curr === demoId ? null : curr));
    }, 1000);
  };

  const handlePlayNoteDemo = (demoId: string, notePitch: string) => {
    setActiveDemoId(demoId);
    audioEngine.playSingleNote(notePitch, instrument, 0.7, 0.85);
    window.setTimeout(() => {
      setActiveDemoId((curr) => (curr === demoId ? null : curr));
    }, 550);
  };

  const handlePlayMiniPhraseDemo = () => {
    setActiveDemoId('phrase-demo');
    const chord = CHORD_DATABASE['C'];
    audioEngine.playChord(chord, instrument, 2.1, 0);
    const notes = ['E4', 'G4', 'A4', 'G4', 'E4'];
    notes.forEach((n, idx) => {
      window.setTimeout(() => {
        audioEngine.playSingleNote(n, instrument, 0.45, 0.85);
      }, idx * 340);
    });
    window.setTimeout(() => {
      setActiveDemoId((curr) => (curr === 'phrase-demo' ? null : curr));
    }, 1850);
  };

  return (
    <main id="tutorial-page-container" className="space-y-4">
      {/* Top Tutorial Banner */}
      <section className="bg-[#141720] border border-[#232836] rounded-none p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#212636] pb-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#1a1e2a] text-indigo-400 border border-[#272d3e] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-slate-100">
                Tutorial do Aplicativo
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5 max-w-2xl">
                Aprenda passo a passo como montar progressões, interpretar tensão harmônica, improvisar e exportar cifras.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-mono tabular-nums text-slate-300">
                {completedCount} de {CHAPTERS.length} etapas concluídas
              </div>
              <div className="w-36 h-1.5 bg-[#1a1e2a] border border-[#272d3e] mt-1">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.round((completedCount / CHAPTERS.length) * 100)}%` }}
                />
              </div>
            </div>

            <button
              id="btn-tutorial-back-studio"
              type="button"
              onClick={onBackToStudio}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-indigo-600/90 hover:bg-indigo-500/90 text-white text-xs font-medium border border-indigo-500/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Estúdio</span>
            </button>
          </div>
        </div>

        {/* Two-Zone Guided Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Zone: Chapter Navigation */}
          <nav
            aria-label="Capítulos do Tutorial"
            className="lg:col-span-4 space-y-1.5"
          >
            {CHAPTERS.map((chap, idx) => {
              const isActive = idx === activeIndex;
              const isDone = completedIds.includes(chap.id);
              return (
                <button
                  key={chap.id}
                  id={`btn-tutorial-chapter-${chap.id}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-3 border rounded-none transition-colors flex items-start justify-between gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#222838] border-indigo-500/70 text-slate-100'
                      : 'bg-[#10131c] hover:bg-[#1e2332] border-[#212738] text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`text-xs font-mono tabular-nums shrink-0 mt-0.5 ${
                        isActive ? 'text-indigo-300 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {chap.number}.
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {chap.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5 line-clamp-1">
                        {chap.subtitle}
                      </div>
                    </div>
                  </div>

                  {isDone && (
                    <span
                      className="text-emerald-400 shrink-0 mt-0.5"
                      title="Etapa concluída"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Active Lesson Content & Interactive Demo */}
          <div className="lg:col-span-8 bg-[#10131c] border border-[#212738] p-4 md:p-5 space-y-5">
            {/* Chapter Heading */}
            <div className="space-y-1.5 border-b border-[#1d2332] pb-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono tabular-nums text-indigo-300">
                  Módulo {activeChapter.number} de 0{CHAPTERS.length}
                </span>
                <button
                  id="btn-tutorial-toggle-complete"
                  type="button"
                  onClick={() => toggleCompleted(activeChapter.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isChapterCompleted
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50'
                      : 'bg-[#171b26] hover:bg-[#202636] text-slate-300 border-[#283044]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isChapterCompleted ? 'Concluída' : 'Marcar como Concluída'}</span>
                </button>
              </div>
              <h3 className="text-lg font-medium text-slate-100">
                {activeChapter.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed max-w-2xl">
                {activeChapter.overview}
              </p>
            </div>

            {/* Numbered Instructions */}
            <div className="space-y-3">
              {activeChapter.steps.map((step) => (
                <div
                  key={step.number}
                  className="p-3.5 bg-[#141720] border border-[#23293a] space-y-1"
                >
                  <h4 className="text-xs sm:text-sm font-medium text-slate-100 flex items-center gap-2">
                    <span className="font-mono tabular-nums text-amber-300">{step.number}</span>
                    <span>{step.title}</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed pl-6">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Mini-Lab per Chapter */}
            <div className="p-3.5 bg-[#141720] border border-[#262d40] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Experimente na prática</span>
                </span>
                <span className="text-[11px] text-slate-400 font-light">
                  Áudio real no instrumento selecionado ({instrument === 'guitar' ? 'Violão' : 'Piano'})
                </span>
              </div>

              {activeChapter.id === 'getting-started' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'demo-pop', chord: 'C', label: 'Pop / Acústico', desc: 'Tríade aberta de Dó (C)' },
                    { id: 'demo-jazz', chord: 'Cmaj7', label: 'Jazz / Bossa', desc: 'Tétrade com 7ª maior (Cmaj7)' },
                    { id: 'demo-blues', chord: 'C7', label: 'Blues / Rock', desc: 'Dominante com 7ª (C7)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePlayChordDemo(item.id, item.chord)}
                      className={`p-2.5 text-left border transition-colors cursor-pointer ${
                        activeDemoId === item.id
                          ? 'bg-[#222838] border-indigo-400 text-slate-100'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-slate-100">
                        <span>{item.label}</span>
                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeChapter.id === 'timeline-tension' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 't-1', chord: 'C', beats: '4t', level: 1, label: 'Repouso', color: 'text-emerald-300', bar: 'bg-emerald-500' },
                    { id: 't-2', chord: 'F', beats: '2t', level: 2, label: 'Instável', color: 'text-amber-300', bar: 'bg-amber-500' },
                    { id: 't-3', chord: 'G7', beats: '2t', level: 4, label: 'Tensão', color: 'text-rose-300', bar: 'bg-rose-500' },
                    { id: 't-4', chord: 'C', beats: '4t', level: 1, label: 'Resolução', color: 'text-indigo-300', bar: 'bg-indigo-500' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePlayChordDemo(item.id, item.chord)}
                      className={`p-2.5 text-left border transition-colors cursor-pointer space-y-2 ${
                        activeDemoId === item.id
                          ? 'bg-[#222838] border-indigo-400'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-100">{item.chord}</span>
                        <span className="text-[10px] font-mono tabular-nums text-amber-300">{item.beats}</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-[10px] font-medium ${item.color}`}>{item.label}</div>
                        <div className="grid grid-cols-4 gap-0.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`h-1 ${step <= item.level ? item.bar : 'bg-slate-500/20'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeChapter.id === 'chord-suggestions' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sug-1', chord: 'Am', role: 'Relativo menor (vi)' },
                    { id: 'sug-2', chord: 'F', role: 'Subdominante (IV)' },
                    { id: 'sug-3', chord: 'G', role: 'Dominante (V)' },
                    { id: 'sug-4', chord: 'Dm7', role: 'Preparação (ii7)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePlayChordDemo(item.id, item.chord)}
                      className={`p-2.5 text-left border transition-colors cursor-pointer ${
                        activeDemoId === item.id
                          ? 'bg-[#222838] border-indigo-400'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-100">{item.chord}</span>
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5">{item.role}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeChapter.id === 'inspector-variations' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'var-c', chord: 'C', desc: 'Tríade básica (C - E - G)' },
                    { id: 'var-add9', chord: 'Cadd9', desc: 'Variação add9 (adiciona brilho com D)' },
                    { id: 'var-maj7', chord: 'Cmaj7', desc: 'Variação maj7 (sofisticação com B)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePlayChordDemo(item.id, item.chord)}
                      className={`p-2.5 text-left border transition-colors cursor-pointer ${
                        activeDemoId === item.id
                          ? 'bg-[#222838] border-indigo-400'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-300">{item.chord}</span>
                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeChapter.id === 'melody-scales-improv' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { note: 'C4', label: 'C (T)', isTarget: true },
                      { note: 'D4', label: 'D (9ª)', isTarget: false },
                      { note: 'E4', label: 'E (3ª)', isTarget: true },
                      { note: 'F4', label: 'F (4ª)', isTarget: false },
                      { note: 'G4', label: 'G (5ª)', isTarget: true },
                      { note: 'A4', label: 'A (6ª)', isTarget: false },
                      { note: 'B4', label: 'B (7M)', isTarget: false },
                    ].map((n) => (
                      <button
                        key={n.note}
                        type="button"
                        onClick={() => handlePlayNoteDemo(`note-${n.note}`, n.note)}
                        className={`px-2.5 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                          activeDemoId === `note-${n.note}`
                            ? 'bg-emerald-600/80 text-white border-emerald-400'
                            : n.isTarget
                            ? 'bg-[#1c2336] text-indigo-200 border-indigo-500/50 hover:border-indigo-400'
                            : 'bg-[#171b26] text-slate-300 border-[#262d40] hover:border-slate-500'
                        }`}
                        title={n.isTarget ? 'Nota-alvo do acorde C' : 'Nota de passagem / cor'}
                      >
                        {n.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handlePlayMiniPhraseDemo}
                      className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        activeDemoId === 'phrase-demo'
                          ? 'bg-amber-600/80 text-white border-amber-500/60'
                          : 'bg-emerald-700/80 hover:bg-emerald-600/80 text-emerald-100 border-emerald-500/50'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ouvir Frase sobre C</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light">
                    Notas destacadas em índigo (C, E, G) são notas-alvo de repouso sobre o acorde de Dó; D, F, A e B criam movimento e cor.
                  </p>
                </div>
              )}

              {activeChapter.id === 'export-library' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px] p-2.5 bg-[#171b26] border border-[#262d40] text-xs space-y-1">
                    <div className="font-medium text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>PDF Completo</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light">
                      Inclui progressão em compassos, diagramas de violão/teclado e letra da música.
                    </p>
                  </div>
                  <div className="flex-1 min-w-[200px] p-2.5 bg-[#171b26] border border-[#262d40] text-xs space-y-1">
                    <div className="font-medium text-slate-200 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>MIDI Multitrack</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light">
                      Exporta acordes, melodia e bateria/baixo sincronizados no BPM da sequência.
                    </p>
                  </div>
                  {onOpenFavorites && (
                    <button
                      type="button"
                      onClick={onOpenFavorites}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1f2d] hover:bg-[#23293a] text-slate-200 border border-[#2d3448] text-xs cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FolderHeart className="w-3.5 h-3.5 text-amber-400" />
                      <span>Abrir Biblioteca</span>
                    </button>
                  )}
                </div>
              )}

              {activeChapter.id === 'workflows-tips' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      id="btn-tutorial-demo-block"
                      type="button"
                      onClick={() => handlePlayChordStyleDemo('style-block', 'block')}
                      className={`p-2.5 text-left border transition-colors cursor-pointer ${
                        activeDemoId === 'style-block'
                          ? 'bg-[#222838] border-indigo-400 text-slate-100'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-slate-100">
                        <span>Ouvir em Bloco (Cmaj7)</span>
                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5">
                        Todas as notas do acorde soam simultaneamente.
                      </div>
                    </button>

                    <button
                      id="btn-tutorial-demo-arpeggio"
                      type="button"
                      onClick={() => handlePlayChordStyleDemo('style-arpeggio', 'arpeggio')}
                      className={`p-2.5 text-left border transition-colors cursor-pointer ${
                        activeDemoId === 'style-arpeggio'
                          ? 'bg-[#222838] border-indigo-400 text-slate-100'
                          : 'bg-[#171b26] hover:bg-[#1e2332] border-[#262d40] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-slate-100">
                        <span>Ouvir em Arpejo (Cmaj7)</span>
                        <Play className="w-3 h-3 text-amber-400 fill-current" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-light mt-0.5">
                        Notas tocadas em sequência ascendente (nota por nota).
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {onChordPlaybackStyleChange ? (
                      <button
                        id="btn-tutorial-toggle-playback-style"
                        type="button"
                        onClick={() => {
                          const next: ChordPlaybackStyle =
                            chordPlaybackStyle === 'arpeggio' ? 'block' : 'arpeggio';
                          onChordPlaybackStyleChange(next);
                          handlePlayChordStyleDemo(`style-${next}`, next);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 border text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          chordPlaybackStyle === 'arpeggio'
                            ? 'bg-indigo-950/50 text-indigo-200 border-indigo-500/60'
                            : 'bg-[#1a1f2d] hover:bg-[#23293a] text-slate-200 border-[#2d3448]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          Modo padrão atual:{' '}
                          <strong>
                            {chordPlaybackStyle === 'arpeggio' ? 'Arpejo Individual' : 'Acorde em Bloco'}
                          </strong>
                        </span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-300 font-light">
                        Experimente alternar os timbres e o modo <strong className="text-slate-100 font-medium">Arpejo Individual</strong> nas Configurações.
                      </div>
                    )}

                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1f2d] hover:bg-[#23293a] text-slate-200 border border-[#2d3448] text-xs cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        <span>Abrir Configurações</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chapter Navigation & Studio Deep-Link Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1d2332]">
              <div className="flex items-center gap-2">
                <button
                  id="btn-tutorial-prev"
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#171b26] hover:bg-[#202636] text-slate-300 border border-[#283044] text-xs disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <button
                  id="btn-tutorial-next"
                  type="button"
                  disabled={activeIndex === CHAPTERS.length - 1}
                  onClick={() => setActiveIndex((i) => Math.min(CHAPTERS.length - 1, i + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#171b26] hover:bg-[#202636] text-slate-300 border border-[#283044] text-xs disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Próxima Etapa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                id="btn-tutorial-open-panel"
                type="button"
                onClick={() =>
                  onOpenStudioPanel(activeChapter.targetPanel, activeChapter.targetElementId)
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600/80 text-emerald-100 border border-emerald-500/50 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeChapter.targetLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

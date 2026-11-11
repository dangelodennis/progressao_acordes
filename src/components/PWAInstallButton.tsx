import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Instalar como aplicativo Android / Desktop"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-normal text-slate-300 bg-[#1a1e28] hover:bg-[#222836] border border-[#282f40] rounded-none transition-all active:scale-95 shadow-xs"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400/80" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios"
          onClick={() => setShowIOSGuide(true)}
          title="Instalar no iPhone / iPad"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-normal text-slate-300 bg-[#1a1e28] hover:bg-[#222836] border border-[#282f40] rounded-none transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-none bg-[#12151d] border border-[#232836] p-5 shadow-2xl text-slate-300">
              <div className="flex items-center justify-between border-b border-[#202534] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400/80" />
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-200">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed mb-4">
                1. Toque no botão de <strong className="text-slate-200 font-normal">Compartilhar</strong> <Share2 className="inline w-3.5 h-3.5 text-indigo-400/80" /> na barra inferior do Safari.<br />
                2. Role a lista e selecione <strong className="text-slate-200 font-normal">Adicionar à Tela de Início</strong>.<br />
                3. Confirme em <strong className="text-slate-200 font-normal">Adicionar</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-none bg-[#1a1e28] hover:bg-[#222836] py-2 text-xs font-normal text-slate-200 border border-[#292f40] transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

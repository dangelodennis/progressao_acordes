import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // Check every 1 hour

export const PWAUpdateToast: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Periodically check for a newer Service Worker in the background
      window.setInterval(() => {
        if (!navigator.onLine) return;
        void registration.update();
      }, SW_UPDATE_INTERVAL_MS);

      // Also check when user returns to the app/tab
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void registration.update();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
    },
    onRegisterError(error) {
      console.warn('PWA Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) {
      setIsUpdating(false);
    }
  }, [needRefresh]);

  if (!needRefresh) {
    return null;
  }

  const handleReloadToUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <div
      id="pwa-update-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-[#141720] border border-indigo-500/60 shadow-2xl rounded-none p-3.5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-none bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-medium text-slate-100">
              Nova versão disponível
            </h4>
            <p className="text-[11px] text-slate-400 font-light leading-snug mt-0.5">
              Uma atualização do aplicativo foi baixada em segundo plano. Recarregue a página para aplicar as novidades.
            </p>
          </div>
        </div>

        <button
          id="btn-pwa-update-close"
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-none text-slate-400 hover:text-slate-200 border border-transparent hover:border-[#272d3e] transition-colors shrink-0"
          title="Dispensar aviso de atualização"
          aria-label="Dispensar aviso de atualização"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          id="btn-pwa-update-later"
          type="button"
          onClick={handleDismiss}
          disabled={isUpdating}
          className="px-2.5 py-1.5 rounded-none bg-[#181c26] hover:bg-[#202534] text-slate-300 border border-[#272d3e] text-xs font-normal transition-colors disabled:opacity-50"
        >
          Agora não
        </button>

        <button
          id="btn-pwa-update-reload"
          type="button"
          onClick={() => void handleReloadToUpdate()}
          disabled={isUpdating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-indigo-600/90 hover:bg-indigo-500/90 text-white text-xs font-medium border border-indigo-500/60 transition-colors active:translate-y-0.5 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'Atualizando...' : 'Recarregar Agora'}</span>
        </button>
      </div>
    </div>
  );
};

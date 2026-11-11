import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-none bg-amber-500 text-slate-950 px-3.5 py-2 text-xs font-black shadow-xl border border-amber-400 animate-in fade-in"
    >
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Modo Offline Ativo — Todas as ferramentas continuam funcionando normalmente.</span>
    </div>
  );
};

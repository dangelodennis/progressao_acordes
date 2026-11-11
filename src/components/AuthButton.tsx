import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Cloud, CloudOff, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';

interface AuthButtonProps {
  syncStatus?: 'synced' | 'local' | 'syncing' | 'error';
  isSyncing?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ syncStatus = 'local', isSyncing = false }) => {
  const { user, isLoading, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-8 px-2.5 flex items-center justify-center bg-[#1c202a] border border-[#2d3345] text-slate-400 text-xs rounded-none animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-indigo-600/80 hover:bg-indigo-500/90 text-white border border-indigo-500/50 text-xs font-normal transition-all active:translate-y-0.5 shadow-xs"
          title="Fazer login com a Conta Google para sincronizar suas progressões entre dispositivos"
        >
          {/* Google "G" Logo Icon */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span className="hidden sm:inline">Entrar</span>
        </button>

        {authError && (
          <div className="absolute top-full right-0 mt-1 z-50 w-64 p-2 bg-rose-950/95 border border-rose-800 text-rose-200 text-[11px] rounded-none shadow-lg">
            <div className="flex items-start justify-between gap-1">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </span>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-rose-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1c202a] hover:bg-[#232835] text-slate-200 border border-[#2d3345] text-xs font-normal transition-all"
        title={`Conectado como ${user.email} • Clique para opções`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Avatar'}
            className="w-4 h-4 rounded-full object-cover border border-slate-600"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-indigo-900 text-indigo-200 flex items-center justify-center text-[10px] font-bold">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}

        <span className="max-w-[70px] sm:max-w-[100px] truncate hidden xs:inline">
          {user.displayName || user.email?.split('@')[0]}
        </span>

        {/* Sync Indicator Icon */}
        {isSyncing ? (
          <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
        ) : syncStatus === 'synced' ? (
          <Cloud className="w-3 h-3 text-emerald-400" />
        ) : syncStatus === 'error' ? (
          <CloudOff className="w-3 h-3 text-rose-400" />
        ) : (
          <Cloud className="w-3 h-3 text-slate-500" />
        )}
      </button>

      {/* User details and Logout Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-[#12151e] border border-[#232838] shadow-2xl p-3 text-xs rounded-none animate-in fade-in duration-100">
          <div className="space-y-1 pb-2 border-b border-[#202535]">
            <p className="font-medium text-slate-200 truncate">{user.displayName || 'Usuário Google'}</p>
            <p className="text-[11px] text-slate-400 font-light truncate">{user.email}</p>
          </div>

          <div className="py-2 space-y-1.5 text-[11px] text-slate-300 border-b border-[#202535]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-light">Status da Sincronização:</span>
              <span className="flex items-center gap-1 font-medium text-emerald-400">
                <Cloud className="w-3 h-3" /> Nuvem Ativa
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-light">
              Suas progressões são salvas no Firestore e sincronizadas automaticamente entre seus dispositivos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              signOut();
            }}
            className="w-full mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta Google</span>
          </button>
        </div>
      )}
    </div>
  );
};

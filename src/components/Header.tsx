import React from 'react';
import { SyncStatus } from '../syncManager';

interface HeaderProps {
  onAdd?: () => void;
  syncStatus?: SyncStatus;
  onSyncClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAdd, syncStatus, onSyncClick }) => (
  <header className="relative flex flex-col gap-4 py-8 px-4 items-center justify-center animate-in fade-in slide-in-from-top-4 duration-500">
    {onSyncClick && (
      <button
        onClick={onSyncClick}
        className="absolute left-4 top-8 p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full backdrop-blur-md transition-all text-white shadow-lg ring-1 ring-white/5 z-20"
        aria-label="Sync Settings"
        title={syncStatus?.enabled ? 'Sync enabled' : 'Enable sync'}
      >
        {syncStatus?.syncing ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-spin">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        )}
        {syncStatus?.enabled && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-slate-900" />
        )}
      </button>
    )}
    {onAdd && (
      <button
        onClick={onAdd}
        className="absolute right-4 top-8 p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full backdrop-blur-md transition-all text-white shadow-lg ring-1 ring-white/5 z-20"
        aria-label="Add Bookmark"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    )}
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">NavHub</h1>
      <p className="text-xs text-slate-300/80 font-medium tracking-widest uppercase">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
    </div>
  </header>
);

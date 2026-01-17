import React from 'react';
import { AppSettings } from '../types';
import { getTranslation } from '../i18n';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenSync: () => void;
  syncStatus?: {
    enabled: boolean;
    syncing: boolean;
    error: string | null;
  };
}

export const Header: React.FC<HeaderProps> = ({ settings, onOpenSettings, onOpenSync, syncStatus }) => {
  return (
    <header className="flex items-center justify-between px-6 py-6 w-full animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Date Display (Left) */}
      <div className="hidden md:flex flex-col">
        <span className="text-2xl font-bold text-slate-100">
          {new Date().toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { day: 'numeric' })}
        </span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          {new Date().toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', weekday: 'short' })}
        </span>
      </div>

      {/* Mobile Date (Left) - Simplified */}
      <div className="md:hidden text-lg font-bold text-slate-100">
        {new Date().toLocaleTimeString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>

      {/* Main Logo/Title (Center) - Optional, or just keep layout balanced */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {/* Logo could go here, or keep it empty for clean look */}
        <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 hidden sm:block">
          NavHub
        </h1>
      </div>

      {/* Actions (Right) - Hidden per user request */}
      <div className="flex items-center gap-3">
        {/* Buttons removed for minimalist mode */}
      </div>
    </header>
  );
};

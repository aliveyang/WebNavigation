import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  // 时钟驱动：每 60s 强制重渲染一次，让日期/时间随真实时间更新（审计 B2）
  const [, setClockTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((t) => t + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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

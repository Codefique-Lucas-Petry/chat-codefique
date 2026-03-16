import React from 'react';
import { MenuIcon } from '../common/Icons';

export default function ChatHeader({ roomId, onMenuClick }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/50 p-4 md:hidden">
      <button 
        onClick={onMenuClick} 
        className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white"
      >
        <MenuIcon />
      </button>
      <span className="font-black truncate max-w-[200px] text-slate-200">#{roomId}</span>
      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}
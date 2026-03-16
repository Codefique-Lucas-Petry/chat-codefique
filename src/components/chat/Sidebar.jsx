import React from 'react';
import { RemoteImage } from '../common/RemoteImage';
import { formatAvatarUrl } from '../../utils/urlHelpers';

export default function Sidebar({ 
  roomId, 
  participants, 
  myUserId, 
  sidebarOpen, 
  setSidebarOpen, 
  onOpenSettings, 
  onLogout 
}) {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      <aside className={`absolute inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-slate-800 bg-slate-900 transition-transform md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sala Ativa</h2>
          <p className="text-xl font-black text-white truncate">#{roomId}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Participantes ({participants.length})
          </p>
          <div className="space-y-4">
            {participants.map((p) => (
              <div key={p.id} className={`flex items-center gap-4 transition-opacity ${p.status === 'online' ? 'opacity-100' : 'opacity-40'}`}>
                <div className="relative shrink-0">
                  <RemoteImage src={formatAvatarUrl(p.avatarUrl)} className="h-10 w-10 rounded-2xl object-cover ring-2 ring-slate-800" />
                  <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${p.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`truncate text-sm font-bold ${String(p.id) === String(myUserId) ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {p.displayName || p.username}
                  </span>
                  <span className="text-[9px] font-black uppercase opacity-50">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-2 border-t border-slate-800">
          <button onClick={onOpenSettings} className="w-full rounded-xl bg-slate-800 py-3 text-[10px] font-black uppercase hover:bg-slate-700">
            Editar Perfil
          </button>
          <button onClick={onLogout} className="w-full rounded-xl bg-red-500/10 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/20">
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
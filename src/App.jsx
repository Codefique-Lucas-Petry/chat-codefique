import React, { useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://unconsenting-unwhetted-ben.ngrok-free.dev').replace(/\/+$/, '');
const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};

const formatAvatarUrl = (path) => {
  if (!path) return 'https://ui-avatars.com/api/?name=User&background=random';
  const cleanPath = path.trim();
  let url = '';
  if (cleanPath.startsWith('http')) {
    url = cleanPath;
  } else {
    const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    url = `${BASE_URL}${pathWithSlash}`;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ngrok-skip-browser-warning=1`;
};

const normalizeFileUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  let url = '';
  if (value.startsWith('http')) {
    url = value;
  } else {
    const pathWithSlash = value.startsWith('/') ? value : `/${value}`;
    url = `${BASE_URL}${pathWithSlash}`;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ngrok-skip-browser-warning=1`;
};

const getFileExtension = (value = '') => {
  const cleanValue = value.split('?')[0].split('#')[0];
  const parts = cleanValue.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getAttachmentKind = ({ name = '', type = '', url = '' }) => {
  const extension = getFileExtension(name || url);
  const mime = type.toLowerCase();
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
  if (mime === 'application/pdf' || extension === 'pdf') return 'pdf';
  return 'file';
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
};

const getFileUrlFromResponse = (payload) => {
  if (!payload || typeof payload !== 'object') return '';
  const keys = ['fileUrl', 'url', 'avatarUrl'];
  for (const key of keys) {
    if (typeof payload[key] === 'string' && payload[key]) return normalizeFileUrl(payload[key]);
  }
  return '';
};

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const responseText = await response.text();
    const snippet = responseText.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`Resposta invalida da API (${response.status}). Esperado JSON, recebido: ${snippet || 'vazio'}`);
  }
  return response.json();
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || data?.message || `Erro na requisicao`);
  return data;
}

async function apiFetchOrDefault(path, fallbackValue) {
  try { return await apiFetch(path); } catch (error) { console.warn(`Falha ao carregar ${path}:`, error); return fallbackValue; }
}

function FileTypeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 3.75h6.586a2 2 0 0 1 1.414.586l3.664 3.664a2 2 0 0 1 .586 1.414V18.25A2.75 2.75 0 0 1 17.5 21h-9A2.75 2.75 0 0 1 5.75 18.25V6.5A2.75 2.75 0 0 1 8.5 3.75Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.75 3.75v4.5h4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.75 14.25h6.5M8.75 17.25h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.75 7.25h14.5M4.75 12h14.5M4.75 16.75h14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RemoteImage({ src, alt, className = '', fallbackSrc = 'https://ui-avatars.com/api/?name=User&background=random' }) {
  const [resolvedSrc, setResolvedSrc] = useState(fallbackSrc);
  useEffect(() => {
    if (!src) { setResolvedSrc(fallbackSrc); return; }
    let active = true;
    let objectUrl = '';
    async function loadImage() {
      try {
        const response = await fetch(src, { headers: DEFAULT_HEADERS });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) setResolvedSrc(objectUrl);
      } catch { if (active) setResolvedSrc(fallbackSrc); }
    }
    loadImage();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fallbackSrc, src]);
  return <img src={resolvedSrc} alt={alt} className={className} />;
}

function AttachmentPreviewCard({ attachment, onRemove, compact = false }) {
  if (!attachment) return null;
  const kind = getAttachmentKind(attachment);
  const previewUrl = attachment.previewUrl || attachment.url;
  const wrapperClass = compact ? 'rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 p-3' : 'rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-3 sm:p-4';
  return (
    <div className={wrapperClass}>
      {kind === 'image' && <img src={previewUrl} alt="Preview" className={`w-full rounded-[1.25rem] object-cover ${compact ? 'max-h-32' : 'max-h-44'}`} />}
      {kind === 'pdf' && (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-800/80 p-3 sm:p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300"><span className="text-xs font-black">PDF</span></div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{attachment.name}</p></div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0"><p className="truncate text-sm font-bold">{attachment.name}</p><p className="text-[10px] font-black uppercase text-slate-500">{formatBytes(attachment.size)}</p></div>
        {onRemove && <button onClick={onRemove} className="rounded-full border border-slate-600 px-3 py-2 text-[10px] font-black text-slate-300 hover:text-red-400">Remover</button>}
      </div>
    </div>
  );
}

function MessageAttachment({ fileUrl, fileName }) {
  const normalizedUrl = normalizeFileUrl(fileUrl);
  if (!normalizedUrl) return null;
  const kind = getAttachmentKind({ name: fileName, url: normalizedUrl });
  if (kind === 'image') return <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-3 block"><RemoteImage src={normalizedUrl} className="max-h-56 w-full rounded-[1.5rem] object-cover" /></a>;
  return (
    <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-900/70 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-slate-200"><FileTypeIcon /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{fileName || 'Arquivo'}</p></div>
    </a>
  );
}

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('@Chat:User');
    return saved ? JSON.parse(saved) : null;
  });
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState(user?.password || '');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (initialized.current) return;
    initialized.current = true;
    async function startChat() {
      try {
        const sessionData = await apiFetch('/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, password: user.password, roomId }),
        });
        setMyUserId(sessionData.userId);
        const [history, parts] = await Promise.all([
          apiFetchOrDefault(`/rooms/${roomId}/messages`, { messages: [] }),
          apiFetchOrDefault(`/rooms/${roomId}/participants`, { participants: [] }),
        ]);
        setMessages(history.messages || []);
        setParticipants(parts.participants || []);
        const socket = new WebSocket(sessionData.wsUrl);
        socketRef.current = socket;
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'room.joined': setParticipants(data.participants || []); break;
            case 'message.new': setMessages((prev) => [...prev, data.message]); break;
            case 'participant.status_change':
              setParticipants((prev) => {
                const exists = prev.find(p => p.id === data.participantId);
                if (exists) return prev.map(p => p.id === data.participantId ? { ...p, ...data.participant, status: data.status } : p);
                return data.participant ? [...prev, { ...data.participant, status: data.status }] : prev;
              });
              if (data.participant) {
                setMessages(prev => prev.map(m => m.userId === data.participantId ? { ...m, userName: data.participant.displayName, userAvatarUrl: data.participant.avatarUrl } : m));
              }
              break;
          }
        };
      } catch (err) { console.error(err); }
    }
    startChat();
    return () => socketRef.current?.close();
  }, [navigate, roomId, user]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      let avatarUrl = user.avatarUrl;
      if (newAvatarFile) {
        const formData = new FormData();
        formData.append('file', newAvatarFile);
        const uploadRes = await fetch(`${BASE_URL}/uploads/avatar`, { method: 'POST', headers: DEFAULT_HEADERS, body: formData });
        const uploadData = await parseJsonResponse(uploadRes);
        avatarUrl = uploadData.avatarUrl;
      }
      const updated = await apiFetch('/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myUserId, displayName: newDisplayName, password: newPassword, avatarUrl })
      });
      const updatedUser = { ...user, ...updated, password: newPassword };
      setUser(updatedUser);
      localStorage.setItem('@Chat:User', JSON.stringify(updatedUser));
      setIsSettingsOpen(false);
      alert("Perfil atualizado!");
    } catch (err) { alert(err.message); } finally { setUpdatingProfile(false); }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if ((!inputValue.trim() && !attachment) || !socketRef.current) return;
    try {
      let fileUrl = '';
      if (attachment?.file) {
        setSendingAttachment(true);
        const formData = new FormData();
        formData.append('file', attachment.file);
        const res = await fetch(`${BASE_URL}/uploads/chat`, { method: 'POST', headers: DEFAULT_HEADERS, body: formData });
        const data = await parseJsonResponse(res);
        fileUrl = getFileUrlFromResponse(data);
      }
      socketRef.current.send(JSON.stringify({ type: 'message.send', content: inputValue.trim(), fileUrl, fileName: attachment?.name }));
      setInputValue('');
      setAttachment(null);
    } catch (error) { alert(error.message); } finally { setSendingAttachment(false); }
  }

  if (!user) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased">
      <div className={`absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`absolute inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-slate-800 bg-slate-900 transition-transform md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sala Ativa</h2>
          <p className="text-xl font-black text-white truncate">#{roomId}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Participantes ({participants.length})</p>
          <div className="space-y-4">
            {participants.map((p) => (
              <div key={p.id} className={`flex items-center gap-4 transition-opacity ${p.status === 'online' ? 'opacity-100' : 'opacity-40'}`}>
                <div className="relative shrink-0">
                  <RemoteImage src={formatAvatarUrl(p.avatarUrl)} className="h-10 w-10 rounded-2xl object-cover ring-2 ring-slate-800" />
                  <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${p.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span title={p.displayName || p.username} className={`truncate text-sm font-bold ${p.id === myUserId ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {p.displayName || p.username}
                  </span>
                  <span className="text-[9px] font-black uppercase opacity-50">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-2 border-t border-slate-800">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full rounded-xl bg-slate-800 py-3 text-[10px] font-black uppercase hover:bg-slate-700">Editar Perfil</button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="w-full rounded-xl bg-red-500/10 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/20">Sair</button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-[#0b0f1a]">
        <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/50 p-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-700 p-2"><MenuIcon /></button>
          <span className="font-black truncate max-w-[200px]">#{roomId}</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((msg, idx) => {
            const isMe = msg.userId === myUserId;
            return (
              <div key={msg.id || idx} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0">
                    <RemoteImage src={formatAvatarUrl(msg.userAvatarUrl)} className="h-10 w-10 rounded-2xl object-cover shadow-lg" />
                </div>
                <div className={`flex max-w-[80%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-[1.5rem] p-4 shadow-xl ${isMe ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-700/50 bg-slate-800'}`}>
                    {!isMe && <p title={msg.userName} className="mb-1 text-[10px] font-black uppercase opacity-40 truncate max-w-[150px]">{msg.userName}</p>}
                    {msg.content && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}
                    {msg.fileUrl && <MessageAttachment fileUrl={msg.fileUrl} fileName={msg.fileName} />}
                  </div>
                  <span className="mt-1 text-[9px] font-black uppercase opacity-30">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-900/50 p-4 md:p-10">
          <form onSubmit={sendMessage} className="mx-auto max-w-4xl space-y-4">
            {attachment && <AttachmentPreviewCard attachment={attachment} onRemove={() => setAttachment(null)} />}
            <div className="flex items-center gap-3 rounded-[2rem] border border-slate-700/50 bg-slate-800 p-2 pr-4">
              <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files[0];
                if (f) setAttachment({ file: f, name: f.name, size: f.size, type: f.type, previewUrl: URL.createObjectURL(f) });
              }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-700 text-slate-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              </button>
              <input type="text" className="flex-1 bg-transparent py-3 outline-none placeholder:text-slate-600" placeholder="Digite uma mensagem..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
              <button disabled={sendingAttachment} className="rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shrink-0">
                {sendingAttachment ? '...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-black text-white">Configurações de Perfil</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <RemoteImage src={newAvatarFile ? URL.createObjectURL(newAvatarFile) : formatAvatarUrl(user.avatarUrl)} className="h-24 w-24 rounded-[2rem] object-cover ring-4 ring-slate-800 group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase">Trocar</span>
                  </div>
                  <input type="file" className="hidden" ref={avatarInputRef} accept="image/*" onChange={e => setNewAvatarFile(e.target.files[0])} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Nome de Exibição</label>
                <input type="text" maxLength={30} className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-indigo-500" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</label>
                <input type="password" placeholder="Mantenha vazio para não alterar" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-indigo-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 rounded-2xl border border-slate-700 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-800">Cancelar</button>
                <button disabled={updatingProfile} className="flex-1 rounded-2xl bg-indigo-600 py-4 text-[10px] font-black uppercase text-white hover:bg-indigo-500 disabled:opacity-50">
                  {updatingProfile ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = '';
      if (isRegistering) {
        if (!name || !password || !email) throw new Error('Preencha os campos obrigatórios');
        if (avatarFile) {
          const formData = new FormData();
          formData.append('file', avatarFile);
          const uploadRes = await fetch(`${BASE_URL}/uploads/avatar`, { method: 'POST', headers: DEFAULT_HEADERS, body: formData });
          const uploadData = await parseJsonResponse(uploadRes);
          avatarUrl = uploadData.avatarUrl;
        }
        await apiFetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, displayName, password, email, avatarUrl }) });
        alert('Conta criada!');
        setIsRegistering(false);
      } else {
        const sessionData = await apiFetch('/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, password, roomId }) });
        localStorage.setItem('@Chat:User', JSON.stringify({ ...sessionData.user, password }));
        navigate(`/${roomId}`);
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 md:p-12 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-black text-white">Chat Connect</h1>
        <p className="mb-10 text-center text-xs font-bold uppercase tracking-widest text-slate-500">{isRegistering ? 'Crie sua conta' : 'Acesse uma sala'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <input type="email" placeholder="E-mail" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="text" maxLength={30} placeholder="Nome de Exibição" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </>
          )}
          <input type="text" maxLength={30} placeholder="Usuário" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" value={name} onChange={e => setName(e.target.value)} />
          <input type="password" placeholder="Senha" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          {!isRegistering && <input type="text" placeholder="ID da Sala" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" value={roomId} onChange={e => setRoomId(e.target.value)} />}
          {isRegistering && <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800"><span className="text-xs font-bold text-slate-500 px-4 text-center truncate">{avatarFile ? avatarFile.name : 'Foto de perfil (opcional)'}</span><input type="file" className="hidden" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} /></label>}
          <button disabled={loading} className="w-full rounded-2xl bg-indigo-600 py-5 text-sm font-black uppercase text-white shadow-xl hover:bg-indigo-500 transition-colors">{loading ? '...' : isRegistering ? 'Criar Conta' : 'Entrar'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="mt-8 w-full text-center text-xs font-black uppercase text-indigo-400 hover:underline">{isRegistering ? 'Já tem conta? Login' : 'Não tem conta? Cadastre-se'}</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/:roomId" element={<ChatRoom />} />
      </Routes>
    </HashRouter>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const BASE_URL = 'https://unconsenting-unwhetted-ben.ngrok-free.dev';
const CHAT_UPLOAD_ENDPOINTS = [
  '/uploads/file',
  '/uploads/files',
  '/uploads/message',
  '/uploads/chat',
  '/uploads/avatar',
];

const formatAvatarUrl = (path) => {
  if (!path) return 'https://ui-avatars.com/api/?name=User&background=random';
  const cleanPath = path.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${BASE_URL}${pathWithSlash}`;
};

const normalizeFileUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http')) return value;
  const pathWithSlash = value.startsWith('/') ? value : `/${value}`;
  return `${BASE_URL}${pathWithSlash}`;
};

const getFileExtension = (value = '') => {
  const cleanValue = value.split('?')[0].split('#')[0];
  const parts = cleanValue.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const getAttachmentKind = ({ name = '', type = '', url = '' }) => {
  const extension = getFileExtension(name || url);
  const mime = type.toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
    return 'image';
  }

  if (mime === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }

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
    if (typeof payload[key] === 'string' && payload[key]) {
      return normalizeFileUrl(payload[key]);
    }
  }

  if (payload.file && typeof payload.file === 'object') {
    for (const key of keys) {
      if (typeof payload.file[key] === 'string' && payload.file[key]) {
        return normalizeFileUrl(payload.file[key]);
      }
    }
  }

  return '';
};

function FileTypeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 3.75h6.586a2 2 0 0 1 1.414.586l3.664 3.664a2 2 0 0 1 .586 1.414V18.25A2.75 2.75 0 0 1 17.5 21h-9A2.75 2.75 0 0 1 5.75 18.25V6.5A2.75 2.75 0 0 1 8.5 3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14.75 3.75v4.5h4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.75 14.25h6.5M8.75 17.25h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 4.75v9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.75 11.75 12 15l3.25-3.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.75 18.25h12.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function AttachmentPreviewCard({ attachment, onRemove, compact = false }) {
  if (!attachment) return null;

  const kind = getAttachmentKind(attachment);
  const previewUrl = attachment.previewUrl || attachment.url;
  const wrapperClass = compact
    ? 'rounded-[1 .5rem] border border-slate-700/60 bg-slate-900/80 p-3'
    : 'rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-4';

  return (
    <div className={wrapperClass}>
      {kind === 'image' && (
        <img
          src={previewUrl}
          alt={attachment.name || 'Imagem anexada'}
          className={`w-full rounded-[1.25rem] object-cover ${compact ? 'max-h-32' : 'max-h-44'}`}
        />
      )}

      {kind === 'pdf' && (
        <div className={`flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-800/80 p-4 ${compact ? 'min-h-24' : 'min-h-28'}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <span className="text-xs font-black uppercase tracking-widest">PDF</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-100">{attachment.name || 'Documento PDF'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Primeira pagina disponivel ao abrir</p>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            download={attachment.name}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-600 text-slate-200 transition hover:border-slate-400 hover:text-white"
            aria-label="Baixar PDF"
          >
            <DownloadIcon className="w-5 h-5" />
          </a>
        </div>
      )}

      {kind === 'file' && (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-800/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
            <FileTypeIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-100">{attachment.name || 'Arquivo'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {attachment.type || getFileExtension(attachment.name || attachment.url) || 'Arquivo'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{attachment.name || 'Anexo'}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{formatBytes(attachment.size)}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-slate-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-red-500 hover:text-red-400"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

function MessageAttachment({ fileUrl, fileName }) {
  const normalizedUrl = normalizeFileUrl(fileUrl);
  if (!normalizedUrl) return null;

  const kind = getAttachmentKind({ name: fileName, url: normalizedUrl });

  if (kind === 'image') {
    return (
      <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-3 block">
        <img src={normalizedUrl} alt={fileName || 'Imagem enviada'} className="max-h-56 w-full rounded-[1.5rem] object-cover" />
      </a>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-900/70 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <span className="text-xs font-black uppercase tracking-widest">PDF</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{fileName || 'PDF anexado'}</p>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Abrir arquivo</p>
        </div>
        <a
          href={`${normalizedUrl}#page=1`}
          target="_blank"
          rel="noreferrer"
          download={fileName}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-600 text-slate-200 transition hover:border-slate-400 hover:text-white"
          aria-label="Baixar PDF"
        >
          <DownloadIcon className="w-5 h-5" />
        </a>
      </div>
    );
  }

  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-900/70 p-4"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
        <FileTypeIcon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{fileName || 'Arquivo anexado'}</p>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Abrir arquivo</p>
      </div>
    </a>
  );
}

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [user] = useState(() => {
    const saved = localStorage.getItem('@Chat:User');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [sendingAttachment, setSendingAttachment] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    if (attachment?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }, [attachment]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function startChat() {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            roomId,
          }),
        });
        const sessionData = await sessionRes.json();
        setMyUserId(sessionData.userId);

        const historyRes = await fetch(`${BASE_URL}/rooms/${roomId}/messages`);
        const historyData = await historyRes.json();
        setMessages(historyData.messages || []);

        const partRes = await fetch(`${BASE_URL}/rooms/${roomId}/participants`);
        const partData = await partRes.json();
        setParticipants(partData.participants || []);

        const socket = new WebSocket(sessionData.wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'room.joined':
              setParticipants(data.participants || []);
              break;

            case 'message.new':
              setMessages((prev) => [...prev, data.message]);
              break;

            case 'participant.status_change':
              setParticipants((prev) => {
                const userExists = prev.find((participant) => participant.id === data.participantId);

                if (userExists) {
                  return prev.map((participant) =>
                    participant.id === data.participantId ? { ...participant, status: data.status } : participant,
                  );
                }

                if (data.participant) {
                  return [...prev, { ...data.participant, status: data.status }];
                }

                return prev;
              });
              break;

            case 'error':
              console.error('Erro do servidor:', data.message);
              break;

            default:
              break;
          }
        };
      } catch (err) {
        console.error('Erro ao inicializar chat:', err);
      }
    }

    startChat();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [navigate, roomId, user]);

  function clearAttachment() {
    if (attachment?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
  }

  function handleAttachmentChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (attachment?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    setAttachment({
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      previewUrl: URL.createObjectURL(selectedFile),
    });

    event.target.value = '';
  }

  async function uploadAttachment(file) {
    for (const endpoint of CHAT_UPLOAD_ENDPOINTS) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) continue;

        const payload = await response.json();
        const fileUrl = getFileUrlFromResponse(payload);

        if (fileUrl) {
          return fileUrl;
        }
      } catch {
        continue;
      }
    }

    throw new Error('Nao foi possivel enviar o arquivo.');
  }

  async function sendMessage(event) {
    event.preventDefault();
    if ((!inputValue.trim() && !attachment) || !socketRef.current) return;

    try {
      let fileUrl = '';

      if (attachment?.file) {
        setSendingAttachment(true);
        fileUrl = await uploadAttachment(attachment.file);
      }

      socketRef.current.send(JSON.stringify({
        type: 'message.send',
        content: inputValue.trim(),
        fileUrl,
        fileName: attachment?.name || undefined,
      }));

      setInputValue('');
      clearAttachment();
    } catch (error) {
      alert(error.message);
    } finally {
      setSendingAttachment(false);
    }
  }

  if (!user) return null;

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return 0;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased">
      <aside className="flex w-80 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 p-10">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sala Ativa</h2>
          <p className="text-xl font-black text-white">#{roomId}</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-10">
          <p className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Participantes ({participants.length})
          </p>
          <div className="space-y-4">
            {sortedParticipants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center space-x-4 rounded-xl p-2 transition-all ${participant.status === 'online' ? 'opacity-100' : 'grayscale-[0.5] opacity-40'}`}
              >
                <div className="relative">
                  <img
                    src={formatAvatarUrl(participant.avatarUrl)}
                    className="h-10 w-10 rounded-2xl object-cover ring-2 ring-slate-800"
                    alt=""
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-slate-900 ${participant.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  />
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${participant.id === myUserId ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {participant.displayName || participant.username} {participant.id === myUserId && ' (Voce)'}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">
                    {participant.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full rounded-2xl bg-slate-800 py-4 text-[10px] font-black uppercase transition-all hover:bg-red-500/20 hover:text-red-500"
          >
            Sair da Conta
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-[#0b0f1a]">
        <div className="flex-1 space-y-10 overflow-y-auto p-12">
          {messages.map((msg, idx) => {
            const isMe = msg.userId === myUserId;

            return (
              <div key={msg.id || idx} className={`flex items-start space-x-5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <img
                  src={formatAvatarUrl(msg.userAvatarUrl)}
                  className="h-12 w-12 rounded-2xl border border-slate-800 object-cover shadow-2xl"
                  alt=""
                />
                <div className={`flex max-w-[65%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-[2rem] px-3 py-4 shadow-2xl ${isMe ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-700/50 bg-slate-800 text-slate-100'}`}
                  >
                    {!isMe && <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-40">{msg.userName}</p>}
                    {msg.content && <p className="text-md font-medium leading-relaxed">{msg.content}</p>}
                    {msg.fileUrl && <MessageAttachment fileUrl={msg.fileUrl} fileName={msg.fileName} />}
                  </div>
                  <span className="mt-2 px-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-900/50 p-10 backdrop-blur-xl">
          <form onSubmit={sendMessage} className="mx-auto max-w-5xl space-y-4">
            {attachment && <AttachmentPreviewCard attachment={attachment} onRemove={clearAttachment} />}

            <div className="flex items-center gap-3 rounded-[2rem] border border-slate-700/50 bg-slate-800 p-2 pr-4 shadow-2xl">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleAttachmentChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
                aria-label="Anexar arquivo"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path
                    d="M8.75 12.75 15.5 6a3 3 0 1 1 4.243 4.243l-8.132 8.132a5 5 0 1 1-7.071-7.071l8.485-8.486"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <input
                type="text"
                className="flex-1 bg-transparent px-2 py-5 text-sm outline-none placeholder:text-slate-600"
                placeholder={`Mensagem em #${roomId}...`}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
              />

              <button
                disabled={sendingAttachment}
                className="rounded-[1.5rem] bg-indigo-600 px-10 py-4 text-[10px] font-black tracking-widest text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-indigo-500"
              >
                {sendingAttachment ? 'ENVIANDO...' : 'ENVIAR'}
              </button>
            </div>
          </form>
        </div>
      </main>
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
        if (!name || !password || !email) return alert('Preencha todos os campos.');

        if (avatarFile) {
          const formData = new FormData();
          formData.append('file', avatarFile);
          const uploadRes = await fetch(`${BASE_URL}/uploads/avatar`, { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.avatarUrl;
        }

        const regRes = await fetch(`${BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, displayName, password, email, avatarUrl }),
        });

        if (!regRes.ok) throw new Error('Erro no registro');

        alert('Conta criada!');
        setIsRegistering(false);
      } else {
        if (!name || !password || !roomId) return alert('Preencha Nome, Senha e ID da Sala.');

        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, password, roomId }),
        });

        if (!sessionRes.ok) throw new Error('Credenciais invalidas');

        const sessionData = await sessionRes.json();
        localStorage.setItem('@Chat:User', JSON.stringify({
          username: sessionData.user.username,
          displayName: sessionData.user.displayName,
          avatarUrl: sessionData.user.avatarUrl,
          password,
        }));
        navigate(`/${roomId}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-slate-800 bg-slate-900 p-12 shadow-2xl">
        <h1 className="mb-2 text-center text-4xl font-black text-white">Chat Connect</h1>
        <p className="mb-10 text-center text-sm font-bold uppercase tracking-widest text-slate-500">
          {isRegistering ? 'Crie sua conta' : 'Acesse uma sala'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Seu E-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nome de Exibicao"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </>
          )}

          <input
            type="text"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nome de Usuario"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            type="password"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Sua Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {!isRegistering && (
            <input
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ID da Sala"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            />
          )}

          {isRegistering && (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800 transition-all hover:bg-slate-800/50">
              <span className="px-4 text-center text-xs font-bold text-slate-500">
                {avatarFile ? avatarFile.name : 'Foto de perfil (opcional)'}
              </span>
              <input type="file" className="hidden" accept="image/*" onChange={(event) => setAvatarFile(event.target.files[0])} />
            </label>
          )}

          <button disabled={loading} className="w-full rounded-2xl bg-indigo-600 py-5 font-black text-white shadow-xl transition-all active:scale-95">
            {loading ? 'PROCESSANDO...' : isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO CHAT'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:underline">
            {isRegistering ? 'Ja tenho conta? Login' : 'Nao tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/:roomId" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

  import React, { useEffect, useRef, useState } from 'react';
  import { HashRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';

  const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://unconsenting-unwhetted-ben.ngrok-free.dev').replace(/\/+$/, '');
  const DEFAULT_HEADERS = {
    'ngrok-skip-browser-warning': 'true',
  };
  const CHAT_UPLOAD_ENDPOINTS = [
    '/uploads/file',
    '/uploads/files',
    '/uploads/message',
    '/uploads/chat',
    '/uploads/avatar',
  ];
  const INITIAL_VISIBLE_MESSAGES = 50;
  const LOAD_MORE_MESSAGES_STEP = 50;

  const formatAvatarUrl = (path) => {
    if (!path) return 'https://ui-avatars.com/api/?name=User&background=random';
    const cleanPath = path.trim();
     let url = ''
     if (cleanPath.startsWith('http')) {
      url = cleanPath;
     } else {
      const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
      url = `${BASE_URL}${pathWithSlash}`;
     }

     const separator = url.includes('?') ? '&': '?';
     return `${url}${separator}ngrok-skip-browser-warning=1`
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

  async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.toLowerCase().includes('application/json')) {
      const responseText = await response.text();
      const snippet = responseText.slice(0, 120).replace(/\s+/g, ' ').trim();
      throw new Error(
        `Resposta invalida da API (${response.status}) em ${response.url}. Esperado JSON, recebido: ${snippet || 'vazio'}`,
      );
    }

    return response.json();
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data?.message || `Erro na requisicao para ${path}`);
    }

    return data;
  }

  async function apiFetchOrDefault(path, fallbackValue) {
    try {
      return await apiFetch(path);
    } catch (error) {
      console.warn(`Falha ao carregar ${path}:`, error);
      return fallbackValue;
    }
  }

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
      if (!src) {
        setResolvedSrc(fallbackSrc);
        return undefined;
      }

      let active = true;
      let objectUrl = '';

      async function loadImage() {
        try {
          const response = await fetch(src, { headers: DEFAULT_HEADERS });

          if (!response.ok) {
            throw new Error(`Falha ao carregar imagem: ${response.status}`);
          }

          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);

          if (!active) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          setResolvedSrc(objectUrl);
        } catch {
          if (active) {
            setResolvedSrc(fallbackSrc);
          }
        }
      }

      loadImage();

      return () => {
        active = false;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [fallbackSrc, src]);

    return <img src={resolvedSrc} alt={alt} className={className} />;
  }

  function AttachmentPreviewCard({ attachment, onRemove, compact = false }) {
    if (!attachment) return null;

    const kind = getAttachmentKind(attachment);
    const previewUrl = attachment.previewUrl || attachment.url;
    const wrapperClass = compact
      ? 'rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 p-3'
      : 'rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-3 sm:p-4';

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
          <div className={`flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-800/80 p-3 sm:p-4 ${compact ? 'min-h-24' : 'min-h-28'}`}>
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
          <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-800/80 p-3 sm:p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
              <FileTypeIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-100">{attachment.name || 'Arquivo'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {attachment.type || getFileExtension(attachment.name || attachment.url) || 'Arquivo'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <RemoteImage
            src={normalizedUrl}
            alt={fileName || 'Imagem enviada'}
            className="max-h-56 w-full rounded-[1.5rem] object-cover"
            fallbackSrc="https://ui-avatars.com/api/?name=Imagem&background=random"
          />
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
        <div className="min-w-0 flex-1">
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [visibleMessagesCount, setVisibleMessagesCount] = useState(INITIAL_VISIBLE_MESSAGES);

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
          const sessionData = await apiFetch('/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 
              'application/json',
            },
            body: JSON.stringify({
              username: user.username,
              password: user.password,
              roomId,
            }),
          });
          setMyUserId(sessionData.userId);

          const [historyData, partData] = await Promise.all([
            apiFetchOrDefault(`/rooms/${roomId}/messages`, { messages: [] }),
            apiFetchOrDefault(`/rooms/${roomId}/participants`, { participants: [] }),
          ]);
          setMessages(historyData.messages || []);
          setVisibleMessagesCount(INITIAL_VISIBLE_MESSAGES);
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
                setVisibleMessagesCount((prev) => prev + 1);
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

    useEffect(() => {
      setSidebarOpen(false);
    }, [roomId]);

    const hasHiddenMessages = messages.length > visibleMessagesCount;
    const visibleMessages = hasHiddenMessages ? messages.slice(-visibleMessagesCount) : messages;

    function showMoreMessages() {
      setVisibleMessagesCount((prev) => Math.min(prev + LOAD_MORE_MESSAGES_STEP, messages.length));
    }

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
            headers: DEFAULT_HEADERS,
            body: formData,
          });

          if (!response.ok) continue;

          const payload = await parseJsonResponse(response);
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
      <div className="flex h-dvh overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased">
        <div
          className={`absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity md:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`absolute inset-y-0 left-0 z-40 flex w-[min(84vw,20rem)] max-w-80 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 md:static md:w-80 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="border-b border-slate-800 p-5 md:p-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sala Ativa</h2>
            <p className="text-xl font-black text-white">#{roomId}</p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-10">
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
                    <RemoteImage
                      src={formatAvatarUrl(participant.avatarUrl)}
                      className="h-10 w-10 rounded-2xl object-cover ring-2 ring-slate-800"
                      alt={participant.displayName || participant.username || 'Avatar'}
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

          <div className="p-5 md:p-6">
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

        <main className="flex min-w-0 flex-1 flex-col bg-[#0b0f1a]">
          <div className="border-b border-slate-800/80 bg-slate-950/50 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-100"
                aria-label="Abrir participantes"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Sala</p>
                <p className="truncate text-base font-black text-white">#{roomId}</p>
              </div>
              <div className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                {participants.length}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4 md:space-y-8 md:p-8 xl:p-12">
            {hasHiddenMessages && (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={showMoreMessages}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Carregar anteriores
                </button>
              </div>
            )}

            {visibleMessages.map((msg, idx) => {
              const isMe = msg.userId === myUserId;

              return (
                <div key={msg.id || idx} className={`flex items-start gap-3 md:gap-5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <RemoteImage
                    src={formatAvatarUrl(msg.userAvatarUrl)}
                    className="h-10 w-10 shrink-0 rounded-2xl border border-slate-800 object-cover shadow-2xl md:h-12 md:w-12"
                    alt={msg.userName || 'Avatar'}
                  />
                  <div className={`flex min-w-0 max-w-[88%] flex-col sm:max-w-[78%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`w-full min-w-0 rounded-[1.5rem] px-3 py-3 shadow-2xl md:rounded-[2rem] md:px-4 md:py-4 ${isMe ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-700/50 bg-slate-800 text-slate-100'}`}
                    >
                      {!isMe && <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-40">{msg.userName}</p>}
                      {msg.content && <p className="break-words text-sm font-medium leading-relaxed md:text-base">{msg.content}</p>}
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

          <div className="border-t border-slate-800 bg-slate-900/50 px-3 py-3 backdrop-blur-xl sm:px-4 md:p-6 xl:p-10">
            <form onSubmit={sendMessage} className="mx-auto max-w-5xl space-y-3 md:space-y-4">
              {attachment && <AttachmentPreviewCard attachment={attachment} onRemove={clearAttachment} />}

              <div className="flex items-end gap-2 rounded-[1.75rem] border border-slate-700/50 bg-slate-800 p-2 shadow-2xl md:items-center md:gap-3 md:rounded-[2rem] md:pr-4">
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white md:h-14 md:w-14 md:rounded-[1.5rem]"
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
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none placeholder:text-slate-600 md:px-2 md:py-5"
                  placeholder={`Mensagem em #${roomId}...`}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                />

                <button
                  disabled={sendingAttachment}
                  className="shrink-0 rounded-[1.2rem] bg-indigo-600 px-4 py-3 text-[10px] font-black tracking-widest text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-indigo-500 md:rounded-[1.5rem] md:px-8 md:py-4"
                >
                  <span className="hidden sm:inline">{sendingAttachment ? 'ENVIANDO...' : 'ENVIAR'}</span>
                  <span className="sm:hidden">{sendingAttachment ? '...' : 'OK'}</span>
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
            const uploadRes = await fetch(`${BASE_URL}/uploads/avatar`, {
              method: 'POST',
              headers: DEFAULT_HEADERS,
              body: formData,
            });
            if (!uploadRes.ok) throw new Error('Erro no upload do avatar');
            const uploadData = await parseJsonResponse(uploadRes);
            avatarUrl = uploadData.avatarUrl;
          }

          await apiFetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, displayName, password, email, avatarUrl }),
          });

          alert('Conta criada!');
          setIsRegistering(false);
        } else {
          if (!name || !password || !roomId) return alert('Preencha Nome, Senha e ID da Sala.');

          const sessionData = await apiFetch('/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, password, roomId }),
          });
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 py-6 sm:p-6">
        <div className="w-full max-w-[440px] rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-[2.5rem] sm:p-8 md:p-12">
          <h1 className="mb-2 text-center text-3xl font-black text-white sm:text-4xl">Chat Connect</h1>
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-500 sm:mb-10 sm:text-sm sm:tracking-widest">
            {isRegistering ? 'Crie sua conta' : 'Acesse uma sala'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {isRegistering && (
              <>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 sm:p-4 sm:text-base"
                  placeholder="Seu E-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 sm:p-4 sm:text-base"
                  placeholder="Nome de Exibicao"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </>
            )}

            <input
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 sm:p-4 sm:text-base"
              placeholder="Nome de Usuario"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <input
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 sm:p-4 sm:text-base"
              placeholder="Sua Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {!isRegistering && (
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 sm:p-4 sm:text-base"
                placeholder="ID da Sala"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              />
            )}

            {isRegistering && (
              <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800 transition-all hover:bg-slate-800/50 sm:h-32">
                <span className="px-4 text-center text-xs font-bold text-slate-500">
                  {avatarFile ? avatarFile.name : 'Foto de perfil (opcional)'}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={(event) => setAvatarFile(event.target.files[0])} />
              </label>
            )}

            <button disabled={loading} className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl transition-all active:scale-95 sm:py-5 sm:text-base">
              {loading ? 'PROCESSANDO...' : isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO CHAT'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-400 hover:underline sm:text-xs sm:tracking-widest">
              {isRegistering ? 'Ja tenho conta? Login' : 'Nao tem conta? Cadastre-se'}
            </button>
          </div>
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

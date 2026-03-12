import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

const BASE_URL = 'http://192.168.100.25:3333';

/**
 * FUNÇÃO DE UTILIDADE: Resolve o problema de URLs duplicadas ou relativas.
 * Se a URL já começar com http, ela não mexe. Se for relativa, ela adiciona o IP.
 */
const formatAvatarUrl = (path) => {
  if (!path) return 'https://ui-avatars.com/api/?name=User&background=random'; 
  const cleanPath = path.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${BASE_URL}${pathWithSlash}`;
};

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Dados do usuário vindos do login
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('@Chat:User');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [myUserId, setMyUserId] = useState(null); // Guardar o ID da sessão atual
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function startChat() {
      if (initialized.current) return;
      initialized.current = true;

      try {
        // PASSO 1: Criar Sessão (Página 2)
        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: user.username,
            password: user.password,
            roomId: roomId, 
            avatarUrl: user.avatarUrl 
          }),
        });
        const sessionData = await sessionRes.json();
        setMyUserId(sessionData.userId); // Importante para o CSS das mensagens

        // PASSO 2: Carregar Histórico (Página 3)
        const historyRes = await fetch(`${BASE_URL}/rooms/${roomId}/messages`);
        const historyData = await historyRes.json();
        setMessages(historyData.messages || []);

        // PASSO 3: Carregar Participantes Online (Requisito da Página 3)
        const partRes = await fetch(`${BASE_URL}/rooms/${roomId}/participants`);
        const partData = await partRes.json();
        setParticipants(partData.participants || []);

        // PASSO 4: Conectar WebSocket (Página 3 e 5)
        const socket = new WebSocket(sessionData.wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'room.joined':
              setParticipants(data.participants || []);
              break;
            case 'message.new':
              setMessages(prev => [...prev, data.message]);
              break;
            case 'participant.joined':
              setParticipants(prev => {
                if (prev.find(p => p.id === data.participant.id)) return prev;
                return [...prev, data.participant];
              });
              break;
            case 'participant.left':
              setParticipants(prev => prev.filter(p => p.id !== data.participantId));
              break;
            case 'error':
              console.error("Erro do servidor:", data.message);
              break;
            default:
              break;
          }
        };

      } catch (err) {
        console.error("Erro ao inicializar chat:", err);
      }
    }

    startChat();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [roomId, user, navigate]);

  function sendMessage(e) {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      type: 'message.send',
      content: inputValue
    }));
    
    setInputValue('');
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR - Participantes */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl">
        <div className="p-10 border-b border-slate-800">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sala Ativa</h2>
          <p className="text-white font-black text-xl">#{roomId}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Online ({participants.length})</p>
          <div className="space-y-4">
            {participants.map(p => (
              <div key={p.id} className="flex items-center space-x-4 p-2 transition-all hover:bg-white/5 rounded-xl">
                <img src={formatAvatarUrl(p.avatarUrl)} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-800" alt="" />
                <span className={`text-sm font-bold ${p.id === myUserId ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {p.displayName || p.username} {p.id === myUserId && " (Você)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500/20 hover:text-red-500 transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* CHAT MAIN */}
      <main className="flex-1 flex flex-col bg-[#0b0f1a]">
        <div className="flex-1 overflow-y-auto p-12 space-y-10">
          {messages.map((msg, idx) => {
            // Se o ID da mensagem for o meu, alinha à direita
            const isMe = msg.userId == myUserId;

            return (
              <div key={idx} className={`flex items-start space-x-5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <img src={formatAvatarUrl(msg.userAvatarUrl)} className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-slate-800" alt="" />
                <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-6 py-4 rounded-[2rem] shadow-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'}`}>
                    {!isMe && <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">{msg.userName}</p>}
                    <p className="text-md font-medium leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[9px] mt-2 font-black text-slate-600 uppercase tracking-widest px-2">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUTBAR */}
        <div className="p-10 bg-slate-900/50 border-t border-slate-800 backdrop-blur-xl">
          <form onSubmit={sendMessage} className="max-w-5xl mx-auto flex items-center bg-slate-800 rounded-[2rem] p-2 pr-4 shadow-2xl border border-slate-700/50">
            <input 
              type="text" 
              className="flex-1 bg-transparent px-8 py-5 outline-none text-sm placeholder:text-slate-600" 
              placeholder={`Mensagem em #${roomId}...`} 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-[1.5rem] text-[10px] font-black tracking-widest transition-all active:scale-95">ENVIAR</button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  
  // New State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState(''); // New field
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = '';

      if (isRegistering) {
        // --- REGISTRATION FLOW ---
        if (!name || !password || !email) return alert("Preencha todos os campos.");

        // 1. Upload Avatar if selected
        if (avatarFile) {
          const formData = new FormData();
          formData.append('file', avatarFile);
          const uploadRes = await fetch(`${BASE_URL}/uploads/avatar`, { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.avatarUrl;
        }

        // 2. Call Register API
        const regRes = await fetch(`${BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name,displayName, password, email, avatarUrl })
        });

        if (!regRes.ok) {
            const error = await regRes.json();
            throw new Error(error.error || "Erro no registro");
        }

        alert("Conta criada com sucesso! Agora faça login.");
        setIsRegistering(false); // Switch to login mode
      } else {
        // --- LOGIN FLOW ---
        if (!name || !password || !roomId) return alert("Preencha Nome, Senha e ID da Sala.");

        const sessionRes = await fetch(`${BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, password, roomId }),
        });

        if (!sessionRes.ok) throw new Error("Usuário ou senha incorretos");

        const sessionData = await sessionRes.json();

        // Save session including display name and avatar from server
        localStorage.setItem('@Chat:User', JSON.stringify({
          username: sessionData.user.username,
          displayName: sessionData.user.displayName,
          avatarUrl: sessionData.user.avatarUrl,
          password: password // Keep password for the session logic in ChatRoom
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[440px] bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 shadow-2xl">
        <h1 className="text-4xl font-black text-white text-center mb-2">Chat Connect</h1>
        <p className="text-slate-500 text-center mb-10 text-sm font-bold uppercase tracking-widest">
            {isRegistering ? 'Crie sua conta' : 'Acesse uma sala'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field only shows during registration */}
          {isRegistering && (
            <>
              <input 
                type="email" 
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Seu E-mail" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
              
              {/* NEW FIELD */}
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Nome de Exibição (ex: João Silva)" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
              />
            </>
          )}

          <input type="text" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nome de Usuário" value={name} onChange={e => setName(e.target.value)} />
          <input type="password" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} />
          
          {/* Room ID only shows during Login */}
          {!isRegistering && (
            <input type="text" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ID da Sala (ex: dev)" value={roomId} onChange={e => setRoomId(e.target.value)} />
          )}
          
          {/* Avatar only shows during Registration */}
          {isRegistering && (
              <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-800/50 transition-all">
                <span className="text-xs text-slate-500 font-bold text-center px-4">
                  {avatarFile ? avatarFile.name : 'Foto de perfil (opcional)'}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} />
              </label>
          )}

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'PROCESSANDO...' : isRegistering ? 'CRIAR CONTA' : 'ENTRAR NO CHAT'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-indigo-400 text-xs font-black uppercase tracking-widest hover:underline"
            >
                {isRegistering ? 'Já tenho conta? Login' : 'Não tem conta? Cadastre-se'}
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
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Hooks & Services
import { useChat } from '../hooks/useChat';
import uploadService from '../services/uploadService';

// Components
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageInput from '../components/chat/MessageInput';
import { MessageItem } from '../components/chat/MessageItem';
import SettingsModal from '../components/profile/SettingsModal';

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('@Chat:User') || 'null'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Custom Hook for Socket Logic
  const { messages, participants, myUserId, sendMessage } = useChat(roomId, user);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Redirection if not logged in
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleSendMessage = async (content, attachment) => {
    setIsSending(true);
    try {
      let fileUrl = '';
      if (attachment?.file) {
        const uploadRes = await uploadService.upload(attachment.file, 'chat');
        fileUrl = uploadRes.fileUrl || uploadRes.url;
      }

      sendMessage({
        content: content.trim(),
        fileUrl,
        fileName: attachment?.name
      });
      return true; // Success
    } catch (err) {
      alert("Erro ao enviar mensagem: " + err.message);
      return false; // Fail
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased">
      
      <Sidebar 
        roomId={roomId}
        participants={participants}
        myUserId={myUserId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex flex-1 flex-col bg-[#0b0f1a]">
        <ChatHeader 
          roomId={roomId} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              isMe={String(msg.userId) === String(myUserId)} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput 
          onSendMessage={handleSendMessage} 
          sending={isSending} 
        />
      </main>

      {isSettingsOpen && (
        <SettingsModal 
          user={user} 
          setUser={setUser} 
          myUserId={myUserId} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
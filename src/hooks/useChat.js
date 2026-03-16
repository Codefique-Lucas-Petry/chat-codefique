import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api/client';
import { authService } from '../services/authService';

export function useChat(roomId, user) {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !roomId) return;

    const connect = async () => {
      try {
        const session = await authService.login(user.username, user.password, roomId);
        setMyUserId(session.userId);

        const history = await apiFetch(`/rooms/${roomId}/messages`).catch(() => ({ messages: [] }));
        const parts = await apiFetch(`/rooms/${roomId}/participants`).catch(() => ({ participants: [] }));
        
        setMessages(history.messages || []);
        setParticipants(parts.participants || []);

        const socket = new WebSocket(session.wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'message.new') setMessages(prev => [...prev, data.message]);
          if (data.type === 'room.joined') setParticipants(data.participants);
          // Add status change handling here if needed
        };
      } catch (err) { console.error(err); }
    };

    connect();
    return () => socketRef.current?.close();
  }, [roomId, user]);

  const sendMessage = (payload) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'message.send', ...payload }));
    }
  };

  return { messages, participants, myUserId, sendMessage };
}
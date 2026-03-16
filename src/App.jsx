import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';

// IMPORTANT: Must have "export default" here
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
import React, { useState, useRef } from 'react';
import { AttachmentPreview } from './AttachmentPreview';

export default function MessageInput({ onSendMessage, sending }) {
  const [inputValue, setInputValue] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!inputValue.trim() && !attachment) || sending) return;

    // Send data up to the parent page
    const success = await onSendMessage(inputValue, attachment);
    
    if (success) {
      setInputValue('');
      setAttachment(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file)
      });
    }
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 p-4 md:p-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">
        {attachment && (
          <AttachmentPreview 
            attachment={attachment} 
            onRemove={() => setAttachment(null)} 
          />
        )}
        
        <div className="flex items-center gap-3 rounded-[2rem] border border-slate-700/50 bg-slate-800 p-2 pr-4 shadow-inner">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>

          <input 
            type="text" 
            className="flex-1 bg-transparent py-3 outline-none placeholder:text-slate-600 text-slate-200" 
            placeholder="Digite uma mensagem..." 
            value={inputValue} 
            onChange={e => setInputValue(e.target.value)} 
          />

          <button 
            disabled={sending || (!inputValue.trim() && !attachment)} 
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors shrink-0"
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import { authService } from '../../services/authService';
import { uploadService } from '../../services/uploadService';
import { RemoteImage } from '../common/RemoteImage';
import { formatAvatarUrl } from '../../utils/urlHelpers';

export default function SettingsModal({ user, setUser, myUserId, onClose }) {
  // Local states for the form
  const [newDisplayName, setNewDisplayName] = useState(user.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  const avatarInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Business Logic: Password change requires old password
    if (newPassword && !oldPassword) {
      alert("Você precisa digitar a senha atual para definir uma nova.");
      return;
    }

    setUpdating(true);
    try {
      let avatarUrl = user.avatarUrl;

      // 1. Handle Avatar Upload if a new file was selected
      if (newAvatarFile) {
        const uploadData = await uploadService.upload(newAvatarFile, 'avatar');
        avatarUrl = uploadData.avatarUrl;
      }

      // 2. Call the Auth Service to update profile data
      const updatedData = await authService.updateProfile(myUserId, {
        displayName: newDisplayName,
        password: newPassword || undefined,
        oldPassword: oldPassword || undefined,
        avatarUrl
      });

      // 3. Update Global State and LocalStorage
      const updatedUser = { 
        ...user, 
        ...updatedData, 
        password: newPassword || user.password 
      };
      
      setUser(updatedUser);
      localStorage.setItem('@Chat:User', JSON.stringify(updatedUser));
      
      alert("Perfil atualizado com sucesso!");
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h2 className="mb-6 text-xl font-black text-white">Configurações de Perfil</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => avatarInputRef.current?.click()}
            >
              <RemoteImage 
                src={newAvatarFile ? URL.createObjectURL(newAvatarFile) : formatAvatarUrl(user.avatarUrl)} 
                className="h-24 w-24 rounded-[2rem] object-cover ring-4 ring-slate-800 group-hover:opacity-50 transition-opacity" 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase text-white">Trocar</span>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={avatarInputRef} 
                accept="image/*" 
                onChange={e => setNewAvatarFile(e.target.files[0])} 
              />
            </div>
          </div>
          
          {/* Display Name */}
          <div className="space-y-1">
            <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Nome de Exibição
            </label>
            <input 
              type="text" 
              maxLength={30} 
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              value={newDisplayName} 
              onChange={e => setNewDisplayName(e.target.value)} 
            />
          </div>

          {/* Current Password (Required for changes) */}
          <div className="space-y-1">
            <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Senha Atual
            </label>
            <input 
              type="password" 
              placeholder="Obrigatório para mudar senha" 
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
            />
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Nova Senha
            </label>
            <input 
              type="password" 
              placeholder="Mantenha vazio para não alterar" 
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 rounded-2xl border border-slate-700 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={updating} 
              className="flex-1 rounded-2xl bg-indigo-600 py-4 text-[10px] font-black uppercase text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {updating ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
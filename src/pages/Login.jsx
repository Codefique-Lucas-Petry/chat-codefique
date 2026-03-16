import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { uploadService } from '../services/uploadService';

export default function Login() {
  const navigate = useNavigate();
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', displayName: '', roomId: '' });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isReg) {
        let avatarUrl = '';
        if (avatar) {
          const res = await uploadService.upload(avatar, 'avatar');
          avatarUrl = res.avatarUrl;
        }
        await authService.register({ ...form, avatarUrl });
        alert('Conta criada!');
        setIsReg(false);
      } else {
        const session = await authService.login(form.username, form.password, form.roomId);
        localStorage.setItem('@Chat:User', JSON.stringify({ ...session.user, password: form.password }));
        navigate(`/${form.roomId}`);
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-[440px] rounded-[2.5rem] border border-slate-800 bg-slate-900 p-12 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-black text-white">Chat Connect</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isReg && <input type="email" placeholder="E-mail" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" onChange={e => setForm({...form, email: e.target.value})} />}
          <input type="text" placeholder="Usuário" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" onChange={e => setForm({...form, username: e.target.value})} />
          <input type="password" placeholder="Senha" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" onChange={e => setForm({...form, password: e.target.value})} />
          {!isReg && <input type="text" placeholder="ID da Sala" className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none" onChange={e => setForm({...form, roomId: e.target.value})} />}
          <button className="w-full rounded-2xl bg-indigo-600 py-5 font-black uppercase text-white">{loading ? '...' : isReg ? 'Cadastrar' : 'Entrar'}</button>
        </form>
        <button onClick={() => setIsReg(!isReg)} className="mt-8 w-full text-center text-xs font-black uppercase text-indigo-400">
          {isReg ? 'Já tem conta? Login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}
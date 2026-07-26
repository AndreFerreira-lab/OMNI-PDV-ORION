import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useEffect } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async () => {
    setErro('');
    setLoading(true);
    if (registrando) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErro(error.message);
      else alert('Conta criada! Verifique seu email para confirmar.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErro('Email ou senha inválidos.');
      else navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">O</div>
          <span className="login-logo-text">PDV Omni Orion</span>
        </div>

        <p className="login-subtitle">
          {registrando ? 'Criar nova conta' : 'Acesse sua conta para continuar'}
        </p>

        {erro && <div className="login-error">{erro}</div>}

        <div className="login-form" style={{ marginTop: 16 }}>
          <div>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="login-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          <div>
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Aguarde...' : registrando ? 'Cadastrar' : 'Entrar'}
          </button>
        </div>

        <div className="login-link-row">
          {registrando ? 'Já tem conta? ' : 'Não tem conta? '}
          <button
            className="login-link"
            onClick={() => { setRegistrando(!registrando); setErro(''); }}
          >
            {registrando ? 'Fazer login' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

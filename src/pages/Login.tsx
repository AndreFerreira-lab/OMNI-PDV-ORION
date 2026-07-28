import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useEffect } from 'react';
import orionLogo from '../orion-logo.jpg';
import orionNetwork from '../orion-network.jpg';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [recuperacaoOpen, setRecuperacaoOpen] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);
  const [recuperacaoErro, setRecuperacaoErro] = useState('');
  const [recuperacaoLoading, setRecuperacaoLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (!recuperacaoOpen) return;
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRecuperacaoOpen(false);
    };
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [recuperacaoOpen]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setErro('');
    if (!email.trim() || !password) {
      setErro('Informe seu e-mail e senha para continuar.');
      return;
    }
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

  const solicitarRecuperacao = async (event: React.FormEvent) => {
    event.preventDefault();
    setRecuperacaoErro('');
    const recoveryEmail = (emailRecuperacao || email).trim();
    if (!recoveryEmail) {
      setRecuperacaoErro('Informe o e-mail da sua conta.');
      return;
    }
    setRecuperacaoLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      setEmailRecuperacao(recoveryEmail);
      setRecuperacaoEnviada(true);
    } catch (error) {
      const authError = error as { status?: number; code?: string };
      if (authError.status === 429 || authError.code === 'over_email_send_rate_limit') {
        setRecuperacaoErro('Limite temporário de e-mails do Supabase atingido. Tente novamente mais tarde.');
      } else {
        setRecuperacaoErro('Não foi possível enviar o link. Tente novamente em alguns minutos.');
      }
    } finally {
      setRecuperacaoLoading(false);
    }
  };

  const abrirRecuperacao = () => {
    setEmailRecuperacao(email);
    setRecuperacaoErro('');
    setRecuperacaoEnviada(false);
    setRecuperacaoOpen(true);
  };

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <div className="login-shell">
        <section
          className="login-brand-panel"
          style={{ backgroundImage: `linear-gradient(145deg, rgba(5,10,20,.93), rgba(7,35,67,.78)), url(${orionNetwork})` }}
        >
          <div className="login-brand">
            <img src={orionLogo} alt="OMNI PDV ORION" />
            <div>
              <strong>OMNI PDV ORION</strong>
              <span>Gestão comercial inteligente</span>
            </div>
          </div>

          <div className="login-brand-content">
            <span className="login-eyebrow">Controle. Segurança. Resultado.</span>
            <h1>Seu ponto de venda conectado a toda operação.</h1>
            <p>Acompanhe clientes, produtos, vendas e indicadores em uma única plataforma.</p>

            <div className="login-feature-list">
              <span><i>✓</i> Operação centralizada e segura</span>
              <span><i>✓</i> Indicadores comerciais em tempo real</span>
              <span><i>✓</i> Acesso personalizado por usuário</span>
            </div>
          </div>

          <div className="login-brand-footer">
            <span className="login-status-dot" />
            Ambiente protegido pelo controle de acesso Orion
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-mobile-brand">
            <img src={orionLogo} alt="" />
            <span>OMNI PDV ORION</span>
          </div>

          <div className="login-form-heading">
            <span className="login-form-badge">{registrando ? 'Novo acesso' : 'Área segura'}</span>
            <h2>{registrando ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
            <p>{registrando ? 'Preencha seus dados para solicitar acesso.' : 'Entre com suas credenciais para continuar.'}</p>
          </div>

          {erro && <div className="login-error" role="alert">{erro}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">E-mail</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="login-password">Senha</label>
                {!registrando && (
                  <button type="button" className="login-link" onClick={abrirRecuperacao} disabled={loading}>
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="10" rx="2"/>
                  <path d="M8 10V7a4 4 0 018 0v3"/>
                </svg>
                <input
                  id="login-password"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Digite sua senha"
                  autoComplete={registrando ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading && <span className="login-spinner" aria-hidden="true" />}
              {loading ? 'Aguarde...' : registrando ? 'Criar conta' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="login-link-row">
            {registrando ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'}
            <button
              type="button"
              className="login-link"
              disabled={loading}
              onClick={() => { setRegistrando(!registrando); setErro(''); }}
            >
              {registrando ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </div>

          <p className="login-security-note">
            Ao acessar, você concorda com as políticas de segurança e privacidade do sistema.
          </p>
        </section>
      </div>

      {recuperacaoOpen && (
        <div className="modal-overlay" onClick={() => setRecuperacaoOpen(false)}>
          <div className="modal-box recovery-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-title" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-title" id="recovery-title">Recuperar senha</span>
                <p className="recovery-modal-subtitle">Enviaremos um link seguro para redefinir sua senha.</p>
              </div>
              <button type="button" className="modal-close" aria-label="Fechar" onClick={() => setRecuperacaoOpen(false)}>×</button>
            </div>
            {recuperacaoEnviada ? (
              <div className="recovery-success">
                <span>✓</span>
                <h3>Verifique seu e-mail</h3>
                <p>Se existir uma conta para <strong>{emailRecuperacao}</strong>, você receberá as instruções de recuperação.</p>
                <button className="btn btn-green" onClick={() => setRecuperacaoOpen(false)}>Voltar ao login</button>
              </div>
            ) : (
              <form onSubmit={solicitarRecuperacao}>
                <div className="modal-body">
                  {recuperacaoErro && <div className="login-error" role="alert">{recuperacaoErro}</div>}
                  <div className="form-group">
                    <label className="form-label" htmlFor="recovery-email">E-mail da conta</label>
                    <input
                      id="recovery-email"
                      type="email"
                      className="form-control"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={emailRecuperacao}
                      onChange={event => setEmailRecuperacao(event.target.value)}
                      disabled={recuperacaoLoading}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setRecuperacaoOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-green" disabled={recuperacaoLoading}>
                    {recuperacaoLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

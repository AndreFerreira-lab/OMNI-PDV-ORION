import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import orionLogo from '../orion-logo.jpg';
import orionNetwork from '../orion-network.jpg';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [validandoLink, setValidandoLink] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let active = true;
    const parametros = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const veioDoLink = parametros.has('code') || hash.get('type') === 'recovery';
    if (veioDoLink) sessionStorage.setItem('orion-password-recovery', 'true');

    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('orion-password-recovery', 'true');
        setLinkValido(true);
        setValidandoLink(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        const recuperacaoIniciada = sessionStorage.getItem('orion-password-recovery') === 'true';
        setLinkValido(!error && Boolean(data.session) && recuperacaoIniciada);
        setValidandoLink(false);
      })
      .catch(() => {
        if (!active) return;
        setLinkValido(false);
        setValidandoLink(false);
      });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const salvarNovaSenha = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas informadas não são iguais.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      sessionStorage.removeItem('orion-password-recovery');
      setSucesso(true);
      await supabase.auth.signOut();
    } catch {
      setErro('O link expirou ou não foi possível atualizar a senha. Solicite um novo link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page reset-password-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <div className="reset-password-shell">
        <div
          className="reset-password-brand"
          style={{ backgroundImage: `linear-gradient(145deg, rgba(5,10,20,.94), rgba(7,35,67,.82)), url(${orionNetwork})` }}
        >
          <img src={orionLogo} alt="OMNI PDV ORION" />
          <span>OMNI PDV ORION</span>
        </div>
        <div className="reset-password-card">
          {validandoLink ? (
            <div className="reset-password-state"><span className="login-spinner" /><h2>Validando link seguro...</h2></div>
          ) : sucesso ? (
            <div className="reset-password-state success">
              <span>✓</span>
              <h2>Senha atualizada</h2>
              <p>Sua nova senha foi salva. Faça login novamente para continuar.</p>
              <button className="login-btn" onClick={() => navigate('/')}>Voltar ao login</button>
            </div>
          ) : !linkValido ? (
            <div className="reset-password-state error">
              <span>!</span>
              <h2>Link inválido ou expirado</h2>
              <p>Solicite um novo link de recuperação na tela de login.</p>
              <button className="login-btn" onClick={() => navigate('/')}>Voltar ao login</button>
            </div>
          ) : (
            <>
              <div className="login-form-heading">
                <span className="login-form-badge">Recuperação segura</span>
                <h2>Defina sua nova senha</h2>
                <p>Use pelo menos 8 caracteres e confirme a senha.</p>
              </div>
              {erro && <div className="login-error" role="alert">{erro}</div>}
              <form className="login-form" onSubmit={salvarNovaSenha}>
                <div className="login-field">
                  <label htmlFor="new-password">Nova senha</label>
                  <div className="login-input-wrap">
                    <input
                      id="new-password"
                      type={mostrarSenha ? 'text' : 'password'}
                      className="login-input"
                      autoComplete="new-password"
                      value={senha}
                      onChange={event => setSenha(event.target.value)}
                      disabled={loading}
                    />
                    <button type="button" className="login-password-toggle" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setMostrarSenha(!mostrarSenha)}>
                      {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label htmlFor="confirm-password">Confirmar nova senha</label>
                  <div className="login-input-wrap">
                    <input
                      id="confirm-password"
                      type={mostrarSenha ? 'text' : 'password'}
                      className="login-input reset-password-input-plain"
                      autoComplete="new-password"
                      value={confirmacao}
                      onChange={event => setConfirmacao(event.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Atualizando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

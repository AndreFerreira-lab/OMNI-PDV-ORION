import { useEffect, useMemo, useState } from 'react';
import {
  atualizarPerfilAcesso,
  atualizarUsuarioSistema,
  criarPerfilAcesso,
  excluirPerfilAcesso,
  excluirUnidadeOrganizacional,
  listarPerfisAcesso,
  listarPermissoes,
  listarUnidadesOrganizacionais,
  listarUsuariosSistema,
  salvarAcessoUsuario,
  salvarPermissoesPerfil,
  salvarUnidadeOrganizacional,
} from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import type {
  PerfilAcesso,
  Permissao,
  UnidadeOrganizacional,
  UsuarioSistema,
} from '../lib/types';

type AdminTab = 'perfis' | 'usuarios' | 'unidades';
type OverrideValue = 'herdar' | 'permitir' | 'negar';

export default function Administracao() {
  const { user, can, refreshPermissions } = useAuth();
  const [tab, setTab] = useState<AdminTab>('perfis');
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [busca, setBusca] = useState('');

  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilAcesso | null>(null);
  const [perfilForm, setPerfilForm] = useState({ nome: '', descricao: '', ativo: true });
  const [perfilPermissoes, setPerfilPermissoes] = useState<Set<number>>(new Set());
  const [novoPerfilOpen, setNovoPerfilOpen] = useState(false);
  const [novoPerfil, setNovoPerfil] = useState({ nome: '', descricao: '' });

  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioSistema | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({ nome: '', cargo: '', ativo: true });
  const [usuarioPerfis, setUsuarioPerfis] = useState<Set<number>>(new Set());
  const [perfilPrincipal, setPerfilPrincipal] = useState<number | null>(null);
  const [usuarioExcecoes, setUsuarioExcecoes] = useState<Record<number, OverrideValue>>({});

  const [unidadeModal, setUnidadeModal] = useState(false);
  const [unidadeEditando, setUnidadeEditando] = useState<UnidadeOrganizacional | null>(null);
  const [unidadeForm, setUnidadeForm] = useState({
    nome: '',
    descricao: '',
    parent_id: '',
    ativo: true,
  });

  const carregar = async () => {
    setLoading(true);
    const [pms, pfs, us, uns] = await Promise.all([
      listarPermissoes(),
      listarPerfisAcesso(),
      listarUsuariosSistema(),
      listarUnidadesOrganizacionais(),
    ]);
    const error = pms.error || pfs.error || us.error || uns.error;
    if (error) setFeedback({ tipo: 'erro', texto: error.message });
    setPermissoes(pms.data);
    setPerfis(pfs.data);
    setUsuarios(us.data);
    setUnidades(uns.data);
    setLoading(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const permissoesPorModulo = useMemo(() => {
    return permissoes.reduce<Record<string, Permissao[]>>((acc, permissao) => {
      (acc[permissao.modulo] ??= []).push(permissao);
      return acc;
    }, {});
  }, [permissoes]);

  const selecionarPerfil = (perfil: PerfilAcesso) => {
    setPerfilSelecionado(perfil);
    setPerfilForm({
      nome: perfil.nome,
      descricao: perfil.descricao ?? '',
      ativo: perfil.ativo,
    });
    setPerfilPermissoes(new Set(perfil.perfil_permissoes?.map(p => p.permissao_id) ?? []));
    setFeedback(null);
  };

  const selecionarUsuario = (usuario: UsuarioSistema) => {
    setUsuarioSelecionado(usuario);
    setUsuarioForm({
      nome: usuario.nome ?? '',
      cargo: usuario.cargo ?? '',
      ativo: usuario.ativo,
    });
    const ids = new Set(usuario.usuario_perfis?.map(p => p.perfil_id) ?? []);
    setUsuarioPerfis(ids);
    setPerfilPrincipal(
      usuario.usuario_perfis?.find(p => p.principal)?.perfil_id
      ?? usuario.usuario_perfis?.[0]?.perfil_id
      ?? null
    );
    const overrides: Record<number, OverrideValue> = {};
    usuario.usuario_permissoes?.forEach(item => {
      overrides[item.permissao_id] = item.permitido ? 'permitir' : 'negar';
    });
    setUsuarioExcecoes(overrides);
    setFeedback(null);
  };

  const togglePerfilPermissao = (id: number) => {
    if (perfilSelecionado?.slug === 'admin') return;
    setPerfilPermissoes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModulo = (lista: Permissao[]) => {
    if (perfilSelecionado?.slug === 'admin') return;
    const todos = lista.every(item => perfilPermissoes.has(item.id));
    setPerfilPermissoes(prev => {
      const next = new Set(prev);
      lista.forEach(item => todos ? next.delete(item.id) : next.add(item.id));
      return next;
    });
  };

  const salvarPerfil = async () => {
    if (!perfilSelecionado || !can('perfis.editar')) return;
    setSaving(true);
    setFeedback(null);
    const update = await atualizarPerfilAcesso(perfilSelecionado.id, perfilForm);
    if (update.error) {
      setFeedback({ tipo: 'erro', texto: update.error.message });
      setSaving(false);
      return;
    }
    if (perfilSelecionado.slug !== 'admin') {
      const access = await salvarPermissoesPerfil(perfilSelecionado.id, [...perfilPermissoes]);
      if (access.error) {
        setFeedback({ tipo: 'erro', texto: access.error.message });
        setSaving(false);
        return;
      }
    }
    await carregar();
    setFeedback({ tipo: 'ok', texto: 'Perfil e permissões salvos com sucesso.' });
    setSaving(false);
  };

  const criarPerfil = async () => {
    if (!novoPerfil.nome.trim() || !can('perfis.criar')) return;
    setSaving(true);
    const { data, error } = await criarPerfilAcesso({
      nome: novoPerfil.nome.trim(),
      descricao: novoPerfil.descricao.trim() || null,
    });
    if (error) {
      setFeedback({ tipo: 'erro', texto: error.message });
    } else {
      setNovoPerfilOpen(false);
      setNovoPerfil({ nome: '', descricao: '' });
      await carregar();
      if (data) selecionarPerfil({ ...data, perfil_permissoes: [] } as PerfilAcesso);
      setFeedback({ tipo: 'ok', texto: 'Perfil criado. Agora selecione suas permissões.' });
    }
    setSaving(false);
  };

  const excluirPerfil = async () => {
    if (!perfilSelecionado || perfilSelecionado.sistema || !can('perfis.excluir')) return;
    if (!confirm(`Excluir o perfil "${perfilSelecionado.nome}"?`)) return;
    const { error } = await excluirPerfilAcesso(perfilSelecionado.id);
    if (error) setFeedback({ tipo: 'erro', texto: error.message });
    else {
      setPerfilSelecionado(null);
      await carregar();
      setFeedback({ tipo: 'ok', texto: 'Perfil excluído.' });
    }
  };

  const toggleUsuarioPerfil = (id: number) => {
    setUsuarioPerfis(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (perfilPrincipal === id) setPerfilPrincipal([...next][0] ?? null);
      } else {
        next.add(id);
        if (perfilPrincipal === null) setPerfilPrincipal(id);
      }
      return next;
    });
  };

  const salvarUsuario = async () => {
    if (!usuarioSelecionado || !perfilPrincipal || usuarioPerfis.size === 0 || !can('usuarios.editar')) {
      setFeedback({ tipo: 'erro', texto: 'Selecione ao menos um perfil e defina o principal.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const profile = await atualizarUsuarioSistema(usuarioSelecionado.id, usuarioForm);
    if (profile.error) {
      setFeedback({ tipo: 'erro', texto: profile.error.message });
      setSaving(false);
      return;
    }
    const excecoes = Object.entries(usuarioExcecoes)
      .filter(([, value]) => value !== 'herdar')
      .map(([id, value]) => ({
        permissao_id: Number(id),
        permitido: value === 'permitir',
      }));
    const access = await salvarAcessoUsuario(
      usuarioSelecionado.id,
      [...usuarioPerfis],
      perfilPrincipal,
      excecoes
    );
    if (access.error) {
      setFeedback({ tipo: 'erro', texto: access.error.message });
    } else {
      await carregar();
      if (usuarioSelecionado.id === user?.id) await refreshPermissions();
      setFeedback({ tipo: 'ok', texto: 'Usuário, perfis e exceções salvos com sucesso.' });
    }
    setSaving(false);
  };

  const abrirUnidade = (unidade?: UnidadeOrganizacional) => {
    setUnidadeEditando(unidade ?? null);
    setUnidadeForm({
      nome: unidade?.nome ?? '',
      descricao: unidade?.descricao ?? '',
      parent_id: unidade?.parent_id ? String(unidade.parent_id) : '',
      ativo: unidade?.ativo ?? true,
    });
    setUnidadeModal(true);
  };

  const salvarUnidade = async () => {
    if (!unidadeForm.nome.trim()) return;
    setSaving(true);
    const { error } = await salvarUnidadeOrganizacional({
      nome: unidadeForm.nome.trim(),
      descricao: unidadeForm.descricao.trim() || null,
      parent_id: unidadeForm.parent_id ? Number(unidadeForm.parent_id) : null,
      ativo: unidadeForm.ativo,
    }, unidadeEditando?.id);
    if (error) setFeedback({ tipo: 'erro', texto: error.message });
    else {
      setUnidadeModal(false);
      await carregar();
      setFeedback({ tipo: 'ok', texto: 'Unidade organizacional salva.' });
    }
    setSaving(false);
  };

  const excluirUnidade = async (unidade: UnidadeOrganizacional) => {
    if (!confirm(`Excluir a unidade "${unidade.nome}"?`)) return;
    const { error } = await excluirUnidadeOrganizacional(unidade.id);
    if (error) setFeedback({ tipo: 'erro', texto: 'Remova primeiro as unidades filhas e os membros vinculados.' });
    else {
      await carregar();
      setFeedback({ tipo: 'ok', texto: 'Unidade excluída.' });
    }
  };

  const perfisFiltrados = perfis.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const usuariosFiltrados = usuarios.filter(u =>
    `${u.nome ?? ''} ${u.email} ${u.cargo ?? ''}`.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Carregando Administração...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Administração</h1>
          <p>Gerencie usuários, perfis, permissões e unidades organizacionais.</p>
        </div>
        <span className="admin-security-badge">🔒 Controle de acesso ativo</span>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'perfis' ? 'active' : ''} onClick={() => { setTab('perfis'); setBusca(''); }}>
          🛡️ Perfis e permissões
        </button>
        <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => { setTab('usuarios'); setBusca(''); }}>
          👥 Usuários
        </button>
        <button className={tab === 'unidades' ? 'active' : ''} onClick={() => { setTab('unidades'); setBusca(''); }}>
          🗂️ Unidades organizacionais
        </button>
      </div>

      {feedback && <div className={`admin-feedback ${feedback.tipo}`}>{feedback.texto}</div>}

      {tab === 'perfis' && (
        <div className="admin-split">
          <aside className="admin-list-panel">
            <div className="admin-panel-title">
              <div>
                <strong>Perfis de acesso</strong>
                <span>{perfis.length} perfis cadastrados</span>
              </div>
              {can('perfis.criar') && <button className="admin-icon-btn" onClick={() => setNovoPerfilOpen(true)}>＋</button>}
            </div>
            <input className="admin-search" placeholder="Pesquisar perfil..." value={busca} onChange={e => setBusca(e.target.value)} />
            <div className="admin-list">
              {perfisFiltrados.map(perfil => (
                <button
                  key={perfil.id}
                  className={`admin-list-item ${perfilSelecionado?.id === perfil.id ? 'active' : ''}`}
                  onClick={() => selecionarPerfil(perfil)}
                >
                  <span className="admin-avatar">{perfil.slug === 'admin' ? 'A' : perfil.nome.charAt(0).toUpperCase()}</span>
                  <span>
                    <strong>{perfil.nome}</strong>
                    <small>{perfil.perfil_permissoes?.length ?? 0} permissões</small>
                  </span>
                  {perfil.sistema && <em>Sistema</em>}
                </button>
              ))}
            </div>
          </aside>

          <section className="admin-detail-panel">
            {!perfilSelecionado ? (
              <div className="admin-empty">🛡️<strong>Selecione um perfil</strong><span>Visualize e personalize suas permissões.</span></div>
            ) : (
              <>
                <div className="admin-detail-header">
                  <div>
                    <h2>{perfilSelecionado.sistema ? 'Perfil do sistema' : 'Editar perfil'}</h2>
                    <p>As permissões selecionadas definem o que os usuários deste perfil podem fazer.</p>
                  </div>
                  {!perfilSelecionado.sistema && can('perfis.excluir') && (
                    <button className="btn btn-outline admin-danger" onClick={excluirPerfil}>Excluir perfil</button>
                  )}
                </div>
                <div className="admin-form-row">
                  <label>Nome<input value={perfilForm.nome} disabled={perfilSelecionado.sistema} onChange={e => setPerfilForm({ ...perfilForm, nome: e.target.value })} /></label>
                  <label className="admin-grow">Descrição<input value={perfilForm.descricao} onChange={e => setPerfilForm({ ...perfilForm, descricao: e.target.value })} /></label>
                  <label className="admin-switch-label"><input type="checkbox" checked={perfilForm.ativo} disabled={perfilSelecionado.slug === 'admin'} onChange={e => setPerfilForm({ ...perfilForm, ativo: e.target.checked })} /> Ativo</label>
                </div>
                {perfilSelecionado.slug === 'admin' && (
                  <div className="admin-info">O perfil Administrador possui acesso total permanente para evitar bloqueio do sistema.</div>
                )}
                <div className="permission-groups">
                  {Object.entries(permissoesPorModulo).map(([modulo, items]) => {
                    const checked = items.every(item => perfilSelecionado.slug === 'admin' || perfilPermissoes.has(item.id));
                    return (
                      <div className="permission-group" key={modulo}>
                        <div className="permission-group-header">
                          <label>
                            <input type="checkbox" checked={checked} disabled={perfilSelecionado.slug === 'admin'} onChange={() => toggleModulo(items)} />
                            <strong>{modulo}</strong>
                          </label>
                          <span>{items.filter(item => perfilSelecionado.slug === 'admin' || perfilPermissoes.has(item.id)).length}/{items.length}</span>
                        </div>
                        <div className="permission-items">
                          {items.map(item => (
                            <label key={item.id}>
                              <input
                                type="checkbox"
                                checked={perfilSelecionado.slug === 'admin' || perfilPermissoes.has(item.id)}
                                disabled={perfilSelecionado.slug === 'admin'}
                                onChange={() => togglePerfilPermissao(item.id)}
                              />
                              <span><strong>{item.acao}</strong><small>{item.nome}</small></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="admin-actions">
                  <span>{perfilPermissoes.size} permissões selecionadas</span>
                  <button className="btn btn-green" disabled={saving || !can('perfis.editar')} onClick={salvarPerfil}>
                    {saving ? 'Salvando...' : 'Salvar perfil'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="admin-split">
          <aside className="admin-list-panel">
            <div className="admin-panel-title">
              <div><strong>Usuários</strong><span>{usuarios.length} usuários cadastrados</span></div>
            </div>
            <input className="admin-search" placeholder="Pesquisar usuário..." value={busca} onChange={e => setBusca(e.target.value)} />
            <div className="admin-list">
              {usuariosFiltrados.map(usuario => (
                <button
                  key={usuario.id}
                  className={`admin-list-item ${usuarioSelecionado?.id === usuario.id ? 'active' : ''}`}
                  onClick={() => selecionarUsuario(usuario)}
                >
                  <span className="admin-avatar">{(usuario.nome || usuario.email).charAt(0).toUpperCase()}</span>
                  <span><strong>{usuario.nome || usuario.email.split('@')[0]}</strong><small>{usuario.email}</small></span>
                  <i className={usuario.ativo ? 'online' : 'offline'} />
                </button>
              ))}
            </div>
          </aside>
          <section className="admin-detail-panel">
            {!usuarioSelecionado ? (
              <div className="admin-empty">👥<strong>Selecione um usuário</strong><span>Defina perfis e exceções individuais.</span></div>
            ) : (
              <>
                <div className="admin-detail-header">
                  <div><h2>{usuarioSelecionado.nome || usuarioSelecionado.email}</h2><p>{usuarioSelecionado.email}</p></div>
                </div>
                <div className="admin-form-row">
                  <label>Nome<input value={usuarioForm.nome} onChange={e => setUsuarioForm({ ...usuarioForm, nome: e.target.value })} /></label>
                  <label>Cargo<input value={usuarioForm.cargo} onChange={e => setUsuarioForm({ ...usuarioForm, cargo: e.target.value })} /></label>
                  <label className="admin-switch-label"><input type="checkbox" checked={usuarioForm.ativo} disabled={usuarioSelecionado.id === user?.id} onChange={e => setUsuarioForm({ ...usuarioForm, ativo: e.target.checked })} /> Usuário ativo</label>
                </div>
                <h3 className="admin-section-title">Perfis atribuídos</h3>
                <div className="profile-selector">
                  {perfis.filter(p => p.ativo).map(perfil => (
                    <div className={`profile-option ${usuarioPerfis.has(perfil.id) ? 'selected' : ''}`} key={perfil.id}>
                      <label>
                        <input type="checkbox" checked={usuarioPerfis.has(perfil.id)} onChange={() => toggleUsuarioPerfil(perfil.id)} />
                        <span><strong>{perfil.nome}</strong><small>{perfil.descricao}</small></span>
                      </label>
                      {usuarioPerfis.has(perfil.id) && (
                        <label className="primary-radio">
                          <input type="radio" name="principal" checked={perfilPrincipal === perfil.id} onChange={() => setPerfilPrincipal(perfil.id)} />
                          Principal
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <h3 className="admin-section-title">Exceções individuais</h3>
                <p className="admin-section-help">Uma exceção substitui o resultado dos perfis somente para este usuário.</p>
                <div className="user-overrides">
                  {Object.entries(permissoesPorModulo).map(([modulo, items]) => (
                    <div className="override-module" key={modulo}>
                      <strong>{modulo}</strong>
                      {items.map(item => (
                        <label key={item.id}>
                          <span>{item.acao}</span>
                          <select
                            value={usuarioExcecoes[item.id] ?? 'herdar'}
                            onChange={e => setUsuarioExcecoes({ ...usuarioExcecoes, [item.id]: e.target.value as OverrideValue })}
                          >
                            <option value="herdar">Herdar do perfil</option>
                            <option value="permitir">Permitir</option>
                            <option value="negar">Negar</option>
                          </select>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="admin-actions">
                  <span>{Object.values(usuarioExcecoes).filter(v => v !== 'herdar').length} exceções definidas</span>
                  <button className="btn btn-green" disabled={saving || !can('usuarios.editar')} onClick={salvarUsuario}>
                    {saving ? 'Salvando...' : 'Salvar acesso do usuário'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'unidades' && (
        <div className="admin-units-panel">
          <div className="admin-detail-header">
            <div><h2>Árvore organizacional</h2><p>Organize usuários e equipes em uma hierarquia.</p></div>
            {can('unidades.criar') && <button className="btn btn-green" onClick={() => abrirUnidade()}>＋ Adicionar unidade</button>}
          </div>
          {unidades.length === 0 ? (
            <div className="admin-empty">🗂️<strong>Nenhuma unidade cadastrada</strong><span>Crie a primeira unidade raiz.</span></div>
          ) : (
            <div className="unit-tree">
              {unidades.map(unidade => {
                const parent = unidades.find(item => item.id === unidade.parent_id);
                return (
                  <div className="unit-card" key={unidade.id} style={{ marginLeft: unidade.parent_id ? 32 : 0 }}>
                    <span className="unit-icon">🏢</span>
                    <span><strong>{unidade.nome}</strong><small>{parent ? `Vinculada a ${parent.nome}` : 'Unidade raiz'} · {unidade.descricao || 'Sem descrição'}</small></span>
                    <em className={unidade.ativo ? 'active' : 'inactive'}>{unidade.ativo ? 'Ativa' : 'Inativa'}</em>
                    {can('unidades.editar') && <button onClick={() => abrirUnidade(unidade)}>Editar</button>}
                    {can('unidades.excluir') && <button className="danger" onClick={() => excluirUnidade(unidade)}>Excluir</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {novoPerfilOpen && (
        <div className="modal-overlay" onClick={() => setNovoPerfilOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Criar perfil de acesso</span><button className="modal-close" onClick={() => setNovoPerfilOpen(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome *</label><input className="form-control" value={novoPerfil.nome} onChange={e => setNovoPerfil({ ...novoPerfil, nome: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" rows={3} value={novoPerfil.descricao} onChange={e => setNovoPerfil({ ...novoPerfil, descricao: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setNovoPerfilOpen(false)}>Cancelar</button><button className="btn btn-green" disabled={saving} onClick={criarPerfil}>Criar perfil</button></div>
          </div>
        </div>
      )}

      {unidadeModal && (
        <div className="modal-overlay" onClick={() => setUnidadeModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">{unidadeEditando ? 'Editar unidade' : 'Nova unidade organizacional'}</span><button className="modal-close" onClick={() => setUnidadeModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome *</label><input className="form-control" value={unidadeForm.nome} onChange={e => setUnidadeForm({ ...unidadeForm, nome: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Unidade superior</label><select className="form-control" value={unidadeForm.parent_id} onChange={e => setUnidadeForm({ ...unidadeForm, parent_id: e.target.value })}><option value="">Unidade raiz</option>{unidades.filter(item => item.id !== unidadeEditando?.id).map(item => <option value={item.id} key={item.id}>{item.nome}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" rows={3} value={unidadeForm.descricao} onChange={e => setUnidadeForm({ ...unidadeForm, descricao: e.target.value })} /></div>
              <label className="admin-switch-label"><input type="checkbox" checked={unidadeForm.ativo} onChange={e => setUnidadeForm({ ...unidadeForm, ativo: e.target.checked })} /> Unidade ativa</label>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setUnidadeModal(false)}>Cancelar</button><button className="btn btn-green" disabled={saving} onClick={salvarUnidade}>Salvar unidade</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

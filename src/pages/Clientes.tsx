import { useEffect, useState, useRef } from 'react';
import { listarClientes, criarCliente, atualizarCliente, deletarCliente } from '../lib/db';
import type { Cliente } from '../lib/types';

const ITEMS_PER_PAGE = 10;

function getStatusBadge(idx: number) {
  const statuses = [
    { label: 'Contato atrasado', cls: 'badge-atrasado' },
    { label: 'Contato próximo', cls: 'badge-proximo' },
    { label: 'Oportunidade', cls: 'badge-oportunidade' },
  ];
  return statuses[idx % statuses.length];
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', endereco: '' });
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [abaTela, setAbaTela] = useState<'clientes' | 'prospects'>('clientes');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const carregar = async () => setClientes(await listarClientes());
  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: '', telefone: '', email: '', endereco: '' });
    setModalOpen(true);
  };

  const abrirEditar = (c: Cliente) => {
    setEditando(c);
    setForm({ nome: c.nome, telefone: c.telefone ?? '', email: c.email ?? '', endereco: c.endereco ?? '' });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const salvar = async () => {
    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
    };
    if (editando) await atualizarCliente(editando.id, payload);
    else await criarCliente(payload);
    setModalOpen(false);
    carregar();
  };

  const deletar = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deletarCliente(id);
      setDropdownOpen(null);
      carregar();
    }
  };

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? '').includes(busca)
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const paginados = filtrados.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

  const paginaBtns = () => {
    const btns = [];
    for (let i = 1; i <= Math.min(totalPaginas, 5); i++) btns.push(i);
    return btns;
  };

  return (
    <div>
      {/* Page title row */}
      <div className="page-title-row">
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clientes &nbsp;·&nbsp; Informações sobre clientes</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            Operações no Excel
          </button>
          <button className="btn btn-green" onClick={abrirNovo}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Criar novo cliente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button className={`page-tab${abaTela === 'clientes' ? ' active' : ''}`} onClick={() => setAbaTela('clientes')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          Clientes
        </button>
        <button className={`page-tab${abaTela === 'prospects' ? ' active' : ''}`} onClick={() => setAbaTela('prospects')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Prospects
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar-row">
        <div className="search-bar" style={{ width: 280 }}>
          <input
            placeholder="Pesquisar..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1); }}
          />
          <button type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
        <div className="ml-auto" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtros
          </button>
          <button className="btn btn-outline btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Ações</th>
              <th>Status</th>
              <th>Nome <span className="sort-icon">↕</span></th>
              <th>CPF / CNPJ <span className="sort-icon">↕</span></th>
              <th>Telefone <span className="sort-icon">↕</span></th>
              <th>Tipo de Cliente</th>
              <th>Responsável <span className="sort-icon">↕</span></th>
              <th>Cidade</th>
              <th>Última Compra <span className="sort-icon">↕</span></th>
              <th>Último orçamento <span className="sort-icon">↕</span></th>
              <th>Última atividade <span className="sort-icon">↕</span></th>
              <th>Código</th>
              <th>Está ativo <span className="sort-icon">↕</span></th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((c, idx) => {
              const status = getStatusBadge(idx);
              const isOpen = dropdownOpen === c.id;
              return (
                <tr key={c.id}>
                  <td>
                    <div className="dropdown-wrapper" ref={isOpen ? dropdownRef : null}>
                      <button className="acoes-btn" onClick={() => setDropdownOpen(isOpen ? null : c.id)}>
                        Ações
                        <svg width="10" height="10" viewBox="0 0 10 6" fill="none">
                          <path d="M0 0l5 6 5-6z" fill="white"/>
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => abrirEditar(c)}>Editar</button>
                          <button className="dropdown-item danger" onClick={() => deletar(c.id)}>Excluir</button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>
                      {c.nome}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.nome}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.email ?? '---'}</td>
                  <td style={{ fontSize: 11 }}>{c.telefone ?? '---'}</td>
                  <td>
                    <span className={`badge ${idx % 2 === 0 ? 'badge-proximo' : 'badge-oportunidade'}`}>
                      {idx % 2 === 0 ? 'Revendedor' : 'Solidário'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>Responsável</td>
                  <td style={{ fontSize: 11 }}>{c.endereco ?? '---'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>18/07/2026</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>19/07/2026</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>22/04/2026</td>
                  <td style={{ fontSize: 11, fontWeight: 600 }}>{String(c.id).padStart(8, '0')}</td>
                  <td>
                    <span className="status-dot green" title="Ativo" />
                  </td>
                </tr>
              );
            })}
            {paginados.length === 0 && (
              <tr>
                <td colSpan={13}>
                  <div className="empty-state">Nenhum cliente encontrado.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span>Total de registros: {filtrados.length}</span>
          <span style={{ flex: 1 }} />
          <button
            className="page-btn"
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
          >‹</button>
          {paginaBtns().map(n => (
            <button
              key={n}
              className={`page-btn${pagina === n ? ' active' : ''}`}
              onClick={() => setPagina(n)}
            >{n}</button>
          ))}
          {totalPaginas > 5 && <span style={{ padding: '0 4px' }}>...</span>}
          {totalPaginas > 5 && (
            <button
              className={`page-btn${pagina === totalPaginas ? ' active' : ''}`}
              onClick={() => setPagina(totalPaginas)}
            >{totalPaginas}</button>
          )}
          <button
            className="page-btn"
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
          >›</button>
          <select
            className="form-control"
            style={{ width: 56, height: 26, fontSize: 11, padding: '0 4px' }}
            value={ITEMS_PER_PAGE}
            onChange={() => {}}
          >
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
      </div>

      {/* Modal criar/editar */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editando ? 'Editar Cliente' : 'Novo Cliente'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" placeholder="Nome completo" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-control" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input className="form-control" placeholder="Cidade - UF" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-green" onClick={salvar}>{editando ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;

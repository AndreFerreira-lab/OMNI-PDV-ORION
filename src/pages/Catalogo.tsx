import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto, listarCategorias, criarCategoria } from '../lib/db';
import { listarClientes } from '../lib/db';

const GRUPOS = [
  { label: 'ABRASADORA EM PARTIDA', count: 119 },
  { label: 'ABRASADORA PARA MANGOTE', count: 10 },
  { label: 'ABRASADORA PARA TUBO', count: 1165 },
  { label: 'ADAPTADORES', count: 167 },
  { label: 'ADAPTADORES ESPECIAIS', count: 8 },
  { label: 'ADPT 3/8 65 X UNF JIC 37', count: 848 },
  { label: 'ADPT 3/8 ED X 3/8 ED', count: 741 },
  { label: 'ADPT 3/8 ED X N/FP 93', count: 58 },
  { label: 'ADPT 3/8 ED X UNF JC 37', count: 913 },
  { label: 'ADPT DESENHOS ESPECIAIS', count: 177 },
  { label: 'ADPT DIN - ANILHA DE ASO', count: 591 },
  { label: 'ADPT DIN - CALOTA', count: 5 },
];

function Catalogo() {
  const { can } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [estoqueFilter, setEstoqueFilter] = useState<'todos' | 'disponivel' | 'indisponivel'>('todos');
  const [precoMax, setPrecoMax] = useState(0);
  const [catFilter, setCatFilter] = useState<number[]>([]);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalProdOpen, setModalProdOpen] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', estoque: '', categoria_id: '', imagem_url: '' });
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);
  const ITEMS_PER_PAGE = 10;

  const carregar = async () => {
    setProdutos(await listarProdutos());
    setCategorias(await listarCategorias());
    setClientes(await listarClientes());
  };

  useEffect(() => { carregar(); }, []);

  const produtosFiltrados = produtos.filter(p => {
    if (estoqueFilter === 'disponivel' && p.estoque <= 0) return false;
    if (estoqueFilter === 'indisponivel' && p.estoque > 0) return false;
    if (precoMax > 0 && Number(p.preco) > precoMax) return false;
    if (catFilter.length > 0 && !catFilter.includes(p.categoria_id)) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );
  const totalPaginasClientes = Math.max(1, Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE));
  const clientesPaginados = clientesFiltrados.slice(
    (paginaClientes - 1) * ITEMS_PER_PAGE,
    paginaClientes * ITEMS_PER_PAGE
  );

  const abrirEditar = (p: any) => {
    setEditando(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco: String(p.preco),
      estoque: String(p.estoque),
      categoria_id: p.categoria_id ? String(p.categoria_id) : '',
      imagem_url: p.imagem_url ?? '',
    });
    setModalProdOpen(true);
  };

  const salvar = async () => {
    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      preco: parseFloat(form.preco),
      estoque: parseInt(form.estoque) || 0,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      imagem_url: form.imagem_url || null,
    };
    if (editando) await atualizarProduto(editando.id, payload);
    else await criarProduto(payload);
    setModalProdOpen(false);
    carregar();
  };

  const deletar = async (id: number) => {
    if (confirm('Excluir este produto?')) { await deletarProduto(id); carregar(); }
  };

  const toggleCat = (id: number) => {
    setCatFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
        Catálogo &nbsp;·&nbsp; Pedido &nbsp;·&nbsp; Criar novo pedido
      </div>

      <div className="catalogo-layout">
        {/* ---- SIDEBAR FILTROS ---- */}
        <aside className="catalogo-sidebar">
          {/* Cliente selecionado */}
          {clienteSelecionado ? (
            <div className="card" style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Cliente:</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{clienteSelecionado.nome}</div>
              <button
                className="btn btn-outline btn-xs"
                style={{ marginTop: 4, width: '100%' }}
                onClick={() => setModalClienteOpen(true)}
              >Trocar</button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: '#f9ca24', color: '#333' }}
              onClick={() => setModalClienteOpen(true)}
            >
              ⚠ Selecione um cliente
            </button>
          )}

          {/* Search */}
          <div className="search-bar" style={{ marginTop: 4 }}>
            <input placeholder="Buscar por nome, código..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          {/* Estoque */}
          <div className="card" style={{ padding: '10px 12px' }}>
            <div className="catalogo-filter-title">Estoque</div>
            <div className="stock-tabs" style={{ flexWrap: 'wrap' }}>
              {(['todos', 'disponivel', 'indisponivel'] as const).map(opt => (
                <button
                  key={opt}
                  className={`stock-tab${estoqueFilter === opt ? ' active' : ''}`}
                  onClick={() => setEstoqueFilter(opt)}
                >
                  {opt === 'todos' ? 'Todos' : opt === 'disponivel' ? 'Disponível' : 'Indisponível'}
                </button>
              ))}
            </div>
          </div>

          {/* Preço Máx */}
          <div className="card" style={{ padding: '10px 12px' }}>
            <div className="catalogo-filter-title">Preço Máx.</div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
              R$ {precoMax === 0 ? '0,00' : precoMax.toFixed(2)}
            </div>
            <input
              type="range"
              className="price-slider"
              min={0} max={10000} step={10}
              value={precoMax}
              onChange={e => setPrecoMax(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Categorias */}
          {categorias.length > 0 && (
            <div className="card" style={{ padding: '10px 12px' }}>
              <div className="catalogo-filter-title">Categorias</div>
              {categorias.slice(0, 5).map(cat => (
                <label key={cat.id} className="catalogo-filter-group-item">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={catFilter.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                  />
                  <span style={{ fontSize: 11 }}>{cat.nome}</span>
                </label>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setEstoqueFilter('todos'); setPrecoMax(0); setCatFilter([]); setBusca(''); }}>
              Limpar
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar
            </button>
          </div>
        </aside>

        {/* ---- MAIN CATÁLOGO ---- */}
        <div className="catalogo-main" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-outline btn-sm btn-icon" title="Grade">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button className="btn btn-outline btn-sm btn-icon" title="Lista">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={async () => {
                const nome = prompt('Nome da nova categoria:');
                if (nome) { await criarCategoria(nome); carregar(); }
              }}>
                + Nova Categoria
              </button>
              {can('catalogo.criar') && <button className="btn btn-green btn-sm" onClick={() => { setEditando(null); setForm({ nome: '', descricao: '', preco: '', estoque: '', categoria_id: '', imagem_url: '' }); setModalProdOpen(true); }}>
                + Novo Produto
              </button>}
            </div>
          </div>

          {/* Tabela responsiva com overflow */}
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 60 }}>Cód. <span className="sort-icon">↕</span></th>
                  <th style={{ minWidth: 180 }}>Produto <span className="sort-icon">↕</span></th>
                  <th style={{ minWidth: 60 }}>Categoria</th>
                  <th style={{ minWidth: 70 }}>Preço <span className="sort-icon">↕</span></th>
                  <th style={{ minWidth: 70 }}>Estoque <span className="sort-icon">↕</span></th>
                  <th style={{ minWidth: 80 }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(p.id).padStart(5, '0')}</td>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{p.nome}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.categorias?.nome ?? '—'}</td>
                    <td style={{ fontSize: 11 }}>R$ {Number(p.preco).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.estoque > 0 ? 'badge-green' : 'badge-atrasado'}`}>
                        {p.estoque}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {can('catalogo.editar') && <button className="btn btn-outline btn-xs" onClick={() => abrirEditar(p)}>✏</button>}
                        {can('catalogo.excluir') && <button className="btn btn-xs" style={{ background: '#fdecea', color: 'var(--red)', border: 'none' }} onClick={() => deletar(p.id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {produtosFiltrados.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state">Nenhum produto encontrado.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================== MODAL SELEÇÃO DE CLIENTE ===================== */}
      {modalClienteOpen && (
        <div className="modal-overlay" onClick={() => setModalClienteOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Selecione um cliente para visualização dos preços</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="topbar-icon-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                </button>
                <button className="modal-close" onClick={() => setModalClienteOpen(false)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              {/* Search */}
              <div className="search-bar" style={{ marginBottom: 12 }}>
                <input
                  placeholder="Pesquisar..."
                  value={buscaCliente}
                  onChange={e => { setBuscaCliente(e.target.value); setPaginaClientes(1); }}
                />
                <button type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Selecionar</th>
                    <th>CPF / CNPJ <span className="sort-icon">↕</span></th>
                    <th>Nome <span className="sort-icon">↕</span></th>
                    <th>Telefone <span className="sort-icon">↕</span></th>
                    <th>Código <span className="sort-icon">↕</span></th>
                    <th>Está ativo <span className="sort-icon">↕</span></th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPaginados.map(c => (
                    <tr key={c.id}>
                      <td>
                        <button className="select-btn" onClick={() => { setClienteSelecionado(c); setModalClienteOpen(false); }}>
                          Selecionar
                        </button>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email ?? '---'}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{c.nome}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.endereco ?? ''}</div>
                      </td>
                      <td style={{ fontSize: 11 }}>{c.telefone ?? '---'}</td>
                      <td style={{ fontSize: 11, fontWeight: 600 }}>{String(c.id).padStart(8, '0')}</td>
                      <td><span className="status-dot green" /></td>
                    </tr>
                  ))}
                  {clientesPaginados.length === 0 && (
                    <tr><td colSpan={6}><div className="empty-state">Nenhum cliente encontrado.</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ padding: '10px 18px' }}>
              <span>Total de registros: {clientesFiltrados.length}</span>
              <span style={{ flex: 1 }} />
              <button className="page-btn" onClick={() => setPaginaClientes(Math.max(1, paginaClientes - 1))}>‹</button>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`page-btn${paginaClientes === n ? ' active' : ''}`} onClick={() => setPaginaClientes(n)}>
                  {n}
                </button>
              ))}
              <span style={{ padding: '0 4px' }}>››</span>
              <select className="form-control" style={{ width: 56, height: 26, fontSize: 11, padding: '0 4px' }}>
                <option>10</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL PRODUTO ===================== */}
      {modalProdOpen && (
        <div className="modal-overlay" onClick={() => setModalProdOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editando ? 'Editar Produto' : 'Novo Produto'}</span>
              <button className="modal-close" onClick={() => setModalProdOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nome *</label>
                  <input className="form-control" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Descrição</label>
                  <input className="form-control" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Preço</label>
                  <input className="form-control" type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estoque</label>
                  <input className="form-control" type="number" value={form.estoque} onChange={e => setForm({ ...form, estoque: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Categoria</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="form-control" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                      <option value="">Sem categoria</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <button className="btn btn-outline btn-sm" onClick={async () => {
                      const nome = prompt('Nome da nova categoria:');
                      if (nome) { await criarCategoria(nome); carregar(); }
                    }}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalProdOpen(false)}>Cancelar</button>
              <button className="btn btn-green" onClick={salvar}>{editando ? 'Atualizar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogo;

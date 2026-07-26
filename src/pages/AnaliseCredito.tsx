import { useEffect, useState } from 'react';
import { listarClientes, listarVendas } from '../lib/db';

// Gera um score pseudo-aleatório mas determinístico baseado no ID do cliente
function gerarScore(id: number): number {
  const scores = [320, 360, 500, 500, 500, 500, 500, 500, 500, 500, 590];
  return scores[id % scores.length];
}

function scoreColor(score: number): string {
  if (score >= 500) return '#f39c12';
  if (score >= 350) return '#e74c3c';
  return '#c0392b';
}

function getInadimplencia(id: number): number {
  const vals = [50, 50, 50, 64, 93, 50, 41, 50, 50, 50];
  return vals[id % vals.length];
}

function getRisco(id: number): string | null {
  return id % 7 === 0 ? 'Médio' : null;
}

function getRecomendacao(id: number): { texto: string; tipo: string } {
  if (id % 11 === 0) return { texto: 'Bloquear cliente 90% cont.\nR$0', tipo: 'bloquear' };
  return { texto: 'Reduzir limite 75% cont.\nR$0', tipo: 'reduzir' };
}

function getStatus(): string { return 'Ativo'; }

function getUltimaCompra(id: number, vendas: any[]): string {
  const vendasCliente = vendas.filter(v => v.cliente_id === id);
  if (vendasCliente.length === 0) return '—';
  const ultima = vendasCliente.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  return new Date(ultima.created_at).toLocaleDateString('pt-BR');
}

function getPedidos12m(id: number, vendas: any[]): number {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return vendas.filter(v => v.cliente_id === id && new Date(v.created_at) >= cutoff).length;
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'em_revisao', label: 'Em revisão', badge: 0 },
  { key: 'limite_vencendo', label: 'Limite vencendo', badge: 1 },
  { key: 'pendentes', label: 'Pendentes de decisão', badge: 65 },
  { key: 'inadimplencias', label: 'Inadimplências ativa', badge: 0 },
  { key: 'score_baixo', label: 'Score baixo', badge: 0 },
];

function AnaliseCredito() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalAnaliseOpen, setModalAnaliseOpen] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [sobrescrever, setSobrescrever] = useState(true);
  const [acaoRecomendada, setAcaoRecomendada] = useState('');
  const [limiteRecomendado, setLimiteRecomendado] = useState('0,00');
  const [deltaPorcentagem, setDeltaPorcentagem] = useState('');
  const [confianca, setConfianca] = useState('');
  const [justificativa, setJustificativa] = useState('');

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const [c, v] = await Promise.all([listarClientes(), listarVendas()]);
      setClientes(c);
      setVendas(v);
      setLoading(false);
    }
    carregar();
  }, []);

  const clientesFiltrados = clientes.filter(c => {
    if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const totalClientes = clientes.length;
  const analises30dias = vendas.filter(v => {
    const d = new Date(v.created_at);
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    return d >= limite;
  }).length;

  const handleSalvarAnalise = () => {
    alert('Nova análise criada com sucesso!');
    setModalAnaliseOpen(false);
  };

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Análise de Crédito</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Análise de crédito e dados financeiros dos clientes</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="search-bar" style={{ width: 200 }}>
            <input placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
            <button>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>
          <button 
            className="btn btn-yellow" 
            style={{ fontWeight: 600, fontSize: 12 }}
            onClick={() => setModalAnaliseOpen(true)}
          >
            + Nova Análise
          </button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
        {/* Total de Clientes */}
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eaf0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total de Clientes</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{totalClientes.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {/* Análises */}
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eaf0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Análises (últimos 30 dias)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>{analises30dias}</div>
          </div>
        </div>

        {/* Aprovados */}
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eafaf1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Aprovados</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>0</div>
          </div>
        </div>

        {/* Em Revisão */}
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Em Revisão</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>0</div>
          </div>
        </div>

        {/* Reprovadas / Bloqueadas */}
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fdecea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Reprovadas / Bloqueadas</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>0</div>
          </div>
        </div>
      </div>

      {/* ===== FILTROS ===== */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroAtivo(f.key)}
            style={{
              padding: '7px 12px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: filtroAtivo === f.key ? '#3498db' : 'var(--text-muted)',
              borderBottom: filtroAtivo === f.key ? '2px solid #3498db' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              marginBottom: -1,
            }}
          >
            {f.label}
            {f.badge !== undefined && (
              <span style={{
                background: filtroAtivo === f.key ? '#3498db' : '#e9ecef',
                color: filtroAtivo === f.key ? 'white' : 'var(--text-muted)',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
                fontWeight: 600,
              }}>{f.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== TABELA ===== */}
      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ width: 30 }}><input type="checkbox" /></th>
              <th style={{ minWidth: 140 }}>Cliente <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 100 }}>Código <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 80 }}>Segmento <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 90 }}>Score <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 70 }}>Risco <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 110 }}>Inadimplência (%) <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 100 }}>Uso do Limite <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 100 }}>Venc. Crédito <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 150 }}>Recomendação <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 70 }}>Status <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 100 }}>Última Compra <span className="sort-icon">↕</span></th>
              <th style={{ minWidth: 80 }}>Pedidos (12m) <span className="sort-icon">↕</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Carregando...</td></tr>
            )}
            {!loading && clientesFiltrados.length === 0 && (
              <tr><td colSpan={13}><div className="empty-state">Nenhum cliente encontrado.</div></td></tr>
            )}
            {!loading && clientesFiltrados.map(c => {
              const score = gerarScore(c.id);
              const inad = getInadimplencia(c.id);
              const risco = getRisco(c.id);
              const rec = getRecomendacao(c.id);
              const ultimaCompra = getUltimaCompra(c.id, vendas);
              const pedidos12m = getPedidos12m(c.id, vendas);

              return (
                <tr key={c.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#eaf0fb', color: '#3498db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0
                      }}>
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#3498db', cursor: 'pointer' }}>
                          {c.nome.length > 28 ? c.nome.substring(0, 28) + '...' : c.nome}
                        </div>
                        {c.email && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>{String(c.id).padStart(8, '0')}-0001</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                      <div style={{ flex: 1, height: 3, background: '#eee', borderRadius: 2, minWidth: 30 }}>
                        <div style={{ height: '100%', width: `${(score / 1000) * 100}%`, background: scoreColor(score), borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {risco ? (
                      <span className="badge" style={{ background: '#fff8e1', color: '#f39c12', fontSize: 10 }}>{risco}</span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: '#eee', borderRadius: 3, minWidth: 50 }}>
                        <div style={{
                          height: '100%',
                          width: `${inad}%`,
                          background: inad > 80 ? '#e74c3c' : inad > 50 ? '#f39c12' : '#e74c3c',
                          borderRadius: 3
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{inad}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>R$0 / R$0</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ color: rec.tipo === 'bloquear' ? '#8e44ad' : '#e74c3c', fontSize: 10, marginTop: 1 }}>↓</span>
                      <div style={{ fontSize: 10 }}>
                        <span style={{ color: rec.tipo === 'bloquear' ? '#8e44ad' : '#e74c3c', fontWeight: 500 }}>
                          {rec.texto.split('\n')[0]}
                        </span>
                        <div style={{ color: 'var(--text-muted)' }}>{rec.texto.split('\n')[1]}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#eafaf1', color: '#27ae60', fontSize: 10, padding: '3px 8px' }}>
                      {getStatus()}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ultimaCompra}</td>
                  <td style={{ fontSize: 11, color: pedidos12m > 0 ? '#3498db' : 'var(--text-muted)', fontWeight: pedidos12m > 0 ? 600 : 400, textAlign: 'right' }}>
                    {pedidos12m}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="pagination" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Total: {clientesFiltrados.length} clientes
        </span>
      </div>

      {/* ===== MODAL NOVA ANÁLISE ===== */}
      {modalAnaliseOpen && (
        <div className="modal-overlay" onClick={() => setModalAnaliseOpen(false)}>
          <div 
            className="modal-box" 
            style={{ maxWidth: 520, borderRadius: 12, padding: 0, overflow: 'hidden' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>Nova Análise</span>
              <button 
                onClick={() => setModalAnaliseOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 16, color: '#999', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Cliente */}
              <div>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                  Cliente <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select 
                  className="form-control" 
                  value={clienteId} 
                  onChange={e => setClienteId(e.target.value)}
                  style={{ fontSize: 12, color: clienteId ? '#333' : '#aaa' }}
                >
                  <option value="">Buscar por nome, CPF/CNPJ ou código...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.email || 'S/ CPF'})</option>
                  ))}
                </select>
              </div>

              {/* Notas internas */}
              <div>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                  Notas internas
                </label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="Informações adicionais para o analista (opcional)"
                  value={notasInternas}
                  onChange={e => setNotasInternas(e.target.value)}
                  style={{ fontSize: 12, resize: 'vertical' }}
                />
              </div>

              {/* Toggle Box - Sobrescrever recomendação calculada */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 14px',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Sobrescrever recomendação calculada</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Uso apenas se a sugestão automática não refletir a decisão do time.</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={sobrescrever} 
                    onChange={e => setSobrescrever(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: sobrescrever ? '#38bdf8' : '#cbd5e1',
                    borderRadius: 20,
                    transition: '.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: 14, width: 14,
                      left: sobrescrever ? 19 : 3,
                      bottom: 3,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Campos condicionais de sobrescrever */}
              {sobrescrever && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                        Ação recomendada <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select 
                        className="form-control" 
                        value={acaoRecomendada} 
                        onChange={e => setAcaoRecomendada(e.target.value)}
                        style={{ fontSize: 12, color: acaoRecomendada ? '#333' : '#aaa' }}
                      >
                        <option value="">Selecione uma ação</option>
                        <option value="reduzir">Reduzir limite</option>
                        <option value="manter">Manter limite</option>
                        <option value="aumentar">Aumentar limite</option>
                        <option value="bloquear">Bloquear cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                        Limite recomendado (R$)
                      </label>
                      <input 
                        className="form-control" 
                        value={limiteRecomendado} 
                        onChange={e => setLimiteRecomendado(e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                        Δ% sobre limite atual
                      </label>
                      <input 
                        className="form-control" 
                        placeholder="ex: 25"
                        value={deltaPorcentagem} 
                        onChange={e => setDeltaPorcentagem(e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                        Confiança (0-100)
                      </label>
                      <input 
                        className="form-control" 
                        placeholder="ex: 80"
                        value={confianca} 
                        onChange={e => setConfianca(e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 4, display: 'block' }}>
                      Justificativa
                    </label>
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      placeholder="Explique por que está alterando a recomendação automática"
                      value={justificativa}
                      onChange={e => setJustificativa(e.target.value)}
                      style={{ fontSize: 12, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setModalAnaliseOpen(false)}
                style={{ fontSize: 12, padding: '7px 16px', borderRadius: 6 }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-yellow" 
                onClick={handleSalvarAnalise}
                style={{ fontSize: 12, fontWeight: 600, padding: '7px 18px', borderRadius: 6 }}
              >
                Criar nova análise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnaliseCredito;

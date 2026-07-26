import { useEffect, useState } from 'react';
import { listarProdutos, listarClientes, criarVenda, listarVendas, deletarVenda, atualizarVenda } from '../lib/db';
import type { Produto, Cliente } from '../lib/types';

interface ItemPedido {
  produto: Produto;
  quantidade: number;
  preco: number;
  desconto: number;
}

const today = new Date().toLocaleDateString('pt-BR');

function Vendas() {
  const [aba, setAba] = useState<'novo' | 'historico'>('historico');
  const [dropdownAbertoId, setDropdownAbertoId] = useState<number | null>(null);
  
  // Controle de edição/visualização
  const [vendaEditandoId, setVendaEditandoId] = useState<number | null>(null);
  const [isVisualizando, setIsVisualizando] = useState(false);
  const [itensAntigos, setItensAntigos] = useState<any[]>([]);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemPedido[]>([]);

  // Form fields
  const [clienteId, setClienteId] = useState('');
  const [contato, setContato] = useState('');
  const [tipoTransacao, setTipoTransacao] = useState('Venda');
  const [condicaoPagamento, setCondicaoPagamento] = useState('');
  const [responsavel, setResponsavel] = useState('00002 MARIA BEATRIZ DAMÃO DE QUEVORA');
  const [frete, setFrete] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [dataEntrega, setDataEntrega] = useState(today);
  const [freteValor, setFreteValor] = useState('0.00');
  const [transpRodospacho, setTranspRodospacho] = useState('');
  const [modo, setModo] = useState('');
  const [transpColeta, setTranspColeta] = useState('');
  const [obsInterna, setObsInterna] = useState('');
  const [ordemCompra, setOrdemCompra] = useState('');
  const [clienteRemessa, setClienteRemessa] = useState('');
  const [lojaRemessa, setLojaRemessa] = useState('');
  const [nrPedSep, setNrPedSep] = useState('');
  const [nfSeparac, setNfSeparac] = useState('');
  const [filiOrigem, setFiliOrigem] = useState('');
  const [dtafSeparacao, setDtafSeparacao] = useState('');
  const [filiSeparac, setFiliSeparac] = useState('');
  const [pedOrigem, setPedOrigem] = useState('');
  const [msgNota, setMsgNota] = useState('');
  const [msgOrcamento, setMsgOrcamento] = useState('');
  const [negocio, setNegocio] = useState('');

  const carregar = async () => {
    setProdutos(await listarProdutos());
    setClientes(await listarClientes());
    setVendas(await listarVendas());
  };
  useEffect(() => { carregar(); }, []);

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);
  const totalGeral = itens.reduce((acc, i) => acc + (i.preco * i.quantidade * (1 - i.desconto / 100)), 0);
  const totalDescontos = itens.reduce((acc, i) => acc + (i.preco * i.quantidade * (i.desconto / 100)), 0);

  const removerItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));

  const salvarPedido = async (gerarPedido = false) => {
    if (itens.length === 0 && !gerarPedido) return alert('Adicione produtos ao pedido.');
    const venda = {
      cliente_id: clienteId ? parseInt(clienteId) : null,
      total: totalGeral,
      forma_pagamento: condicaoPagamento,
      status: gerarPedido ? 'pedido' : 'orcamento',
    };
    const itensPedido = itens.map(i => ({
      produto_id: i.produto.id,
      quantidade: i.quantidade,
      preco_unitario: i.preco,
    }));

    if (vendaEditandoId) {
      const { error } = await atualizarVenda(vendaEditandoId, venda, itensPedido, itensAntigos);
      if (error) return alert('Erro ao atualizar: ' + error.message);
      alert('Venda atualizada com sucesso!');
    } else {
      const { error } = await criarVenda(venda, itensPedido);
      if (error) return alert('Erro ao criar: ' + error.message);
      alert(gerarPedido ? 'Pedido gerado com sucesso!' : 'Orçamento salvo com sucesso!');
    }

    prepararNovoPedido(); // limpa e reseta
    carregar();
    setAba('historico');
  };

  const deletarVendaItem = async (id: number) => {
    if (confirm('Excluir esta venda?')) { await deletarVenda(id); carregar(); }
  };

  const abrirFormulario = (venda: any, apenasVisualizar = false) => {
    setDropdownAbertoId(null);
    setVendaEditandoId(venda.id);
    setIsVisualizando(apenasVisualizar);
    
    setClienteId(venda.cliente_id ? String(venda.cliente_id) : '');
    setCondicaoPagamento(venda.forma_pagamento || '');
    setItensAntigos(venda.itens_venda || []);
    
    const itensMapeados = (venda.itens_venda || []).map((iv: any) => ({
      produto: iv.produtos ? { id: iv.produto_id, nome: iv.produtos.nome, preco: iv.preco_unitario, estoque: 0 } : { id: iv.produto_id, nome: 'Produto', preco: iv.preco_unitario, estoque: 0 },
      quantidade: iv.quantidade,
      preco: iv.preco_unitario,
      desconto: 0,
    }));
    setItens(itensMapeados);
    setAba('novo');
  };

  const prepararNovoPedido = () => {
    setVendaEditandoId(null);
    setIsVisualizando(false);
    setItensAntigos([]);
    setClienteId('');
    setCondicaoPagamento('');
    setItens([]);
    setAba('novo');
  };

  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [novoClienteForm, setNovoClienteForm] = useState({ nome: '', telefone: '', email: '', endereco: '' });

  const salvarNovoCliente = async () => {
    if (!novoClienteForm.nome) return alert('Por favor, informe o nome do cliente.');
    const { data, error } = await criarCliente({
      nome: novoClienteForm.nome,
      telefone: novoClienteForm.telefone || null,
      email: novoClienteForm.email || null,
      endereco: novoClienteForm.endereco || null,
    });
    if (error) return alert('Erro ao cadastrar cliente: ' + error.message);
    setModalClienteOpen(false);
    setNovoClienteForm({ nome: '', telefone: '', email: '', endereco: '' });
    await carregar();
    if (data) setClienteId(String(data.id));
    alert('Cliente cadastrado com sucesso!');
  };

  if (aba === 'historico') {
    return (
      <div className="vendas-historico">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: 'var(--text)', borderBottom: '2px solid var(--primary)', paddingBottom: 4 }}>Pedidos</span>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Informações sobre vendas</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ color: 'var(--green)', borderColor: '#b2dfdb', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Exportar para o Excel ▾
            </button>
            <button className="btn btn-yellow" onClick={prepararNovoPedido} style={{ fontWeight: 600 }}>
              + Criar novo pedido
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, maxWidth: 200 }}>
            <label className="form-label">Status</label>
            <select className="form-control">
              <option>Todos os status</option>
              <option>Pedido integrado (PF)</option>
              <option>Orçamento</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label className="form-label">&nbsp;</label>
            <div className="search-bar" style={{ height: 32 }}>
              <input placeholder="Pesquisar por cliente..." style={{ height: '100%', fontSize: 11 }} />
              <button style={{ width: 'auto', padding: '0 12px', background: 'transparent', color: 'var(--text)', borderLeft: '1px solid var(--border)', fontSize: 11, fontWeight: 500 }}>
                Filtros <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </button>
              <button style={{ background: 'var(--yellow)', color: '#333' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper" style={{ border: 'none', borderTop: '2px solid var(--border-light)', borderRadius: 0 }}>
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Ações</th>
                <th># <span className="sort-icon">↕</span></th>
                <th>Status <span className="sort-icon">↕</span></th>
                <th>Cliente <span className="sort-icon">↕</span></th>
                <th>Cond. Pgto <span className="sort-icon">↕</span></th>
                <th>Preço Total <span className="sort-icon">↕</span></th>
                <th>Data de criação <span className="sort-icon">↕</span></th>
              </tr>
            </thead>
            <tbody>
              {vendas.map(v => (
                <tr key={v.id}>
                  <td style={{ position: 'relative' }} onMouseLeave={() => setDropdownAbertoId(null)}>
                    <button 
                      className="btn btn-yellow btn-sm" 
                      style={{ padding: '4px 8px', fontSize: 10, fontWeight: 600 }}
                      onClick={() => setDropdownAbertoId(dropdownAbertoId === v.id ? null : v.id)}
                    >
                      ⚙ Ações ▾
                    </button>
                    {dropdownAbertoId === v.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 10,
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        boxShadow: 'var(--shadow)',
                        zIndex: 50,
                        minWidth: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px 0',
                        marginTop: 2
                      }}>
                        <button 
                          className="btn"
                          style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, background: 'none', border: 'none', color: 'var(--text)', width: '100%', borderRadius: 0, justifyContent: 'flex-start' }}
                          onClick={() => abrirFormulario(v, true)}
                        >
                          👁 Visualizar consultando
                        </button>
                        <button 
                          className="btn"
                          style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, background: 'none', border: 'none', color: 'var(--text)', width: '100%', borderRadius: 0, justifyContent: 'flex-start' }}
                          onClick={() => abrirFormulario(v, false)}
                        >
                          ✏ Editar a venda
                        </button>
                        <div style={{ height: 1, background: 'var(--border-light)', margin: '2px 0' }}></div>
                        <button 
                          className="btn"
                          style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, background: 'none', border: 'none', color: 'var(--red)', width: '100%', borderRadius: 0, justifyContent: 'flex-start' }}
                          onClick={() => { setDropdownAbertoId(null); deletarVendaItem(v.id); }}
                        >
                          🗑 Excluir
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{v.id}</td>
                  <td>
                    {v.status === 'orcamento' ? (
                      <span className="badge" style={{ background: '#fdf5e6', color: '#f39c12', padding: '4px 10px' }}>Orçamento</span>
                    ) : v.status === 'pedido' ? (
                      <span className="badge" style={{ background: '#eafaf1', color: 'var(--green)', padding: '4px 10px' }}>Pedido integrado (PF)</span>
                    ) : (
                      <span className="badge" style={{ background: '#f0f0f0', color: '#666', padding: '4px 10px' }}>{v.status}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 11, fontWeight: 600 }}>
                    {v.clientes?.nome ?? 'Avulso'}
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{v.clientes?.endereco || 'S/N'}</div>
                  </td>
                  <td style={{ fontSize: 11 }}>{v.forma_pagamento ?? 'A COMBINAR'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>R$ {Number(v.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(v.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {vendas.length === 0 && <tr><td colSpan={7}><div className="empty-state">Nenhum pedido registrado.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
        <span>Detalhes do Pedido</span>
        <span style={{ margin: '0 4px' }}>·</span>
        <span>Pedidos</span>
        <span style={{ margin: '0 4px' }}>·</span>
        <span style={{ color: 'var(--blue)' }}>{isVisualizando ? 'Consultando pedido' : (vendaEditandoId ? 'Editando pedido' : 'Criar novo pedido')}</span>
      </div>

      {/* Header Empresa */}
      <div className="pedido-header">
        <div className="pedido-empresa">
          <span className="empresa-tag">Empresa:</span>
          <span className="empresa-name">OMNI ORION</span>
          <span className="empresa-tag" style={{ marginLeft: 8 }}>Filial:</span>
          <span className="empresa-name">Matriz</span>
        </div>
        <button className="btn btn-outline btn-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Alterar Empresa / Filial
        </button>
      </div>

      {/* ========== SEÇÃO: CLIENTE ========== */}
      <div className="section-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <span className="card-title">Cliente</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setModalClienteOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Criar novo prospect
            </button>
            <button className="btn btn-green btn-sm" onClick={() => setModalClienteOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Criar novo cliente
            </button>
          </div>
        </div>
        <div className="section-block-body">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Selecione um cliente *</label>
              <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)} disabled={isVisualizando}>
                <option value="">Busque por nome, CPF / CNPJ ou Código</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contato *</label>
              <select className="form-control" value={contato} onChange={e => setContato(e.target.value)}>
                <option value="">Busque por contatos ou crie um novo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SEÇÃO: SOBRE O PEDIDO ========== */}
      <div className="section-block">
        <div className="section-block-title">Sobre o pedido</div>
        <div className="section-block-body">
          {/* Row 1 */}
          <div className="form-grid-4" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label className="form-label">Tipo de transação *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <select className="form-control" value={tipoTransacao} onChange={e => setTipoTransacao(e.target.value)}>
                  <option>Venda</option><option>Orçamento</option><option>Troca</option>
                </select>
                <button className="btn btn-outline btn-sm btn-icon">×</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Condição de pagamento *</label>
              <select className="form-control" value={condicaoPagamento} onChange={e => setCondicaoPagamento(e.target.value)} disabled={isVisualizando}>
                <option value="">Selecione um cliente</option>
                <option>À vista</option><option>30 dias</option><option>60 dias</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Responsável *</label>
              <select className="form-control" value={responsavel} onChange={e => setResponsavel(e.target.value)}>
                <option>00002 MARIA BEATRIZ DAMÃO DE QUEVORA</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-grid-4" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label className="form-label">Frete</label>
              <select className="form-control" value={frete} onChange={e => setFrete(e.target.value)}>
                <option value="">Selecione uma opção</option>
                <option>CIF</option><option>FOB</option><option>Sem frete</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transportadora</label>
              <input className="form-control" placeholder="Busque por transportadora..." value={transportadora} onChange={e => setTransportadora(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Entrega</label>
              <input className="form-control" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Frete</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>R$</span>
                <input className="form-control" style={{ paddingLeft: 28 }} value={freteValor} onChange={e => setFreteValor(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-grid-4" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label className="form-label">Transp. Rodospacho</label>
              <select className="form-control" value={transpRodospacho} onChange={e => setTranspRodospacho(e.target.value)}>
                <option value="">Selecione uma opção</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Modalidade</label>
              <select className="form-control" value={modo} onChange={e => setModo(e.target.value)}>
                <option value=""></option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transportadora Coleta | Cliente Retira *</label>
              <select className="form-control" value={transpColeta} onChange={e => setTranspColeta(e.target.value)}>
                <option value="">Selecione uma opção...</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Observação Interna Omni Orion</label>
              <input className="form-control" value={obsInterna} onChange={e => setObsInterna(e.target.value)} />
            </div>
          </div>

          {/* Row 4 */}
          <div className="form-grid-4" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label className="form-label">Ordem de compra</label>
              <input className="form-control" value={ordemCompra} onChange={e => setOrdemCompra(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cliente da Remessa</label>
              <input className="form-control" value={clienteRemessa} onChange={e => setClienteRemessa(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Loja Remessa</label>
              <input className="form-control" value={lojaRemessa} onChange={e => setLojaRemessa(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nr.PedSep</label>
              <input className="form-control" value={nrPedSep} onChange={e => setNrPedSep(e.target.value)} />
            </div>
          </div>

          {/* Row 5 */}
          <div className="form-grid-4" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label className="form-label">NF.Separac.</label>
              <input className="form-control" value={nfSeparac} onChange={e => setNfSeparac(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">FiliOrigem</label>
              <input className="form-control" value={filiOrigem} onChange={e => setFiliOrigem(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">DTAF.Separacao</label>
              <input className="form-control" value={dtafSeparacao} onChange={e => setDtafSeparacao(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">FiliSeparac.</label>
              <input className="form-control" value={filiSeparac} onChange={e => setFiliSeparac(e.target.value)} />
            </div>
          </div>

          {/* Row 6 */}
          <div style={{ marginBottom: 10 }}>
            <div className="form-group" style={{ maxWidth: 260 }}>
              <label className="form-label">Ped.origem</label>
              <input className="form-control" value={pedOrigem} onChange={e => setPedOrigem(e.target.value)} />
            </div>
          </div>

          {/* Mensagens */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Mensagem da Nota</label>
              <textarea className="form-control" rows={3} value={msgNota} onChange={e => setMsgNota(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mensagem do Orçamento</label>
              <textarea className="form-control" rows={3} value={msgOrcamento} onChange={e => setMsgOrcamento(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ========== SEÇÃO: SOBRE O NEGÓCIO ========== */}
      <div className="section-block">
        <div className="section-block-title">Sobre o Negócio</div>
        <div className="section-block-body">
          <div className="form-group" style={{ maxWidth: 400 }}>
            <label className="form-label">Seleciona um negócio</label>
            <select className="form-control" value={negocio} onChange={e => setNegocio(e.target.value)}>
              <option value="">Busque por negócios ou crie um novo</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========== SEÇÃO: PRODUTOS ========== */}
      <div className="section-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-light)', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">Produto(s)</span>
            {/* small action icons */}
            {[
              { title: 'Info', icon: 'ℹ' },
              { title: 'Grade', icon: '⊞' },
              { title: 'Lista', icon: '☰' },
              { title: 'Excluir', icon: '🗑' },
            ].map(btn => (
              <button key={btn.title} className="btn btn-outline btn-xs btn-icon" title={btn.title}>{btn.icon}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline btn-sm">Importar Produto ↑</button>
            <button className="btn btn-green btn-sm">✓ Selecionar Produto</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="produtos-table">
            <thead>
              <tr>
                <th>Cód. Prod <span className="sort-icon">↕</span></th>
                <th>Produto <span className="sort-icon">↕</span></th>
                <th>Qtde.Cx</th>
                <th>Qtd <span className="sort-icon">↕</span></th>
                <th>Preço <span className="sort-icon">↕</span></th>
                <th>P. Tabela <span className="sort-icon">↕</span></th>
                <th>Desconto <span className="sort-icon">↕</span></th>
                <th>Taxas</th>
                <th>Estoque</th>
                <th>Armazém <span className="sort-icon">↕</span></th>
                <th>Lote</th>
                <th>Ordem de Compra <span className="sort-icon">↕</span></th>
                <th>P.C. Item</th>
                <th>Mensagem do Orçamento</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {/* Input row para adicionar produtos */}
              <tr>
                <td>
                  <select
                    className="input-cell"
                    style={{ minWidth: 140 }}
                    onChange={e => {
                      const p = produtos.find(x => String(x.id) === e.target.value);
                      if (p) {
                        setItens(prev => {
                          const ex = prev.find(i => i.produto.id === p.id);
                          if (ex) return prev.map(i => i.produto.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i);
                          return [...prev, { produto: p, quantidade: 1, preco: Number(p.preco), desconto: 0 }];
                        });
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Busque por código</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </td>
                <td></td>
                <td></td>
                <td><input className="input-cell" style={{ width: 50 }} placeholder="Qtde" /></td>
                <td><input className="input-cell" style={{ width: 70 }} placeholder="Preço" /></td>
                <td></td>
                <td></td>
                <td><input className="input-cell" style={{ width: 50 }} placeholder="Taxas" /></td>
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>

              {itens.map((item, idx) => (
                <tr key={item.produto.id}>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(item.produto.id).padStart(5, '0')}</td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{item.produto.nome}</td>
                  <td></td>
                  <td>
                    <input
                      className="input-cell"
                      style={{ width: 50 }}
                      type="number"
                      value={item.quantidade}
                      min={1}
                      onChange={e => {
                        const q = parseInt(e.target.value) || 1;
                        setItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: q } : it));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="input-cell"
                      style={{ width: 70 }}
                      type="number"
                      step="0.01"
                      value={item.preco}
                      onChange={e => {
                        const p = parseFloat(e.target.value) || 0;
                        setItens(prev => prev.map((it, i) => i === idx ? { ...it, preco: p } : it));
                      }}
                    />
                  </td>
                  <td style={{ fontSize: 11 }}>R$ {Number(item.produto.preco).toFixed(2)}</td>
                  <td>
                    <input
                      className="input-cell"
                      style={{ width: 50 }}
                      type="number"
                      value={item.desconto}
                      min={0} max={100}
                      onChange={e => {
                        const d = parseFloat(e.target.value) || 0;
                        setItens(prev => prev.map((it, i) => i === idx ? { ...it, desconto: d } : it));
                      }}
                    />
                  </td>
                  <td></td>
                  <td style={{ fontSize: 11 }}>{item.produto.estoque}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                  <td>
                    <button
                      className="btn btn-xs"
                      style={{ background: '#fdecea', color: 'var(--red)', border: 'none' }}
                      onClick={() => removerItem(idx)}
                    >✕</button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ height: 40 }}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== SEÇÃO: RESUMO ========== */}
      <div className="section-block">
        <div className="section-block-title">Resumo</div>
        <div style={{ padding: '10px 16px' }}>
          <div className="resumo-bar">
            <div className="resumo-item">
              <div className="resumo-label">Qtde. Itens</div>
              <div className="resumo-value">{totalItens}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Qtde. Itens</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Peso Total (kg)</div>
              <div className="resumo-value">0.00</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Peso Total (kg)</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Tonelada / Taxas</div>
              <div className="resumo-value">R$ 0.00</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tonelada / Taxas</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Taxas</div>
              <div className="resumo-value primary">Calcular</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Descontos (Bruto)</div>
              <div className="resumo-value primary">- R$ {totalDescontos.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Descontos (Bruto)</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Descontos SUBTIBAS</div>
              <div className="resumo-value primary">- R$ 0.00</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Descontos SUBTIBAS</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-label">Total Geral</div>
              <div className="resumo-value green">Calcular</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>R$ {totalGeral.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="page-footer">
        <button className="btn btn-gray" onClick={() => setAba('historico')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Fechar
        </button>
        {!isVisualizando && (
          <>
            <button className="btn btn-outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Calcular Taxas
            </button>
            <button className="btn btn-yellow" onClick={() => salvarPedido(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Salvar
            </button>
            <button className="btn btn-green" onClick={() => salvarPedido(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Salvar e Gerar Pedido
            </button>
          </>
        )}
      </div>
      {/* Modal Criar Novo Cliente */}
      {modalClienteOpen && (
        <div className="modal-overlay" onClick={() => setModalClienteOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Novo Cliente / Prospect</span>
              <button className="modal-close" onClick={() => setModalClienteOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nome Completo / Razão Social *</label>
                  <input className="form-control" value={novoClienteForm.nome} onChange={e => setNovoClienteForm({ ...novoClienteForm, nome: e.target.value })} placeholder="Ex: João da Silva" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" value={novoClienteForm.telefone} onChange={e => setNovoClienteForm({ ...novoClienteForm, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-control" value={novoClienteForm.email} onChange={e => setNovoClienteForm({ ...novoClienteForm, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Endereço / Cidade</label>
                  <input className="form-control" value={novoClienteForm.endereco} onChange={e => setNovoClienteForm({ ...novoClienteForm, endereco: e.target.value })} placeholder="Cidade - UF" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalClienteOpen(false)}>Cancelar</button>
              <button className="btn btn-green" onClick={salvarNovoCliente}>Salvar e Selecionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendas;

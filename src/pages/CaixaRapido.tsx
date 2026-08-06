import { useEffect, useMemo, useState } from 'react';
import { criarVenda, listarClientes, listarFormasPagamento, listarProdutos } from '../lib/db';
import type { Cliente, FormaPagamento, Produto } from '../lib/types';

type ProdutoComCategoria = Produto & { categorias: { nome: string } | null };

interface ItemCaixa {
  produto: ProdutoComCategoria;
  quantidade: number;
  desconto: number;
}

const dinheiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CaixaRapido() {
  const [produtos, setProdutos] = useState<ProdutoComCategoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [itens, setItens] = useState<ItemCaixa[]>([]);
  const [busca, setBusca] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const [listaProdutos, listaClientes, respostaFormas] = await Promise.all([
      listarProdutos(),
      listarClientes(),
      listarFormasPagamento(),
    ]);
    const formasAtivas = respostaFormas.data.filter(forma => forma.ativo);
    setProdutos(listaProdutos);
    setClientes(listaClientes);
    setFormas(formasAtivas);
    setFormaPagamento(atual => atual || formasAtivas[0]?.nome || 'Dinheiro');
    setCarregando(false);
  };

  useEffect(() => {
    void carregar();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return produtos;
    return produtos.filter(produto =>
      produto.nome.toLocaleLowerCase('pt-BR').includes(termo)
      || produto.categorias?.nome.toLocaleLowerCase('pt-BR').includes(termo)
    );
  }, [busca, produtos]);

  const subtotal = itens.reduce((total, item) => total + item.produto.preco * item.quantidade, 0);
  const descontos = itens.reduce(
    (total, item) => total + item.produto.preco * item.quantidade * (item.desconto / 100),
    0
  );
  const total = subtotal - descontos;
  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  const adicionar = (produto: ProdutoComCategoria) => {
    if (produto.estoque <= 0) return;
    setMensagem(null);
    setItens(atuais => {
      const existente = atuais.find(item => item.produto.id === produto.id);
      if (!existente) return [...atuais, { produto, quantidade: 1, desconto: 0 }];
      if (existente.quantidade >= produto.estoque) return atuais;
      return atuais.map(item =>
        item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      );
    });
  };

  const alterarQuantidade = (produtoId: number, quantidade: number) => {
    setItens(atuais => atuais
      .map(item => item.produto.id === produtoId
        ? { ...item, quantidade: Math.min(item.produto.estoque, Math.max(0, quantidade)) }
        : item)
      .filter(item => item.quantidade > 0));
  };

  const alterarDesconto = (produtoId: number, desconto: number) => {
    const valor = Number.isFinite(desconto) ? Math.min(100, Math.max(0, desconto)) : 0;
    setItens(atuais => atuais.map(item =>
      item.produto.id === produtoId ? { ...item, desconto: valor } : item
    ));
  };

  const finalizarVenda = async () => {
    if (!itens.length || !formaPagamento || finalizando) return;
    setFinalizando(true);
    setMensagem(null);

    const resultado = await criarVenda(
      {
        cliente_id: clienteId ? Number(clienteId) : null,
        total,
        forma_pagamento: formaPagamento,
        status: 'finalizada',
      },
      itens.map(item => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco * (1 - item.desconto / 100),
      }))
    );

    if (resultado.error) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível finalizar: ${resultado.error.message}` });
      setFinalizando(false);
      return;
    }

    setMensagem({ tipo: 'ok', texto: `Venda #${resultado.data?.id} finalizada com sucesso.` });
    setItens([]);
    setClienteId('');
    setBusca('');
    await carregar();
    setFinalizando(false);
  };

  return (
    <section className="caixa-page">
      <header className="caixa-header">
        <div>
          <span className="caixa-eyebrow">VENDA DE BALCÃO</span>
          <h1>Caixa Rápido</h1>
          <p>Selecione os produtos, confira o pagamento e finalize.</p>
        </div>
        <div className="caixa-header-count">
          <strong>{quantidadeTotal}</strong>
          <span>{quantidadeTotal === 1 ? 'item no carrinho' : 'itens no carrinho'}</span>
        </div>
      </header>

      {mensagem && <div className={`caixa-feedback ${mensagem.tipo}`}>{mensagem.texto}</div>}

      <div className="caixa-grid">
        <div className="caixa-products-panel">
          <div className="caixa-panel-heading">
            <div>
              <strong>Produtos</strong>
              <span>{produtosFiltrados.length} disponíveis na consulta</span>
            </div>
            <input
              type="search"
              value={busca}
              onChange={event => setBusca(event.target.value)}
              placeholder="Buscar produto ou categoria"
              aria-label="Buscar produto ou categoria"
            />
          </div>

          {carregando ? (
            <div className="caixa-empty">Carregando produtos...</div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="caixa-empty">Nenhum produto encontrado.</div>
          ) : (
            <div className="caixa-product-list">
              {produtosFiltrados.map(produto => (
                <button
                  type="button"
                  key={produto.id}
                  className="caixa-product"
                  disabled={produto.estoque <= 0}
                  onClick={() => adicionar(produto)}
                >
                  <span className="caixa-product-mark" aria-hidden="true">
                    <span>{produto.nome.charAt(0).toUpperCase()}</span>
                    {produto.imagem_url && (
                      <img
                        src={produto.imagem_url}
                        alt=""
                        loading="lazy"
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </span>
                  <span className="caixa-product-info">
                    <strong>{produto.nome}</strong>
                    <small>{produto.categorias?.nome || 'Sem categoria'}</small>
                  </span>
                  <span className="caixa-product-stock">
                    <strong>{dinheiro.format(produto.preco)}</strong>
                    <small>{produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Sem estoque'}</small>
                  </span>
                  <span className="caixa-product-add">+</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="caixa-checkout">
          <div className="caixa-panel-heading">
            <div>
              <strong>Resumo da venda</strong>
              <span>Cliente opcional</span>
            </div>
            {itens.length > 0 && (
              <button type="button" className="caixa-clear" onClick={() => setItens([])}>Limpar</button>
            )}
          </div>

          <label className="caixa-field">
            <span>Cliente</span>
            <select value={clienteId} onChange={event => setClienteId(event.target.value)}>
              <option value="">Consumidor não identificado</option>
              {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </label>

          <div className="caixa-cart">
            {itens.length === 0 ? (
              <div className="caixa-cart-empty">
                <span>🛒</span>
                <strong>Carrinho vazio</strong>
                <small>Selecione um produto para começar.</small>
              </div>
            ) : itens.map(item => (
              <article className="caixa-cart-item" key={item.produto.id}>
                <div className="caixa-cart-title">
                  <div>
                    <strong>{item.produto.nome}</strong>
                    <small>{dinheiro.format(item.produto.preco)} cada</small>
                  </div>
                  <button type="button" onClick={() => alterarQuantidade(item.produto.id, 0)} aria-label={`Remover ${item.produto.nome}`}>×</button>
                </div>
                <div className="caixa-cart-controls">
                  <div className="caixa-quantity">
                    <button type="button" onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}>−</button>
                    <span>{item.quantidade}</span>
                    <button
                      type="button"
                      disabled={item.quantidade >= item.produto.estoque}
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                    >+</button>
                  </div>
                  <label>
                    Desconto
                    <span><input type="number" min="0" max="100" value={item.desconto} onChange={event => alterarDesconto(item.produto.id, Number(event.target.value))} />%</span>
                  </label>
                  <strong>{dinheiro.format(item.produto.preco * item.quantidade * (1 - item.desconto / 100))}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="caixa-payment">
            <label className="caixa-field">
              <span>Forma de pagamento</span>
              <select value={formaPagamento} onChange={event => setFormaPagamento(event.target.value)}>
                {formas.length === 0 && <option value="Dinheiro">Dinheiro</option>}
                {formas.map(forma => <option key={forma.id} value={forma.nome}>{forma.nome}</option>)}
              </select>
            </label>
            <div className="caixa-totals">
              <span>Subtotal <strong>{dinheiro.format(subtotal)}</strong></span>
              <span>Descontos <strong>− {dinheiro.format(descontos)}</strong></span>
              <span className="caixa-total">Total <strong>{dinheiro.format(total)}</strong></span>
            </div>
            <button
              type="button"
              className="caixa-finish"
              disabled={!itens.length || !formaPagamento || finalizando}
              onClick={() => void finalizarVenda()}
            >
              {finalizando ? 'Finalizando...' : 'Finalizar venda'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

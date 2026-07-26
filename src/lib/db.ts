import { supabase } from './supabase';
import type { Categoria, Produto, Cliente, Venda, ItemVenda } from './types';

export async function listarCategorias() {
  const { data } = await supabase.from('categorias').select('*').order('nome');
  return (data ?? []) as Categoria[];
}

export async function criarCategoria(nome: string) {
  return supabase.from('categorias').insert({ nome }).select().single();
}

export async function listarProdutos() {
  const { data } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .order('nome');
  return (data ?? []) as (Produto & { categorias: { nome: string } | null })[];
}

export async function criarProduto(produto: Omit<Produto, 'id' | 'created_at'>) {
  return supabase.from('produtos').insert(produto).select().single();
}

export async function atualizarProduto(id: number, produto: Partial<Omit<Produto, 'id' | 'created_at'>>) {
  return supabase.from('produtos').update(produto).eq('id', id);
}

export async function deletarProduto(id: number) {
  return supabase.from('produtos').delete().eq('id', id);
}

export async function listarClientes() {
  const { data } = await supabase.from('clientes').select('*').order('nome');
  return (data ?? []) as Cliente[];
}

export async function criarCliente(cliente: Omit<Cliente, 'id' | 'created_at'>) {
  return supabase.from('clientes').insert(cliente).select().single();
}

export async function atualizarCliente(id: number, cliente: Partial<Omit<Cliente, 'id' | 'created_at'>>) {
  return supabase.from('clientes').update(cliente).eq('id', id);
}

export async function deletarCliente(id: number) {
  return supabase.from('clientes').delete().eq('id', id);
}

export async function criarVenda(venda: Omit<Venda, 'id' | 'created_at'>, itens: Omit<ItemVenda, 'id' | 'venda_id'>[]) {
  const { data, error } = await supabase.from('vendas').insert(venda).select().single();
  if (error || !data) return { error };
  const itensComVenda = itens.map(i => ({ ...i, venda_id: data.id }));
  const { error: errItens } = await supabase.from('itens_venda').insert(itensComVenda);
  if (errItens) return { error: errItens };
  for (const item of itens) {
    await supabase.rpc('diminuir_estoque', { pid: item.produto_id, qtd: item.quantidade });
  }
  return { data };
}

export async function atualizarVenda(id: number, venda: Partial<Omit<Venda, 'id' | 'created_at'>>, itensNovos: Omit<ItemVenda, 'id' | 'venda_id'>[], itensAntigos: ItemVenda[]) {
  // 1. Devolver estoque antigo
  for (const old of itensAntigos) {
    await supabase.rpc('diminuir_estoque', { pid: old.produto_id, qtd: -old.quantidade });
  }
  // 2. Deletar itens antigos
  await supabase.from('itens_venda').delete().eq('venda_id', id);
  // 3. Atualizar dados da venda
  const { error } = await supabase.from('vendas').update(venda).eq('id', id);
  if (error) return { error };
  // 4. Inserir itens novos
  const itensComVenda = itensNovos.map(i => ({ ...i, venda_id: id }));
  const { error: errItens } = await supabase.from('itens_venda').insert(itensComVenda);
  if (errItens) return { error: errItens };
  // 5. Baixar estoque novo
  for (const item of itensNovos) {
    await supabase.rpc('diminuir_estoque', { pid: item.produto_id, qtd: item.quantidade });
  }
  return { success: true };
}

export async function listarVendas() {
  const { data } = await supabase
    .from('vendas')
    .select('*, clientes(nome), itens_venda(*, produtos(nome))')
    .order('created_at', { ascending: false });
  return (data ?? []) as (Venda & { clientes: { nome: string } | null; itens_venda: (ItemVenda & { produtos: { nome: string } })[] })[];
}

export async function deletarVenda(id: number) {
  return supabase.from('vendas').delete().eq('id', id);
}

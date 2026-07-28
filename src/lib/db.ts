import { supabase } from './supabase';
import type { Categoria, Produto, Cliente, Venda, ItemVenda } from './types';
import type { PerfilAcesso, Permissao, UnidadeOrganizacional, UsuarioSistema } from './types';
import type { Empresa, Filial, FormaPagamento, Fornecedor, TabelaPreco } from './types';

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

export async function listarPermissoes() {
  const { data, error } = await supabase
    .from('permissoes')
    .select('*')
    .order('ordem');
  return { data: (data ?? []) as Permissao[], error };
}

export async function listarPerfisAcesso() {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .select('*, perfil_permissoes(permissao_id)')
    .order('nome');
  return { data: (data ?? []) as PerfilAcesso[], error };
}

export async function criarPerfilAcesso(payload: Pick<PerfilAcesso, 'nome' | 'descricao'>) {
  const slug = payload.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return supabase
    .from('perfis_acesso')
    .insert({ ...payload, slug, sistema: false, ativo: true })
    .select()
    .single();
}

export async function atualizarPerfilAcesso(
  id: number,
  payload: Partial<Pick<PerfilAcesso, 'nome' | 'descricao' | 'ativo'>>
) {
  return supabase
    .from('perfis_acesso')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function excluirPerfilAcesso(id: number) {
  return supabase.from('perfis_acesso').delete().eq('id', id).eq('sistema', false);
}

export async function salvarPermissoesPerfil(perfilId: number, permissaoIds: number[]) {
  return supabase.rpc('salvar_permissoes_perfil', {
    target_perfil_id: perfilId,
    permission_ids: permissaoIds,
  });
}

export async function listarUsuariosSistema() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      usuario_perfis(
        perfil_id,
        principal,
        perfis_acesso(*)
      ),
      usuario_permissoes(
        permissao_id,
        permitido
      )
    `)
    .order('nome');
  return { data: (data ?? []) as UsuarioSistema[], error };
}

export async function atualizarUsuarioSistema(
  id: string,
  payload: Partial<Pick<UsuarioSistema, 'nome' | 'cargo' | 'ativo'>>
) {
  return supabase.from('usuarios').update(payload).eq('id', id);
}

export async function salvarAcessoUsuario(
  usuarioId: string,
  perfilIds: number[],
  perfilPrincipalId: number,
  excecoes: { permissao_id: number; permitido: boolean }[]
) {
  return supabase.rpc('salvar_acesso_usuario', {
    target_usuario_id: usuarioId,
    profile_ids: perfilIds,
    primary_profile_id: perfilPrincipalId,
    permission_overrides: excecoes,
  });
}

export async function listarUnidadesOrganizacionais() {
  const { data, error } = await supabase
    .from('unidades_organizacionais')
    .select('*')
    .order('nome');
  return { data: (data ?? []) as UnidadeOrganizacional[], error };
}

export async function salvarUnidadeOrganizacional(
  payload: Pick<UnidadeOrganizacional, 'nome' | 'descricao' | 'parent_id' | 'ativo'>,
  id?: number
) {
  if (id) {
    return supabase
      .from('unidades_organizacionais')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);
  }
  return supabase.from('unidades_organizacionais').insert(payload).select().single();
}

export async function excluirUnidadeOrganizacional(id: number) {
  return supabase.from('unidades_organizacionais').delete().eq('id', id);
}

export type RegistroTabela = 'empresas' | 'filiais' | 'fornecedores' | 'formas_pagamento' | 'tabelas_preco';

export async function listarEmpresas() {
  const { data, error } = await supabase.from('empresas').select('*').order('razao_social');
  return { data: (data ?? []) as Empresa[], error };
}

export async function listarFiliais() {
  const { data, error } = await supabase
    .from('filiais')
    .select('*, empresas(id, nome_fantasia, razao_social)')
    .order('nome');
  return { data: (data ?? []) as Filial[], error };
}

export async function listarFornecedores() {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*, empresas(id, nome_fantasia, razao_social), filiais(id, nome)')
    .order('razao_social');
  return { data: (data ?? []) as Fornecedor[], error };
}

export async function listarFormasPagamento() {
  const { data, error } = await supabase
    .from('formas_pagamento')
    .select('*, empresas(id, nome_fantasia, razao_social)')
    .order('nome');
  return { data: (data ?? []) as FormaPagamento[], error };
}

export async function listarTabelasPreco() {
  const { data, error } = await supabase
    .from('tabelas_preco')
    .select('*, empresas(id, nome_fantasia, razao_social), filiais(id, nome)')
    .order('nome');
  return { data: (data ?? []) as TabelaPreco[], error };
}

export async function salvarRegistro(
  tabela: RegistroTabela,
  payload: Record<string, string | number | boolean | null>,
  id?: number
) {
  const dados = { ...payload, updated_at: new Date().toISOString() };
  if (id) return supabase.from(tabela).update(dados).eq('id', id).select().single();
  return supabase.from(tabela).insert(payload).select().single();
}

export async function excluirRegistro(tabela: RegistroTabela, id: number) {
  return supabase.from(tabela).delete().eq('id', id);
}

export interface Categoria {
  id: number;
  nome: string;
  created_at: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number;
  categoria_id: number | null;
  imagem_url: string | null;
  created_at: string;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
}

export interface Venda {
  id: number;
  cliente_id: number | null;
  total: number;
  forma_pagamento: string | null;
  status: string;
  created_at: string;
}

export interface ItemVenda {
  id: number;
  venda_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
}

export interface Permissao {
  id: number;
  codigo: string;
  modulo: string;
  acao: string;
  nome: string;
  descricao: string | null;
  ordem: number;
}

export interface PerfilAcesso {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  sistema: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  perfil_permissoes?: { permissao_id: number }[];
}

export interface UsuarioSistema {
  id: string;
  email: string;
  nome: string | null;
  cargo: string | null;
  perfil_acesso: string | null;
  avatar_url: string | null;
  ativo: boolean;
  created_at: string;
  usuario_perfis?: {
    perfil_id: number;
    principal: boolean;
    perfis_acesso?: PerfilAcesso | null;
  }[];
  usuario_permissoes?: {
    permissao_id: number;
    permitido: boolean;
  }[];
}

export interface UnidadeOrganizacional {
  id: number;
  nome: string;
  descricao: string | null;
  parent_id: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Empresa {
  id: number;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Filial {
  id: number;
  empresa_id: number | null;
  nome: string;
  codigo: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresas?: Pick<Empresa, 'id' | 'nome_fantasia' | 'razao_social'> | null;
}

export interface Fornecedor {
  id: number;
  empresa_id: number | null;
  filial_id: number | null;
  razao_social: string;
  nome_fantasia: string | null;
  documento: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresas?: Pick<Empresa, 'id' | 'nome_fantasia' | 'razao_social'> | null;
  filiais?: Pick<Filial, 'id' | 'nome'> | null;
}

export interface FormaPagamento {
  id: number;
  empresa_id: number | null;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  prazo_dias: number;
  taxa_percentual: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresas?: Pick<Empresa, 'id' | 'nome_fantasia' | 'razao_social'> | null;
}

export interface TabelaPreco {
  id: number;
  empresa_id: number | null;
  filial_id: number | null;
  nome: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresas?: Pick<Empresa, 'id' | 'nome_fantasia' | 'razao_social'> | null;
  filiais?: Pick<Filial, 'id' | 'nome'> | null;
}

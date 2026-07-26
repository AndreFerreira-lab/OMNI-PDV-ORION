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

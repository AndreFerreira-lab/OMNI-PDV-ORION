CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  total DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT,
  status TEXT DEFAULT 'finalizada',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL
);

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso público/autenticado
DROP POLICY IF EXISTS "Todos podem ler produtos" ON produtos;
CREATE POLICY "Todos podem ler produtos" ON produtos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos podem inserir produtos" ON produtos;
CREATE POLICY "Todos podem inserir produtos" ON produtos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Todos podem atualizar produtos" ON produtos;
CREATE POLICY "Todos podem atualizar produtos" ON produtos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Todos podem deletar produtos" ON produtos;
CREATE POLICY "Todos podem deletar produtos" ON produtos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Todos podem ler clientes" ON clientes;
CREATE POLICY "Todos podem ler clientes" ON clientes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos podem inserir clientes" ON clientes;
CREATE POLICY "Todos podem inserir clientes" ON clientes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Todos podem atualizar clientes" ON clientes;
CREATE POLICY "Todos podem atualizar clientes" ON clientes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Todos podem deletar clientes" ON clientes;
CREATE POLICY "Todos podem deletar clientes" ON clientes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Todos podem ler vendas" ON vendas;
CREATE POLICY "Todos podem ler vendas" ON vendas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos podem inserir vendas" ON vendas;
CREATE POLICY "Todos podem inserir vendas" ON vendas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Todos podem atualizar vendas" ON vendas;
CREATE POLICY "Todos podem atualizar vendas" ON vendas FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Todos podem deletar vendas" ON vendas;
CREATE POLICY "Todos podem deletar vendas" ON vendas FOR DELETE USING (true);

DROP POLICY IF EXISTS "Todos podem ler itens_venda" ON itens_venda;
CREATE POLICY "Todos podem ler itens_venda" ON itens_venda FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos podem inserir itens_venda" ON itens_venda;
CREATE POLICY "Todos podem inserir itens_venda" ON itens_venda FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Todos podem deletar itens_venda" ON itens_venda;
CREATE POLICY "Todos podem deletar itens_venda" ON itens_venda FOR DELETE USING (true);

DROP POLICY IF EXISTS "Todos podem ler categorias" ON categorias;
CREATE POLICY "Todos podem ler categorias" ON categorias FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos podem inserir categorias" ON categorias;
CREATE POLICY "Todos podem inserir categorias" ON categorias FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Todos podem atualizar categorias" ON categorias;
CREATE POLICY "Todos podem atualizar categorias" ON categorias FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Todos podem deletar categorias" ON categorias;
CREATE POLICY "Todos podem deletar categorias" ON categorias FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION diminuir_estoque(pid BIGINT, qtd INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE produtos SET estoque = estoque - qtd WHERE id = pid;
END;
$$ LANGUAGE plpgsql;

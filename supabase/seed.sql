INSERT INTO categorias (nome) VALUES
  ('Bebidas'),
  ('Alimentos'),
  ('Limpeza'),
  ('Higiene')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO produtos (nome, descricao, preco, estoque, categoria_id) VALUES
  ('Coca-Cola 2L', 'Refrigerante de cola 2 litros', 8.50, 50, 1),
  ('Arroz 5kg', 'Arroz branco tipo 1', 22.90, 30, 2),
  ('Feijão 1kg', 'Feijão carioca', 7.80, 40, 2),
  ('Detergente Líquido', 'Detergente neutro 500ml', 3.50, 60, 3),
  ('Sabonete', 'Sabonete hidratante 90g', 2.99, 100, 4);

INSERT INTO clientes (nome, telefone, email) VALUES
  ('João Silva', '(11) 99999-0001', 'joao@email.com'),
  ('Maria Santos', '(11) 99999-0002', 'maria@email.com');

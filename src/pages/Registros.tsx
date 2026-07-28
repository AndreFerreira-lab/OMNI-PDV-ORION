import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  excluirRegistro,
  listarEmpresas,
  listarFiliais,
  listarFormasPagamento,
  listarFornecedores,
  listarTabelasPreco,
  salvarRegistro,
  type RegistroTabela,
} from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import type { Empresa, Filial, FormaPagamento, Fornecedor, TabelaPreco } from '../lib/types';

type Aba = 'visao' | RegistroTabela;
type Registro = Empresa | Filial | Fornecedor | FormaPagamento | TabelaPreco;

const abas: { id: Aba; nome: string; icone: string }[] = [
  { id: 'visao', nome: 'Visão geral', icone: '▦' },
  { id: 'empresas', nome: 'Empresas', icone: '🏢' },
  { id: 'filiais', nome: 'Filiais', icone: '⌘' },
  { id: 'fornecedores', nome: 'Fornecedores', icone: '◈' },
  { id: 'formas_pagamento', nome: 'Formas de pagamento', icone: '▣' },
  { id: 'tabelas_preco', nome: 'Tabelas de preço', icone: '◇' },
];

const titulos: Record<RegistroTabela, string> = {
  empresas: 'Empresa',
  filiais: 'Filial',
  fornecedores: 'Fornecedor',
  formas_pagamento: 'Forma de pagamento',
  tabelas_preco: 'Tabela de preço',
};

const vazio = {
  razao_social: '', nome_fantasia: '', cnpj: '', documento: '', email: '', telefone: '',
  nome: '', descricao: '', endereco: '', empresa_id: '', filial_id: '', data_inicio: '', data_fim: '',
  tipo: '', prazo_dias: '0', taxa_percentual: '0', ativo: true,
};

const abaPorParametro: Record<string, Aba> = {
  empresas: 'empresas',
  filiais: 'filiais',
  fornecedores: 'fornecedores',
  'formas-pagamento': 'formas_pagamento',
  'tabelas-preco': 'tabelas_preco',
};

const parametroPorAba: Partial<Record<Aba, string>> = {
  empresas: 'empresas',
  filiais: 'filiais',
  fornecedores: 'fornecedores',
  formas_pagamento: 'formas-pagamento',
  tabelas_preco: 'tabelas-preco',
};

export default function Registros() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = useAuth();
  const [aba, setAba] = useState<Aba>(() => abaPorParametro[searchParams.get('aba') ?? ''] ?? 'visao');
  const [dados, setDados] = useState<Record<RegistroTabela, Registro[]>>({
    empresas: [], filiais: [], fornecedores: [], formas_pagamento: [], tabelas_preco: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [form, setForm] = useState({ ...vazio });

  const carregar = async () => {
    setLoading(true);
    setErro('');
    const [empresas, filiais, fornecedores, formas, tabelas] = await Promise.all([
      listarEmpresas(), listarFiliais(), listarFornecedores(), listarFormasPagamento(), listarTabelasPreco(),
    ]);
    const falha = empresas.error || filiais.error || fornecedores.error || formas.error || tabelas.error;
    if (falha) setErro(falha.message);
    setDados({
      empresas: empresas.data,
      filiais: filiais.data,
      fornecedores: fornecedores.data,
      formas_pagamento: formas.data,
      tabelas_preco: tabelas.data,
    });
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, []);

  useEffect(() => {
    const destino = abaPorParametro[searchParams.get('aba') ?? ''] ?? 'visao';
    setAba(destino);
  }, [searchParams]);

  const selecionarAba = (destino: Aba) => {
    setAba(destino);
    setBusca('');
    setErro('');
    const parametro = parametroPorAba[destino];
    setSearchParams(parametro ? { aba: parametro } : {}, { replace: true });
  };

  const registros = useMemo(() => {
    if (aba === 'visao') return [];
    const termo = busca.toLowerCase();
    return dados[aba].filter(item => Object.values(item).some(valor =>
      typeof valor === 'string' && valor.toLowerCase().includes(termo)
    ));
  }, [aba, busca, dados]);

  const abrir = (item?: Registro) => {
    setEditando(item ?? null);
    setForm({
      ...vazio,
      ...Object.fromEntries(Object.entries(item ?? {}).map(([chave, valor]) => [chave, valor ?? ''])),
      empresa_id: item && 'empresa_id' in item && item.empresa_id ? String(item.empresa_id) : '',
      filial_id: item && 'filial_id' in item && item.filial_id ? String(item.filial_id) : '',
      data_inicio: item && 'data_inicio' in item ? item.data_inicio ?? '' : '',
      data_fim: item && 'data_fim' in item ? item.data_fim ?? '' : '',
    });
    setErro('');
    setModal(true);
  };

  const payload = () => {
    const comum = { ativo: Boolean(form.ativo) };
    if (aba === 'empresas') return {
      ...comum, razao_social: form.razao_social.trim(), nome_fantasia: form.nome_fantasia.trim() || null,
      cnpj: form.cnpj.trim() || null, email: form.email.trim() || null, telefone: form.telefone.trim() || null,
    };
    if (aba === 'filiais') return {
      ...comum, nome: form.nome.trim(), empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
      cnpj: form.cnpj.trim() || null, endereco: form.endereco.trim() || null,
    };
    if (aba === 'fornecedores') return {
      ...comum, razao_social: form.razao_social.trim(), nome_fantasia: form.nome_fantasia.trim() || null,
      documento: form.documento.trim() || null, email: form.email.trim() || null,
      telefone: form.telefone.trim() || null, empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
      filial_id: form.filial_id ? Number(form.filial_id) : null,
    };
    if (aba === 'formas_pagamento') return {
      ...comum, nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
      tipo: form.tipo.trim() || null,
      prazo_dias: Number(form.prazo_dias || 0),
      taxa_percentual: Number(form.taxa_percentual || 0),
    };
    return {
      ...comum, nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
      filial_id: form.filial_id ? Number(form.filial_id) : null,
    };
  };

  const salvar = async () => {
    if (aba === 'visao') return;
    const principal = aba === 'empresas' || aba === 'fornecedores' ? form.razao_social : form.nome;
    if (!principal.trim()) { setErro('Preencha o campo obrigatório.'); return; }
    setSaving(true);
    setErro('');
    const { error } = await salvarRegistro(aba, payload(), editando?.id);
    if (error) setErro(error.message);
    else {
      setModal(false);
      setSucesso(`${titulos[aba]} ${editando ? 'atualizado(a)' : 'criado(a)'} com sucesso.`);
      await carregar();
    }
    setSaving(false);
  };

  const excluir = async (item: Registro) => {
    if (aba === 'visao' || !confirm('Excluir este registro? Essa ação não pode ser desfeita.')) return;
    const { error } = await excluirRegistro(aba, item.id);
    if (error) setErro('Não foi possível excluir. Verifique se existem vínculos com este registro.');
    else { setSucesso('Registro excluído.'); await carregar(); }
  };

  const nome = (item: Registro) =>
    ('razao_social' in item ? item.nome_fantasia || item.razao_social : item.nome);

  const empresaNome = (item: Registro) =>
    'empresas' in item ? item.empresas?.nome_fantasia || item.empresas?.razao_social : null;

  if (loading) return <div className="admin-loading">Carregando Registros...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>Registros</h1><p>Cadastros centrais do sistema, organizados sem duplicar Clientes, Produtos ou Categorias.</p></div>
        <span className="admin-security-badge">✓ Relações opcionais</span>
      </div>

      <div className="admin-tabs">
        {abas.map(item => <button key={item.id} className={aba === item.id ? 'active' : ''} onClick={() => selecionarAba(item.id)}>{item.icone} {item.nome}</button>)}
      </div>

      {erro && <div className="admin-feedback erro">{erro}</div>}
      {sucesso && <div className="admin-feedback ok">{sucesso}</div>}

      {aba === 'visao' ? (
        <section className="admin-units-panel">
          <div className="admin-detail-header"><div><h2>Central de cadastros</h2><p>Acesse os cadastros administrativos e operacionais por um único lugar.</p></div></div>
          <div className="permission-groups">
            {abas.slice(1).map(item => (
              <button className="permission-group" style={{ padding: 18, textAlign: 'left', cursor: 'pointer', background: '#fff' }} key={item.id} onClick={() => selecionarAba(item.id)}>
                <strong style={{ display: 'block', color: '#172033' }}>{item.icone} {item.nome}</strong>
                <small style={{ color: '#98a2b3' }}>{dados[item.id as RegistroTabela].length} registros cadastrados</small>
              </button>
            ))}
            <button className="permission-group" style={{ padding: 18, textAlign: 'left', cursor: 'pointer', background: '#fff' }} onClick={() => navigate('/clientes')}><strong>👥 Clientes</strong><small style={{ display: 'block', color: '#98a2b3' }}>Abrir cadastro existente</small></button>
            <button className="permission-group" style={{ padding: 18, textAlign: 'left', cursor: 'pointer', background: '#fff' }} onClick={() => navigate('/catalogo')}><strong>▤ Produtos e Categorias</strong><small style={{ display: 'block', color: '#98a2b3' }}>Abrir catálogo existente</small></button>
          </div>
        </section>
      ) : (
        <section className="admin-units-panel">
          <div className="admin-detail-header">
            <div><h2>{abas.find(item => item.id === aba)?.nome}</h2><p>{dados[aba].length} registros cadastrados</p></div>
            {can('registros.criar') && <button className="btn btn-green" onClick={() => abrir()}>＋ Novo cadastro</button>}
          </div>
          <input className="admin-search" style={{ maxWidth: 380 }} placeholder="Buscar por nome, documento ou contato..." value={busca} onChange={e => setBusca(e.target.value)} />
          {registros.length === 0 ? (
            <div className="admin-empty">▦<strong>{busca ? 'Nenhum resultado encontrado' : 'Nenhum registro cadastrado'}</strong><span>{busca ? 'Revise o termo pesquisado.' : 'Crie o primeiro cadastro para começar.'}</span></div>
          ) : (
            <div className="unit-tree" style={{ maxWidth: 'none', marginTop: 14 }}>
              {registros.map(item => (
                <div className="unit-card" key={item.id}>
                  <span className="unit-icon">{nome(item).charAt(0).toUpperCase()}</span>
                  <span><strong>{nome(item)}</strong><small>{empresaNome(item) || ('email' in item && item.email) || ('descricao' in item && item.descricao) || 'Sem informação complementar'}</small></span>
                  <em className={item.ativo ? 'active' : 'inactive'}>{item.ativo ? 'Ativo' : 'Inativo'}</em>
                  {can('registros.editar') && <button onClick={() => abrir(item)}>Editar</button>}
                  {can('registros.excluir') && <button className="danger" onClick={() => excluir(item)}>Excluir</button>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {modal && aba !== 'visao' && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">{editando ? 'Editar' : 'Novo'} {titulos[aba].toLowerCase()}</span><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <div className="modal-body">
              {(aba === 'empresas' || aba === 'fornecedores') ? (
                <>
                  <Campo label="Razão social *" valor={form.razao_social} onChange={razao_social => setForm({ ...form, razao_social })} />
                  <Campo label="Nome fantasia" valor={form.nome_fantasia} onChange={nome_fantasia => setForm({ ...form, nome_fantasia })} />
                </>
              ) : <Campo label="Nome *" valor={form.nome} onChange={nome => setForm({ ...form, nome })} />}
              {(aba === 'filiais' || aba === 'fornecedores' || aba === 'formas_pagamento' || aba === 'tabelas_preco') && (
                <Selecao label="Empresa (opcional)" valor={form.empresa_id} onChange={empresa_id => setForm({ ...form, empresa_id, filial_id: '' })}>
                  {dados.empresas.map(item => <option key={item.id} value={item.id}>{nome(item)}</option>)}
                </Selecao>
              )}
              {(aba === 'fornecedores' || aba === 'tabelas_preco') && (
                <Selecao label="Filial (opcional)" valor={form.filial_id} onChange={filial_id => setForm({ ...form, filial_id })}>
                  {(dados.filiais as Filial[]).filter(item => !form.empresa_id || item.empresa_id === Number(form.empresa_id)).map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </Selecao>
              )}
              {(aba === 'empresas' || aba === 'filiais') && <Campo label="CNPJ" valor={form.cnpj} onChange={cnpj => setForm({ ...form, cnpj })} />}
              {aba === 'fornecedores' && <Campo label="CPF/CNPJ" valor={form.documento} onChange={documento => setForm({ ...form, documento })} />}
              {(aba === 'empresas' || aba === 'fornecedores') && <>
                <Campo label="E-mail" type="email" valor={form.email} onChange={email => setForm({ ...form, email })} />
                <Campo label="Telefone" valor={form.telefone} onChange={telefone => setForm({ ...form, telefone })} />
              </>}
              {aba === 'filiais' && <Campo label="Endereço" valor={form.endereco} onChange={endereco => setForm({ ...form, endereco })} />}
              {(aba === 'formas_pagamento' || aba === 'tabelas_preco') && <Campo label="Descrição" valor={form.descricao} onChange={descricao => setForm({ ...form, descricao })} />}
              {aba === 'formas_pagamento' && <>
                <Campo label="Tipo" valor={form.tipo} onChange={tipo => setForm({ ...form, tipo })} />
                <Campo label="Prazo (dias)" type="number" valor={form.prazo_dias} onChange={prazo_dias => setForm({ ...form, prazo_dias })} />
                <Campo label="Taxa percentual" type="number" valor={form.taxa_percentual} onChange={taxa_percentual => setForm({ ...form, taxa_percentual })} />
              </>}
              {aba === 'tabelas_preco' && <>
                <Campo label="Início da vigência" type="date" valor={form.data_inicio} onChange={data_inicio => setForm({ ...form, data_inicio })} />
                <Campo label="Fim da vigência" type="date" valor={form.data_fim} onChange={data_fim => setForm({ ...form, data_fim })} />
              </>}
              <label className="admin-switch-label"><input type="checkbox" checked={Boolean(form.ativo)} onChange={e => setForm({ ...form, ativo: e.target.checked })} /> Cadastro ativo</label>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-green" disabled={saving} onClick={salvar}>{saving ? 'Salvando...' : 'Salvar cadastro'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor, onChange, type = 'text' }: { label: string; valor: string; onChange: (valor: string) => void; type?: string }) {
  return <div className="form-group"><label className="form-label">{label}</label><input className="form-control" type={type} value={valor} onChange={e => onChange(e.target.value)} /></div>;
}

function Selecao({ label, valor, onChange, children }: { label: string; valor: string; onChange: (valor: string) => void; children: ReactNode }) {
  return <div className="form-group"><label className="form-label">{label}</label><select className="form-control" value={valor} onChange={e => onChange(e.target.value)}><option value="">Sem vínculo</option>{children}</select></div>;
}

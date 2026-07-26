import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { listarVendas, listarProdutos, listarClientes } from '../lib/db';

const PERIODS = ['Mês Atual', 'Mês passado', 'Hoje', 'Ontem', 'Semana', 'Customizado'];
const COLORS_CATEGORIES = ['#28AAFE', '#38bdf8', '#0284c7', '#2563eb', '#1d4ed8', '#1e40af'];
const COLORS_STATS: Record<string, string> = {
  'pedido': '#28AAFE',
  'orcamento': '#38bdf8',
  'cancelado': '#f87171',
  'finalizado': '#4ade80',
};

function Dashboard() {
  const [period, setPeriod] = useState('Mês Atual');
  const [stats, setStats] = useState({ 
    produtos: 0, 
    clientes: 0, 
    qtdPedidos: 0, 
    totalPedidosRS: 0, 
    qtdOrcamentos: 0, 
    totalOrcamentosRS: 0 
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [dadosCategorias, setDadosCategorias] = useState<any[]>([]);
  const [dadosEstatisticas, setDadosEstatisticas] = useState<any[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const [vendas, produtos, clientes] = await Promise.all([
        listarVendas(),
        listarProdutos(),
        listarClientes()
      ]);

      const pedidos = vendas.filter(v => v.status !== 'orcamento');
      const orcamentos = vendas.filter(v => v.status === 'orcamento');
      
      const totalPedidosRS = pedidos.reduce((acc, v) => acc + Number(v.total), 0);
      const totalOrcamentosRS = orcamentos.reduce((acc, v) => acc + Number(v.total), 0);

      setStats({
        produtos: produtos.length,
        clientes: clientes.length,
        qtdPedidos: pedidos.length,
        totalPedidosRS,
        qtdOrcamentos: orcamentos.length,
        totalOrcamentosRS,
      });

      // 1. Gráfico de Barras (Dias do mês)
      const diasMap: Record<string, { Orçamentos: number; Vendas: number }> = {};
      const hoje = new Date();
      // Preencher últimos 15 dias com zero
      for (let i = 14; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        const label = `${d.getDate().toString().padStart(2, '0')}/${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;
        diasMap[label] = { Orçamentos: 0, Vendas: 0 };
      }

      vendas.forEach(v => {
        const d = new Date(v.created_at);
        const label = `${d.getDate().toString().padStart(2, '0')}/${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;
        if (diasMap[label]) {
          if (v.status === 'orcamento') diasMap[label].Orçamentos += Number(v.total);
          else diasMap[label].Vendas += Number(v.total);
        }
      });
      setChartData(Object.keys(diasMap).map(dia => ({ dia, ...diasMap[dia] })));

      // 2. Gráfico de Pizza (Categorias)
      const catMap: Record<string, number> = {};
      vendas.forEach(v => {
        v.itens_venda?.forEach(item => {
          // Encontrar a categoria do produto deste item
          const prod = produtos.find(p => p.id === item.produto_id);
          const catName = prod?.categorias?.nome || 'SEM CATEGORIA';
          catMap[catName] = (catMap[catName] || 0) + (Number(item.preco_unitario) * Number(item.quantidade));
        });
      });
      const catData = Object.keys(catMap).map(name => ({ name, value: catMap[name] })).sort((a, b) => b.value - a.value);
      setDadosCategorias(catData.length ? catData : [{ name: 'Sem Vendas', value: 1 }]);

      // 3. Gráfico de Estatísticas de Status
      const statusMap: Record<string, number> = {};
      vendas.forEach(v => {
        const s = v.status || 'pedido';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      setDadosEstatisticas([{ name: 'Total', ...statusMap }]);
    }
    carregarDados();
  }, []);

  const kpis = [
    {
      label: 'Total de Pedidos',
      value: String(stats.qtdPedidos),
      sub: `R$ ${stats.totalPedidosRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      barWidth: stats.qtdPedidos > 0 ? 100 : 0,
    },
    {
      label: 'Total de Orçamentos',
      value: String(stats.qtdOrcamentos),
      sub: `R$ ${stats.totalOrcamentosRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      barWidth: stats.qtdOrcamentos > 0 ? 60 : 0,
    },
    {
      label: 'Total de Produtos',
      value: String(stats.produtos),
      sub: 'Cadastrados no sistema',
      barWidth: stats.produtos > 0 ? 100 : 0,
    },
    {
      label: 'Novos clientes cadastrados',
      value: String(stats.clientes),
      sub: 'Total na base',
      barWidth: stats.clientes > 0 ? 100 : 0,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#F8FAFC' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Period tabs + responsável */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="period-tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              className={`period-tab${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select className="form-control" style={{ width: 260, height: 28, fontSize: 11 }}>
            <option>00002 MARIA BEATRIZ DAMÃO DE QUEVORA</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '12px 0 14px' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>{kpi.value}</div>
            {kpi.sub && <div className="kpi-sub">{kpi.sub}</div>}
            {kpi.sub2 && <div className="kpi-sub">{kpi.sub2}</div>}
            <div className="kpi-bar-track">
              <div className="kpi-bar-fill" style={{ width: `${kpi.barWidth}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Resumo de Vendas */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-title">Resumo de Vendas</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={6}>
            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#8e99a4' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#8e99a4' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Orçamentos" fill="#38bdf8" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Vendas" fill="#28AAFE" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Vendas por Categorias */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Vendas por Categorias</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['TOP 10', 'TOP 20', 'TOP 30'].map(t => (
                <button key={t} className="btn btn-outline btn-xs" style={{ fontSize: 10 }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={dadosCategorias}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {dadosCategorias.map((_, index) => (
                    <Cell key={index} fill={COLORS_CATEGORIES[index % COLORS_CATEGORIES.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {dadosCategorias.map((cat, i) => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS_CATEGORIES[i], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)' }}>
                    R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
            TOP 40 categorias
          </div>
        </div>

        {/* Estatísticas em Geral */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estatísticas em Geral</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(COLORS_STATS).map(([key, color]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                  <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: 'inline-block' }} />
                  {key}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dadosEstatisticas} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8e99a4' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8e99a4' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(COLORS_STATS).map(([key, color]) => (
                <Bar key={key} dataKey={key} fill={color} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* AI Assistant button */}
          <button className="ai-btn" style={{ position: 'relative', bottom: 'auto', right: 'auto', display: 'inline-flex', marginTop: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

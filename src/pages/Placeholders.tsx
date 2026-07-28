function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: '20px' }}>
      <h1 className="page-title">{title}</h1>
      <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Esta página está em construção.</p>
    </div>
  );
}

export function Home() { return <Placeholder title="Página Inicial" />; }
export function Negocios() { return <Placeholder title="Negócios" />; }
export function Atividades() { return <Placeholder title="Atividades" />; }
export function AnalisePedidos() { return <Placeholder title="Análise de Pedidos" />; }
export function Consultas() { return <Placeholder title="Consultas" />; }
export function Registros() { return <Placeholder title="Registros" />; }
export function Administracao() { return <Placeholder title="Administração" />; }

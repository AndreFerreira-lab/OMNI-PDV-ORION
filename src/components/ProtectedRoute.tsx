import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 14, color: 'var(--text-muted)' }}>Carregando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { can, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Carregando permissões...</div>;
  if (!can(permission)) {
    return (
      <div className="permission-denied">
        <div className="permission-denied-icon">🔒</div>
        <h1>Acesso não autorizado</h1>
        <p>Seu perfil não possui a permissão necessária para visualizar esta página.</p>
      </div>
    );
  }
  return <>{children}</>;
}

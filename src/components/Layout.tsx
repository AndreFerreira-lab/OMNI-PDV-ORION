import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const navItems = [
  {
    to: '/home',
    label: 'Página Inicial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/analise-credito',
    label: 'Análise de Crédito',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/negocios',
    label: 'Negócios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
  },
  {
    to: '/atividades',
    label: 'Atividades',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    to: '/catalogo',
    label: 'Catálogo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    to: '/vendas',
    label: 'Vendas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
    ),
  },
  {
    to: '/analise-pedidos',
    label: 'Análise de Pedidos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/consultas',
    label: 'Consultas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    to: '/registros',
    label: 'Registros',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    to: '/administracao',
    label: 'Administração',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: 'Config',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
  },
];

import orionLogo from '../orion-logo.jpg';

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'A';
  const userEmail = user?.email ?? 'contato@itzorum.com.br';
  const userName = user?.email?.split('@')[0] ?? 'admin';

  return (
    <div className={`app-layout ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          title={isSidebarExpanded ? 'Recolher menu' : 'Expandir menu'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarExpanded ? (
              <polyline points="15 18 9 12 15 6"/>
            ) : (
              <polyline points="9 18 15 12 9 6"/>
            )}
          </svg>
        </button>

        {/* LOGO AREA */}
        <div className="sidebar-logo-container">
          <img src={orionLogo} alt="Orion Logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">PDV OMNI ORION</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-item${location.pathname.startsWith(item.to) ? ' active' : ''}`}
              title={item.label}
            >
              {item.icon}
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {bottomItems.map(item => (
            <div key={item.label} className="sidebar-item" title={item.label}>
              {item.icon}
              <span className="sidebar-item-label">{item.label}</span>
            </div>
          ))}
          <button
            onClick={handleLogout}
            className="sidebar-item"
            title="Sair"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="sidebar-item-label">Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        {/* TOPBAR */}
        <header className="topbar" style={{ position: 'relative' }}>
          <div className="topbar-left">
            {/* Brazilian flag */}
            <div className="topbar-flag" title="Brasil">🇧🇷</div>

            {/* Icons */}
            <button className="topbar-icon-btn" title="Notificações">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="topbar-badge">1</span>
            </button>

            <button className="topbar-icon-btn" title="Mensagens">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </button>

            <button className="topbar-icon-btn" title="Tarefas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 01-2-2h11"/>
              </svg>
            </button>

            <button className="topbar-icon-btn" title="Menu" onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <button className="topbar-icon-btn" title="Grid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>

          <div 
            className="topbar-right" 
            style={{ cursor: 'pointer', position: 'relative', padding: '4px 8px', borderRadius: 6 }}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 500 }}>PDV Omni Orion | {userName}</span>
            <div className="topbar-avatar">{userInitial}</div>

            {/* DROPDOWN MENU */}
            {isUserMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 260,
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9',
                  padding: '16px 0 8px',
                  zIndex: 1000,
                  color: '#334155'
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: '#f1f5f9', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: '#94a3b8', fontWeight: 600
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      PDV OMNI ORION - Matriz | {userName}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {userEmail}
                    </div>
                  </div>
                </div>

                {/* Lista de Opções */}
                <div style={{ padding: '8px 0', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#ef4444' }}>🏢</span> Mudar de Empresa / Filial
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#3b82f6' }}>👤</span> Gerenciar contas
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#eab308' }}>🛡️</span> Gerenciar delegações de autoridade
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#10b981' }}>🔑</span> Mudar senha
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#ec4899' }}>📝</span> Tentativas de Login
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#8b5cf6' }}>🖼️</span> Mudar a foto do perfil
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#64748b' }}>⚙️</span> Minhas configurações
                  </div>
                  <div className="user-menu-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#475569' }}>
                    <span style={{ color: '#0ea5e9' }}>⚙️</span> Parâmetros do sistema
                  </div>
                </div>

                {/* Footer Sair */}
                <div 
                  style={{
                    padding: '8px 16px 4px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: 12
                  }}
                  onClick={handleLogout}
                >
                  <span>🚪</span> Deslogar
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

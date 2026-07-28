import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { UsuarioSistema } from './types';

interface AuthContextType {
  user: User | null;
  profile: UsuarioSistema | null;
  loading: boolean;
  permissions: Set<string>;
  can: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  permissions: new Set(),
  can: () => false,
  refreshPermissions: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UsuarioSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const loadPermissions = async (currentUser?: User | null) => {
    if (!currentUser) {
      setPermissions(new Set());
      return;
    }
    const { data, error } = await supabase.rpc('get_my_permissions');
    if (error) {
      console.error('Erro ao carregar permissões:', error);
      setPermissions(new Set());
      return;
    }
    setPermissions(new Set((data ?? []).map((item: { codigo: string }) => item.codigo)));
  };

  const refreshPermissions = async () => loadPermissions(user);

  const loadProfile = async (currentUser?: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();
    if (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      setProfile(null);
      return;
    }
    setProfile(data as UsuarioSistema | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      await Promise.all([loadPermissions(currentUser), loadProfile(currentUser)]);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setTimeout(() => {
        void loadPermissions(currentUser);
        void loadProfile(currentUser);
      }, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        permissions,
        can: (permission: string) => permissions.has(permission),
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

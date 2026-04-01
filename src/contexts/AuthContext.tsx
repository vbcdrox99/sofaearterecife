import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  nome_completo: string;
  tipo: 'admin' | 'funcionario';
  role: 'admin' | 'gerente' | 'funcionario';
  store: 'loja_1' | 'loja_2' | 'loja_3' | 'todas';
  sector: 'geral' | 'marcenaria' | 'corte_costura' | 'espuma' | 'bancada' | 'tecido';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  userStore: 'loja_1' | 'loja_2' | 'loja_3' | 'todas' | null;
  selectedStore: 'loja_1' | 'loja_2' | 'loja_3' | 'todas';
  setSelectedStore: (store: 'loja_1' | 'loja_2' | 'loja_3' | 'todas') => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<'loja_1' | 'loja_2' | 'loja_3' | 'todas'>('todas');
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin' || profile?.tipo === 'admin';
  const isGerente = profile?.role === 'gerente';
  const userStore = profile?.store || null;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const profileData = data as unknown as Profile;
      setProfile(profileData);

      if (profileData.role === 'admin' || profileData.tipo === 'admin') {
        setSelectedStore('todas');
      } else {
        setSelectedStore(profileData.store);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  useEffect(() => {
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro no login',
          description: error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao sistema Válleri',
        });
      }

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto,
          }
        }
      });

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message === 'User already registered'
            ? 'Este email já está cadastrado'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Cadastro realizado!',
          description: 'Verifique seu email para confirmar a conta',
        });
      }

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSession(null);

      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado do sistema',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: 'Erro no logout',
        description: 'Ocorreu um erro ao sair do sistema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    isGerente,
    userStore,
    selectedStore,
    setSelectedStore,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
-- 1. Criar novos Tipos (Enums)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'funcionario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_store AS ENUM ('loja_1', 'loja_2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_sector AS ENUM ('geral', 'marcenaria', 'corte_costura', 'espuma', 'bancada', 'tecido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Atualizar a tabela de Perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'funcionario',
ADD COLUMN IF NOT EXISTS store public.app_store NOT NULL DEFAULT 'loja_1',
ADD COLUMN IF NOT EXISTS sector public.app_sector NOT NULL DEFAULT 'geral';

-- 3. Atualizar a tabela de Pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS loja public.app_store NOT NULL DEFAULT 'loja_1';

-- 4. Atualizar usuários específicos para Admin (Vinicius Bruno Costa Dantas)
UPDATE public.profiles 
SET role = 'admin' 
WHERE nome_completo ILIKE 'Vinicius Bruno Costa Dantas';

-- 5. Atualizar função is_admin para usar a nova coluna role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND (role = 'admin' OR tipo = 'admin')
  );
$$;

-- 6. Novas Políticas RLS (Row Level Security)

-- Pedidos: Admin vê tudo
DROP POLICY IF EXISTS "admin_view_all_pedidos_v2" ON public.pedidos;
CREATE POLICY "admin_view_all_pedidos_v2" ON public.pedidos
FOR ALL
USING (public.is_admin(auth.uid()));

-- Pedidos: Funcionários/Gerentes veem apenas da sua loja
DROP POLICY IF EXISTS "staff_view_store_pedidos" ON public.pedidos;
CREATE POLICY "staff_view_store_pedidos" ON public.pedidos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('gerente', 'funcionario') 
    AND store = public.pedidos.loja
  )
);

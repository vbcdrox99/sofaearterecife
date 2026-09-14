-- 1. Adicionar coluna stores na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stores text[];

-- 2. Preencher registros existentes
UPDATE public.profiles
SET stores = CASE
  WHEN store = 'todas' THEN ARRAY['loja_1', 'loja_2', 'loja_3']
  WHEN store = 'loja_1' THEN ARRAY['loja_1']
  WHEN store = 'loja_2' THEN ARRAY['loja_2']
  WHEN store = 'loja_3' THEN ARRAY['loja_3']
  ELSE ARRAY['loja_1']
END
WHERE stores IS NULL OR cardinality(stores) = 0;

-- 3. Permitir que Administradores atualizem qualquer perfil (para editar lojas e funções)
DROP POLICY IF EXISTS "Admins podem atualizar qualquer perfil" ON public.profiles;
CREATE POLICY "Admins podem atualizar qualquer perfil" ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- 4. Atualizar política RLS em pedidos para considerar a coluna stores
DROP POLICY IF EXISTS "staff_view_store_pedidos" ON public.pedidos;
CREATE POLICY "staff_view_store_pedidos" ON public.pedidos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('gerente', 'funcionario') 
    AND (
      profiles.store = 'todas'::public.app_store
      OR 'todas' = ANY(COALESCE(profiles.stores, ARRAY[]::text[]))
      OR public.pedidos.loja::text = ANY(COALESCE(profiles.stores, ARRAY[profiles.store::text]))
      OR profiles.store = public.pedidos.loja
    )
  )
);

-- 5. Atualizar trigger handle_new_user para considerar stores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_stores jsonb;
  stores_arr text[];
  first_store text;
BEGIN
  raw_stores := new.raw_user_meta_data -> 'stores';
  IF raw_stores IS NOT NULL AND jsonb_typeof(raw_stores) = 'array' THEN
    SELECT array_agg(x::text) INTO stores_arr FROM jsonb_array_elements_text(raw_stores) x;
  ELSE
    stores_arr := ARRAY[COALESCE(new.raw_user_meta_data ->> 'store', 'loja_1')];
  END IF;

  first_store := COALESCE(stores_arr[1], 'loja_1');
  IF 'todas' = ANY(stores_arr) OR (cardinality(stores_arr) = 3) THEN
    first_store := 'todas';
  END IF;

  INSERT INTO public.profiles (user_id, nome_completo, email, tipo, role, store, stores, sector)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'nome_completo', new.raw_user_meta_data ->> 'nome', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'tipo')::public.tipo_usuario, 'funcionario'::public.tipo_usuario),
    COALESCE((new.raw_user_meta_data ->> 'role')::public.app_role, 'funcionario'::public.app_role),
    COALESCE(first_store::public.app_store, 'loja_1'::public.app_store),
    stores_arr,
    COALESCE((new.raw_user_meta_data ->> 'sector')::public.app_sector, 'geral'::public.app_sector)
  )
  ON CONFLICT (id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    role = EXCLUDED.role,
    store = EXCLUDED.store,
    stores = EXCLUDED.stores;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

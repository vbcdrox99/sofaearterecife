-- Criar enum para tipos de usuário
CREATE TYPE public.tipo_usuario AS ENUM ('admin', 'funcionario');

-- Criar enum para status dos pedidos
CREATE TYPE public.status_pedido AS ENUM ('aguardando_producao', 'em_producao', 'finalizado', 'em_entrega', 'entregue');

-- Criar enum para etapas da produção
CREATE TYPE public.etapa_producao AS ENUM ('estrutura', 'estofamento', 'acabamento');

-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  tipo tipo_usuario NOT NULL DEFAULT 'funcionario',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de materiais para estoque
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 0,
  unidade_medida TEXT NOT NULL DEFAULT 'unidade',
  preco_unitario DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido SERIAL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  cliente_endereco TEXT,
  descricao_sofa TEXT NOT NULL,
  observacoes TEXT,
  valor_total DECIMAL(10,2),
  status status_pedido NOT NULL DEFAULT 'aguardando_producao',
  data_previsao_entrega DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de materiais usados nos pedidos
CREATE TABLE public.pedido_materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  quantidade_necessaria INTEGER NOT NULL,
  quantidade_reservada INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de etapas de produção
CREATE TABLE public.producao_etapas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  etapa etapa_producao NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  responsavel_id UUID REFERENCES auth.users(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pedido_id, etapa)
);

-- Criar tabela de anexos/imagens
CREATE TABLE public.pedido_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  descricao TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_anexos ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND tipo = 'admin'
  )
$$;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os perfis" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para materiais
CREATE POLICY "Usuários autenticados podem ver materiais" 
ON public.materiais 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Apenas admins podem modificar materiais" 
ON public.materiais 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Políticas RLS para pedidos
CREATE POLICY "Usuários autenticados podem ver pedidos" 
ON public.pedidos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar pedidos" 
ON public.pedidos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar pedidos" 
ON public.pedidos 
FOR UPDATE 
TO authenticated 
USING (true);

-- Políticas RLS para pedido_materiais
CREATE POLICY "Usuários autenticados podem ver materiais dos pedidos" 
ON public.pedido_materiais 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar materiais dos pedidos" 
ON public.pedido_materiais 
FOR ALL 
TO authenticated 
USING (true);

-- Políticas RLS para producao_etapas
CREATE POLICY "Usuários autenticados podem ver etapas de produção" 
ON public.producao_etapas 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem atualizar etapas de produção" 
ON public.producao_etapas 
FOR ALL 
TO authenticated 
USING (true);

-- Políticas RLS para pedido_anexos
CREATE POLICY "Usuários autenticados podem ver anexos" 
ON public.pedido_anexos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários autenticados podem criar anexos" 
ON public.pedido_anexos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploaded_by);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, tipo)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'nome_completo', new.email), 
    'funcionario'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_producao_etapas_updated_at BEFORE UPDATE ON public.producao_etapas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns materiais de exemplo
INSERT INTO public.materiais (nome, descricao, quantidade_atual, quantidade_minima, unidade_medida, preco_unitario) VALUES
('Madeira MDF 18mm', 'Madeira MDF para estrutura dos sofás', 50, 10, 'chapa', 45.00),
('Espuma D33', 'Espuma densidade 33 para assento', 20, 5, 'bloco', 85.00),
('Tecido Couro Sintético', 'Tecido couro sintético cor preta', 100, 20, 'metro', 35.00),
('Mola Ensacada', 'Mola ensacada para conforto', 200, 50, 'unidade', 12.00),
('Parafuso 6x40mm', 'Parafuso para fixação da estrutura', 500, 100, 'unidade', 0.50);
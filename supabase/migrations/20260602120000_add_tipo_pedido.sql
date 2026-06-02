-- Adicionar coluna tipo_pedido na tabela de pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS tipo_pedido TEXT NOT NULL DEFAULT 'pedido';

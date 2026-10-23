-- Migration para adicionar o campo profundidade_aberto em pedido_itens e pedidos
ALTER TABLE public.pedido_itens
ADD COLUMN IF NOT EXISTS profundidade_aberto TEXT;

COMMENT ON COLUMN public.pedido_itens.profundidade_aberto IS 'Profundidade do sofá quando aberto (medida extra/opcional)';

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS profundidade_aberto TEXT;

COMMENT ON COLUMN public.pedidos.profundidade_aberto IS 'Profundidade do sofá quando aberto (medida extra/opcional)';

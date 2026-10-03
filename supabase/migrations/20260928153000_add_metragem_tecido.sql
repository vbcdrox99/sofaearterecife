-- Migration para adicionar o campo metragem_tecido em pedido_itens
ALTER TABLE public.pedido_itens
ADD COLUMN IF NOT EXISTS metragem_tecido TEXT;

COMMENT ON COLUMN public.pedido_itens.metragem_tecido IS 'Metragem ou quantidade de tecido necessária para o item (ex: 1,20 m, 12 metros)';

-- Migração: Sequências de Pedidos por Loja e Ano
-- 1. Tamarineira (loja_3): sequência própria anual (1, 2, 3...)
-- 2. Aragão (loja_1) e Boa Viagem (loja_2): sequência unificada/compartilhada anual (1, 2, 3...)
-- 3. Reinício a cada virada de ano

-- 1. Remover a restrição de unicidade global de numero_pedido para permitir repetição entre grupos de lojas e entre anos diferentes
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_numero_pedido_key;

-- 2. Criar índice para otimizar consultas por loja, data de criação e número do pedido
CREATE INDEX IF NOT EXISTS idx_pedidos_loja_created_at_numero 
ON public.pedidos (loja, created_at, numero_pedido);

-- 3. Atualizar ou criar a função RPC get_next_order_number no banco
CREATE OR REPLACE FUNCTION public.get_next_order_number(p_loja text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number integer;
  v_current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_start_date timestamptz := make_timestamptz(v_current_year, 1, 1, 0, 0, 0, 'UTC');
  v_end_date timestamptz := make_timestamptz(v_current_year, 12, 31, 23, 59, 59.999, 'UTC');
BEGIN
  IF p_loja = 'loja_3' THEN
    -- Tamarineira: sequência própria anual
    SELECT COALESCE(MAX(numero_pedido), 0) + 1
    INTO v_next_number
    FROM public.pedidos
    WHERE loja = 'loja_3'
      AND created_at >= v_start_date
      AND created_at <= v_end_date
      AND numero_pedido < 1000000;
  ELSE
    -- Aragão (loja_1) e Boa Viagem (loja_2): sequência compartilhada anual
    SELECT COALESCE(MAX(numero_pedido), 0) + 1
    INTO v_next_number
    FROM public.pedidos
    WHERE loja IN ('loja_1', 'loja_2')
      AND created_at >= v_start_date
      AND created_at <= v_end_date
      AND numero_pedido < 1000000;
  END IF;

  RETURN v_next_number;
END;
$$;

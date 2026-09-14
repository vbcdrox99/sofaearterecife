-- 1. Helper: is_admin() sem parâmetros para uso direto em RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- 2. Tabela de logs de auditoria de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,
    numero_pedido BIGINT,
    loja TEXT,
    cliente_nome TEXT,
    acao TEXT NOT NULL CHECK (acao IN ('criado', 'editado', 'excluido')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_nome TEXT,
    user_role TEXT,
    alteracoes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_pedidos_logs_pedido_id ON public.pedidos_logs(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_logs_numero_pedido ON public.pedidos_logs(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_logs_loja ON public.pedidos_logs(loja);
CREATE INDEX IF NOT EXISTS idx_pedidos_logs_acao ON public.pedidos_logs(acao);
CREATE INDEX IF NOT EXISTS idx_pedidos_logs_created_at ON public.pedidos_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.pedidos_logs ENABLE ROW LEVEL SECURITY;

-- Política de leitura: apenas administradores
DROP POLICY IF EXISTS "Apenas admins podem visualizar logs" ON public.pedidos_logs;
CREATE POLICY "Apenas admins podem visualizar logs"
ON public.pedidos_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Função de auditoria acionada por trigger
CREATE OR REPLACE FUNCTION public.handle_pedido_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_nome TEXT;
    v_user_role TEXT;
    v_diff JSONB := '{}'::jsonb;
    v_loja TEXT;
    v_num BIGINT;
    v_cliente TEXT;
BEGIN
    -- Obter o ID do usuário da sessão atual
    v_user_id := auth.uid();

    -- Buscar informações do perfil do usuário
    IF v_user_id IS NOT NULL THEN
        SELECT nome_completo, role::text INTO v_user_nome, v_user_role
        FROM public.profiles
        WHERE user_id = v_user_id
        LIMIT 1;
    END IF;

    -- Se não encontrar ou for nulo (ex: batch/sistema)
    IF v_user_nome IS NULL THEN
        IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
            v_user_id := NEW.created_by;
            SELECT nome_completo, role::text INTO v_user_nome, v_user_role
            FROM public.profiles
            WHERE user_id = v_user_id
            LIMIT 1;
        END IF;
        IF v_user_nome IS NULL THEN
            v_user_nome := 'Sistema';
            v_user_role := 'sistema';
        END IF;
    END IF;

    -- Operação INSERT
    IF TG_OP = 'INSERT' THEN
        v_loja := NEW.loja::text;
        v_num := NEW.numero_pedido;
        v_cliente := NEW.cliente_nome;

        v_diff := jsonb_build_object(
            'valor_total', NEW.valor_total,
            'cliente_nome', NEW.cliente_nome,
            'status', NEW.status::text,
            'data_previsao_entrega', NEW.data_previsao_entrega,
            'forma_pagamento', NEW.forma_pagamento,
            'descricao_sofa', NEW.descricao_sofa
        );

        INSERT INTO public.pedidos_logs (
            pedido_id,
            numero_pedido,
            loja,
            cliente_nome,
            acao,
            user_id,
            user_nome,
            user_role,
            alteracoes
        ) VALUES (
            NEW.id,
            v_num,
            v_loja,
            v_cliente,
            'criado',
            v_user_id,
            v_user_nome,
            v_user_role,
            v_diff
        );

        RETURN NEW;

    -- Operação UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        v_loja := NEW.loja::text;
        v_num := NEW.numero_pedido;
        v_cliente := NEW.cliente_nome;

        -- Comparar campos de interesse
        IF OLD.valor_total IS DISTINCT FROM NEW.valor_total THEN
            v_diff := jsonb_set(v_diff, '{valor_total}', jsonb_build_object('de', OLD.valor_total, 'para', NEW.valor_total));
        END IF;

        IF OLD.cliente_nome IS DISTINCT FROM NEW.cliente_nome THEN
            v_diff := jsonb_set(v_diff, '{cliente_nome}', jsonb_build_object('de', OLD.cliente_nome, 'para', NEW.cliente_nome));
        END IF;

        IF OLD.cliente_telefone IS DISTINCT FROM NEW.cliente_telefone THEN
            v_diff := jsonb_set(v_diff, '{cliente_telefone}', jsonb_build_object('de', OLD.cliente_telefone, 'para', NEW.cliente_telefone));
        END IF;

        IF OLD.cliente_endereco IS DISTINCT FROM NEW.cliente_endereco THEN
            v_diff := jsonb_set(v_diff, '{cliente_endereco}', jsonb_build_object('de', OLD.cliente_endereco, 'para', NEW.cliente_endereco));
        END IF;

        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_diff := jsonb_set(v_diff, '{status}', jsonb_build_object('de', OLD.status::text, 'para', NEW.status::text));
        END IF;

        IF OLD.data_previsao_entrega IS DISTINCT FROM NEW.data_previsao_entrega THEN
            v_diff := jsonb_set(v_diff, '{data_previsao_entrega}', jsonb_build_object('de', OLD.data_previsao_entrega, 'para', NEW.data_previsao_entrega));
        END IF;

        IF OLD.observacoes IS DISTINCT FROM NEW.observacoes THEN
            v_diff := jsonb_set(v_diff, '{observacoes}', jsonb_build_object('de', OLD.observacoes, 'para', NEW.observacoes));
        END IF;

        IF OLD.frete IS DISTINCT FROM NEW.frete THEN
            v_diff := jsonb_set(v_diff, '{frete}', jsonb_build_object('de', OLD.frete, 'para', NEW.frete));
        END IF;

        IF OLD.forma_pagamento IS DISTINCT FROM NEW.forma_pagamento THEN
            v_diff := jsonb_set(v_diff, '{forma_pagamento}', jsonb_build_object('de', OLD.forma_pagamento, 'para', NEW.forma_pagamento));
        END IF;

        IF OLD.desconto_valor IS DISTINCT FROM NEW.desconto_valor THEN
            v_diff := jsonb_set(v_diff, '{desconto_valor}', jsonb_build_object('de', OLD.desconto_valor, 'para', NEW.desconto_valor));
        END IF;

        IF OLD.desconto_tipo IS DISTINCT FROM NEW.desconto_tipo THEN
            v_diff := jsonb_set(v_diff, '{desconto_tipo}', jsonb_build_object('de', OLD.desconto_tipo, 'para', NEW.desconto_tipo));
        END IF;

        IF OLD.loja IS DISTINCT FROM NEW.loja THEN
            v_diff := jsonb_set(v_diff, '{loja}', jsonb_build_object('de', OLD.loja::text, 'para', NEW.loja::text));
        END IF;

        IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
            v_diff := jsonb_set(v_diff, '{prioridade}', jsonb_build_object('de', OLD.prioridade, 'para', NEW.prioridade));
        END IF;

        IF OLD.descricao_sofa IS DISTINCT FROM NEW.descricao_sofa THEN
            v_diff := jsonb_set(v_diff, '{descricao_sofa}', jsonb_build_object('de', OLD.descricao_sofa, 'para', NEW.descricao_sofa));
        END IF;

        IF OLD.tipo_pedido IS DISTINCT FROM NEW.tipo_pedido THEN
            v_diff := jsonb_set(v_diff, '{tipo_pedido}', jsonb_build_object('de', OLD.tipo_pedido, 'para', NEW.tipo_pedido));
        END IF;

        -- Só registra o log se houve alteração em algum campo relevante
        IF v_diff <> '{}'::jsonb THEN
            INSERT INTO public.pedidos_logs (
                pedido_id,
                numero_pedido,
                loja,
                cliente_nome,
                acao,
                user_id,
                user_nome,
                user_role,
                alteracoes
            ) VALUES (
                NEW.id,
                v_num,
                v_loja,
                v_cliente,
                'editado',
                v_user_id,
                v_user_nome,
                v_user_role,
                v_diff
            );
        END IF;

        RETURN NEW;

    -- Operação DELETE
    ELSIF TG_OP = 'DELETE' THEN
        v_loja := OLD.loja::text;
        v_num := OLD.numero_pedido;
        v_cliente := OLD.cliente_nome;

        v_diff := jsonb_build_object(
            'numero_pedido', OLD.numero_pedido,
            'cliente_nome', OLD.cliente_nome,
            'valor_total', OLD.valor_total,
            'loja', OLD.loja::text
        );

        INSERT INTO public.pedidos_logs (
            pedido_id,
            numero_pedido,
            loja,
            cliente_nome,
            acao,
            user_id,
            user_nome,
            user_role,
            alteracoes
        ) VALUES (
            OLD.id,
            v_num,
            v_loja,
            v_cliente,
            'excluido',
            v_user_id,
            v_user_nome,
            v_user_role,
            v_diff
        );

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

-- Criar o trigger na tabela pedidos
DROP TRIGGER IF EXISTS trg_audit_pedidos ON public.pedidos;
CREATE TRIGGER trg_audit_pedidos
AFTER INSERT OR UPDATE OR DELETE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.handle_pedido_audit();

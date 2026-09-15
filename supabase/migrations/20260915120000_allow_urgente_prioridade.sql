-- Migração para atualizar a constraint de prioridade da tabela pedidos
-- Permite os valores: 'baixa', 'media', 'alta', 'urgente'

ALTER TABLE public.pedidos 
  DROP CONSTRAINT IF EXISTS pedidos_prioridade_check;

ALTER TABLE public.pedidos 
  ADD CONSTRAINT pedidos_prioridade_check 
  CHECK (prioridade IS NULL OR prioridade IN ('baixa', 'media', 'alta', 'urgente'));

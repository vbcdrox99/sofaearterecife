# Controle de Acesso e Separação de Lojas

Este documento descreve a implementação do sistema de Controle de Acesso Baseado em Função (RBAC) e a separação lógica de lojas no sistema Sofá e Arte Dashboard.

## Visão Geral

O sistema foi atualizado para suportar múltiplas lojas (atualmente Loja 1 e Loja 2) e diferentes níveis de acesso de usuários. A estrutura permite que o Administrador gerencie todas as lojas, enquanto Gerentes e Funcionários têm acesso restrito.

## Níveis de Acesso (Roles)

O sistema define três níveis de acesso principais:

1.  **Administrador (Admin)**
    *   **Acesso:** Total a todas as lojas.
    *   **Visibilidade:** Pode ver e gerenciar pedidos e produção de TODAS as lojas.
    *   **Funcionalidade Extra:** Possui um seletor de loja na barra lateral (Sidebar) para alternar a visualização entre "Todas", "Loja 1" e "Loja 2".
    *   **Perfil:** Definido com `role: 'admin'`.

2.  **Gerente**
    *   **Acesso:** Restrito a uma loja específica (ex: Loja 1).
    *   **Visibilidade:** Apenas pedidos e produção da sua loja vinculada.
    *   **Perfil:** Definido com `role: 'gerente'` e `store: 'loja_1'` (ou 'loja_2').

3.  **Funcionário**
    *   **Acesso:** Restrito a uma loja e a um setor específico (ex: Marcenaria da Loja 1).
    *   **Visibilidade:** Apenas pedidos e produção da sua loja. (Futuramente pode ser restringido por setor).
    *   **Perfil:** Definido com `role: 'funcionario'`, `store: 'loja_1'` e `sector: 'marcenaria'` (ou outro setor).

## Estrutura de Dados

### Tabelas e Enums

Novos tipos enumerados (Enums) foram criados no banco de dados:
*   `app_role`: 'admin', 'gerente', 'funcionario'
*   `app_store`: 'loja_1', 'loja_2'
*   `app_sector`: 'geral', 'marcenaria', 'corte_costura', 'espuma', 'bancada', 'tecido'

A tabela `profiles` foi estendida para incluir:
*   `role`: app_role
*   `store`: app_store
*   `sector`: app_sector

A tabela `pedidos` possui o campo `loja` para identificar a origem do pedido.

### Políticas de Segurança (RLS)

O Row Level Security (RLS) do Supabase garante que:
*   Admins podem ver todos os registros.
*   Gerentes e Funcionários só podem ver registros onde `pedidos.loja` corresponde ao `profiles.store` do usuário logado.

## Implementação Frontend

### AuthContext
O contexto de autenticação (`src/contexts/AuthContext.tsx`) gerencia o estado do usuário logado, incluindo suas permissões e a loja selecionada.
*   `isAdmin`: Booleano, verdadeiro se o usuário for admin.
*   `selectedStore`: Estado que controla qual loja está sendo visualizada. Para Admins, pode ser alterado. Para outros, é fixo na loja do usuário.

### Seletor de Loja
Localizado na `Sidebar`, permite que administradores filtrem os dados do sistema globalmente. Ao mudar a loja no seletor, todas as telas (Dashboard, Produção, Pedidos) atualizam automaticamente.

### Filtragem de Dados
Os serviços e hooks foram atualizados para respeitar o `selectedStore`:
*   `usePedidos`: Filtra a query de pedidos baseado na loja selecionada.
*   `producaoService`: Filtra itens de produção fazendo join com a tabela de pedidos e verificando o campo `loja`.

## Como Adicionar Novos Usuários

Para adicionar um novo usuário com permissões específicas, você deve criar o usuário no Supabase Auth e depois atualizar a entrada correspondente na tabela `profiles` com os valores corretos de `role`, `store` e `sector`.

Exemplo SQL para promover um usuário a Admin:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'email@usuario.com';
```

Exemplo SQL para definir um Gerente da Loja 2:
```sql
UPDATE public.profiles 
SET role = 'gerente', store = 'loja_2' 
WHERE email = 'gerente@loja2.com';
```

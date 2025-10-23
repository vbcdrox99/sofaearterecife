# Branding — Sofá & Arte Home Decor

Logo oficial
- Caminho recomendado: `/public/logo-sofaearte-oficial.png`
- Formato preferido: PNG com fundo transparente (1920px de largura ou maior)
- Uso: documentos PDF, páginas de impressão, cabeçalhos institucionais.

Onde usar
- PDF de pedido (gerador em `src/hooks/usePDFGenerator.ts`) — já configurado para carregar a logo do caminho acima.
- Cabeçalhos de relatórios e orçamentos.
- Páginas de impressão via `react-to-print`.
- Seções institucionais do app (ex.: navbar/footer) quando aplicável.

Boas práticas
- Altura de exibição no PDF: ~56px (ajuste conforme necessidade).
- Manter proporções originais (usar `width:auto`).
- Evitar redimensionar a imagem no arquivo; prefira controlar via estilo.
- Hospedar no mesmo domínio (pasta `public/`) para evitar bloqueios de CORS em captura via `html2canvas`.

Passos para atualizar
1) Coloque o arquivo da logo oficial em `public/logo-sofaearte-oficial.png`.
2) Gere um PDF de pedido e valide o cabeçalho.
3) Caso altere o nome/rota do arquivo, atualize a referência em `usePDFGenerator.ts`.
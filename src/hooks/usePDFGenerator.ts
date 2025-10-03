import { useCallback, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

interface Pedido {
  id: string;
  numero_pedido: string;
  tipo: string;
  data_entrega: string;
  espuma: string;
  tecido: string;
  tipo_pe: string;
  braco: string;
  status_producao: string;
  cliente_nome: string;
}

export const usePDFGenerator = () => {
  // Modo captura por imagem (html2canvas + jsPDF) — permanece disponível como fallback
  const generatePDF = useCallback(async (pedidos: Pedido[], titulo: string) => {
    try {
      // Encontrar a tabela atual na tela
      const tableElement = document.querySelector('[data-table="pedidos-table"]') as HTMLElement;
      
      if (!tableElement) {
        throw new Error('Tabela não encontrada na tela');
      }

      // Criar um elemento temporário para captura otimizada
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = 'auto';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';

      // Ícone por área com fallback por label no título (— Área: ...)
      const getAreaEmojiFromTitle = (t: string) => {
        const match = t.match(/Área:\s(.+)$/);
        const label = match?.[1]?.toLowerCase() || '';
        if (label.includes('geral/todos')) return '📋';
        if (label.includes('marcenaria')) return '🔨';
        if (label.includes('corte') && label.includes('costura')) return '✂️';
        if (label.includes('espuma')) return '📦';
        if (label.includes('bancada')) return '🔧';
        if (label.includes('tecido')) return '👕';
        return '📋';
      };

      const getAreaInfoFromTitle = (t: string) => {
        const match = t.match(/Área:\s(.+)$/);
        const label = (match?.[1] || 'GERAL/TODOS').toLowerCase();
        if (label.includes('marcenaria')) return { label: 'Marcenaria', emoji: '🔨', color: '#8B4513' };
        if (label.includes('corte') && label.includes('costura')) return { label: 'Corte Costura', emoji: '✂️', color: '#D94646' };
        if (label.includes('espuma')) return { label: 'Espuma', emoji: '📦', color: '#14B8A6' };
        if (label.includes('bancada')) return { label: 'Bancada', emoji: '🔧', color: '#6B7280' };
        if (label.includes('tecido')) return { label: 'Tecido', emoji: '👕', color: '#8B5CF6' };
        return { label: 'GERAL/TODOS', emoji: '📋', color: '#334155' };
      };

      const areaInfo = getAreaInfoFromTitle(titulo);

      // Cabeçalho com ícone por área e fontes em dobro (título/subtítulo/data)
      const header = `
        <div style="margin-bottom: 24px;">
          <div style="display:flex; align-items:center; justify-content:center; gap:12px; background-color:${areaInfo.color}; color:#fff; padding:14px 16px; border-radius:10px;">
            <span style="font-size: 56px; line-height: 1;">${areaInfo.emoji}</span>
            <div style="text-align:center;">
              <div style="font-size: 36px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase;">Área de Produção: ${areaInfo.label}</div>
              <div style="font-size: 20px; opacity: .95;">${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 14px; border-bottom: 2px solid #333; padding-bottom: 12px;">
            <h1 style="color: #8B4513; margin: 0; font-size: 56px; font-weight: bold;">Sofá & Arte Recife</h1>
            <h2 style="color: #333; margin: 8px 0; font-size: 40px;">${titulo}</h2>
          </div>
        </div>
      `;

      // Clonar a tabela atual e otimizar para impressão
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;
      
      // Aplicar estilos para impressão horizontal
      clonedTable.style.width = '100%';
      clonedTable.style.fontSize = '10px';
      clonedTable.style.borderCollapse = 'collapse';
      
      // Otimizar células da tabela
       const cells = clonedTable.querySelectorAll('td, th');
       cells.forEach((cell: any, index: number) => {
         cell.style.padding = '8px 6px';
         cell.style.border = '1px solid #ddd';
         cell.style.fontSize = '9px';
         cell.style.lineHeight = '1.3';
         cell.style.verticalAlign = 'top';
         cell.style.wordWrap = 'break-word';
         cell.style.whiteSpace = 'normal';
         cell.style.overflow = 'visible';
         
         // Definir larguras específicas para cada coluna
         const columnIndex = index % 12; // Assumindo 12 colunas
         switch(columnIndex) {
           case 0: // Nº Pedido
             cell.style.minWidth = '60px';
             cell.style.maxWidth = '80px';
             break;
           case 1: // Tipo
             cell.style.minWidth = '80px';
             cell.style.maxWidth = '120px';
             break;
           case 2: // Entrega
             cell.style.minWidth = '70px';
             cell.style.maxWidth = '90px';
             break;
           case 3: // Espuma
             cell.style.minWidth = '50px';
             cell.style.maxWidth = '70px';
             break;
           case 4: // Tecido
             cell.style.minWidth = '100px';
             cell.style.maxWidth = '150px';
             break;
           case 5: // Tipo Pé
             cell.style.minWidth = '80px';
             cell.style.maxWidth = '120px';
             break;
           case 6: // Braço
             cell.style.minWidth = '60px';
             cell.style.maxWidth = '100px';
             break;
           case 7: // Status
             cell.style.minWidth = '80px';
             cell.style.maxWidth = '120px';
             break;
           case 8: // Cliente
             cell.style.minWidth = '100px';
             cell.style.maxWidth = '150px';
             break;
           default:
             cell.style.minWidth = '60px';
             cell.style.maxWidth = '100px';
         }
       });

      // Remover elementos desnecessários (botões de ação, etc.)
      const actionButtons = clonedTable.querySelectorAll('button, .action-buttons, [data-action]');
      actionButtons.forEach(button => button.remove());

      // Rodapé compacto
      const footer = `
        <div style="margin-top: 15px; text-align: center; border-top: 1px solid #ddd; padding-top: 10px;">
          <p style="color: #666; margin: 0; font-size: 10px;">
            Total de pedidos: ${pedidos.length} | Sistema Sofá & Arte Recife
          </p>
        </div>
      `;

      tempDiv.innerHTML = header + clonedTable.outerHTML + footer;
      document.body.appendChild(tempDiv);

      // Capturar como imagem com alta qualidade
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      document.body.removeChild(tempDiv);

      // Criar PDF em formato A4 HORIZONTAL (paisagem)
      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (horizontal)
      const pageWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      
      const imgWidth = pageWidth - 20; // Margem de 10mm de cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Margem superior

      // Adicionar primeira página
      if (imgHeight <= pageHeight - 20) {
        // Se couber em uma página, centralizar verticalmente
        const yPosition = (pageHeight - imgHeight) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, yPosition, imgWidth, imgHeight);
      } else {
        // Se não couber, usar paginação
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);

        // Adicionar páginas adicionais se necessário
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - 20);
        }
      }

      // Salvar o PDF
      const fileName = `relatorio-pedidos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar o PDF. Tente novamente.');
    }
  }, []);

  // Modo impressão nativa (react-to-print) — recomendado para manter layout e evitar cortes
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<string>('Relatório de Pedidos');

  // Estilos de página aplicados somente na impressão
  const pageStyle = `
    @page { size: A4 landscape; margin: 10mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-hide { display: none !important; }
      [data-action], .action-buttons { display: none !important; }
      .print-table { width: 100%; border-collapse: collapse; font-size: 8px !important; }
      .print-table * { font-size: inherit !important; }
      /* Neutralizar truncamento/ellipsis na impressão */
      .print-table .truncate { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
      /* Conteúdo mais compacto */
      .print-table .px-4 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
      .print-table .py-2 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
      .print-table .gap-4 { gap: 0.25rem !important; }
      .print-table .text-sm { font-size: 0.6rem !important; } /* ~9.6px */
      .print-table .text-xs { font-size: 0.55rem !important; } /* ~8.8px */
      /* Remover largura mínima para caber melhor */
      .print-table .min-w-\\[1200px\\] { min-width: auto !important; }
      /* Quebra natural e alinhamento superior */
      .print-table div { white-space: normal !important; word-break: break-word !important; vertical-align: top !important; }
      /* Evitar quebra de linhas dentro de um item */
      .print-table tr { page-break-inside: avoid; }
    }
  `;

  const doPrint = useReactToPrint({
    // Compat: novas versões usam contentRef; mantemos content como fallback
    content: () => printRef.current,
    // @ts-expect-error contentRef pode não existir em tipos da versão instalada
    contentRef: printRef,
    documentTitle: titleRef.current,
    pageStyle,
    onBeforeGetContent: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
  });

  const printCurrentView = (title?: string) => {
    if (title) titleRef.current = title;
    doPrint?.();
  };

  return { generatePDF, printRef, printCurrentView, isPrinting };
};
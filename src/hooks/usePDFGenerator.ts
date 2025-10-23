import { useCallback, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';

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
        height: tempDiv.scrollHeight,
        logging: false,
        imageTimeout: 0
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

  // PDF por Pedido (busca Supabase e gera layout multi-seções)
  const generatePedidoPDF = useCallback(async (pedidoId: string) => {
    try {
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      if (pedidoError) throw pedidoError;

      const { data: itens, error: itensError } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('sequencia', { ascending: true });
      if (itensError) throw itensError;

      const { data: anexos, error: anexosError } = await supabase
        .from('pedido_anexos')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });
      if (anexosError) throw anexosError;

      const currency = (v?: number | null) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const safe = (s?: string | null) => s || '—';
      const numero = pedido.numero_pedido;
      const anoAtual = new Date().getFullYear();

      // Mapear fotos por item ANTES de montar produtosHTML
      const fotosPorItem: Record<string, any[]> = {};
      (anexos || []).forEach((a: any) => {
        if (a.descricao === 'foto_pedido') {
          const key = a.pedido_item_id || 'sem_item';
          (fotosPorItem[key] ||= []).push(a);
        }
      });
      const usedPhotoIds: string[] = [];
      
      const produtosHTML = (Array.isArray(itens) && itens.length > 0 ? itens : [{
        descricao: pedido.descricao_sofa,
        tipo_sofa: pedido.tipo_sofa,
        tipo_servico: pedido.tipo_servico,
        cor: pedido.cor,
        dimensoes: pedido.dimensoes,
        espuma: pedido.espuma,
        tecido: pedido.tecido,
        braco: pedido.braco,
        tipo_pe: pedido.tipo_pe,
        preco_unitario: pedido.preco_unitario || pedido.valor_total || 0,
        observacoes: pedido.observacoes,
      }]).map((it: any, idx: number) => {
        const descricao = [safe(it.tipo_sofa), safe(it.tipo_servico)].filter(Boolean).join(' - ');
        const detalhes = [
          it.cor ? `Cor: ${it.cor}` : '',
          it.tecido ? `Tecido: ${it.tecido}` : '',
          it.espuma ? `Espuma: ${it.espuma}` : '',
          it.braco ? `Braço: ${it.braco}` : '',
          it.tipo_pe ? `Tipo Pé: ${it.tipo_pe}` : '',
          it.dimensoes ? `Dimensões: ${it.dimensoes}` : ''
        ].filter(Boolean).join(' • ');
        const preco = currency(it.preco_unitario || 0);
        const total = currency((it.preco_unitario || 0) * 1);

        const fotosItem = it.id ? (fotosPorItem[it.id] || []) : (idx === 0 ? (fotosPorItem['sem_item'] || []) : []);
        const primeiraFoto = fotosItem && fotosItem.length > 0 ? fotosItem[0] : null;
        if (primeiraFoto?.id) usedPhotoIds.push(primeiraFoto.id);
        const imagemItemHTML = primeiraFoto ? `
              <div style="width:120px; min-width:120px;">
                <img src="${primeiraFoto.url_arquivo}" style="width:120px; height:90px; object-fit:cover; border-radius:6px;" crossorigin="anonymous" />
              </div>
            ` : '';

        return `
          <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">
              <div style="display:flex; gap:12px; align-items:flex-start;">
                ${imagemItemHTML}
                <div style="flex:1;">
                  <div style="font-weight:600;">${descricao || safe(it.descricao)}</div>
                  ${detalhes ? `<div style="color:#555; font-size:12px; margin-top:4px;">${detalhes}</div>` : ''}
                  ${it.observacoes ? `<div style="color:#885; font-size:12px; margin-top:4px;">Obs.: ${it.observacoes}</div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${preco}</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">1</td>
            <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">${total}</td>
          </tr>
        `;
      }).join('');

      const somaTotal = (Array.isArray(itens) ? itens.reduce((acc: number, it: any) => acc + (it.preco_unitario || 0), 0) : (pedido.valor_total || 0));

      const garantiasTexto = pedido.garantia_texto || `
        • Garantia contra defeitos de fabricação nas condições indicadas acima.
        • A garantia não cobre danos causados por mau uso, acidentes ou exposição indevida.
        • Em caso de necessidade, acione nossa assistência técnica pelos canais informados.
      `;

      const termoEntregaAtivo = pedido.termo_entrega_ativo ?? true;
      const termoEntregaTexto = pedido.termo_entrega_texto || `
        Recebi o produto em perfeito estado, sem defeitos de montagem ou avaria.
        Declaro que o ITEM É FUNCIONAL e não apresenta vício aparente.
      `;

      // Apenas manter a lista de fotos; mapeamento já foi movido para cima
      const fotosPedido = (anexos || []).filter((a: any) => a.descricao === 'foto_pedido');

      // Preparar logo oficial com fallback para evitar erro de imagem ausente
      const envLogo = (import.meta as any).env?.VITE_BRANDING_LOGO_URL as string | undefined;
      const lsLogo = typeof window !== 'undefined' ? window.localStorage.getItem('brandingLogoUrl') : null;
      // Priorizar arquivos locais do public para máxima compatibilidade
      const candidateLogos = ['/logo-sofaearte-oficial.png', '/logo-sofaearte-oficial.svg', lsLogo, envLogo].filter(Boolean) as string[];
      const resolveLogoSrc = async (): Promise<string> => {
        for (const url of candidateLogos) {
          const ok = await new Promise<boolean>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
          });
          if (ok) return url;
        }
        return '/placeholder.svg';
      };
      const logoSrc = await resolveLogoSrc();
      const logoImgTag = `<img src="${logoSrc}" crossorigin="anonymous" referrerpolicy="no-referrer" style="height:56px; width:auto;" />`;
      
      const headerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${logoImgTag}
            <div>
              <div style="color:#222; font-size:12px; line-height:1.4;">
                <div>SOFÁ & ARTE HOME DECOR LTDA</div>
                <div>CNPJ: 38.827.698/0001-96</div>
                <div>Rua do Aragão, 70 • Boa Vista, Recife-PE</div>
                <div>CEP 50060-150</div>
                <div>Email: sofaearterecife@gmail.com</div>
                <div>Telefones: +55 (81) 97910-6729 • +55 (81) 98222-6725</div>
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#555;">Recife, ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</div>
            <div style="font-size:28px; font-weight:700; color:#111;">Orçamento ${numero}-${anoAtual}</div>
          </div>
        </div>
      `;

      const clienteHTML = `
        <div style="margin-top:16px;">
          <div style="font-size:16px; font-weight:700; color:#111;">Cliente: ${pedido.cliente_nome}</div>
          <div style="color:#555; font-size:12px;">Telefone: ${safe(pedido.cliente_telefone)} • Email: ${safe(pedido.cliente_email)}</div>
        </div>
      `;

      const infosBasicasHTML = `
        <div style="margin-top:18px;">
          <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:8px;">Informações básicas</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="background:#F9FAFB; border:1px solid #eee; border-radius:8px; padding:10px;">
              <div style="font-size:12px; color:#555;">Previsão de entrega</div>
              <div style="font-size:13px; font-weight:600;">${pedido.data_previsao_entrega ? format(new Date(pedido.data_previsao_entrega), 'dd/MM/yyyy', { locale: ptBR }) : 'A definir'}</div>
            </div>
            <div style="background:#F9FAFB; border:1px solid #eee; border-radius:8px; padding:10px;">
              <div style="font-size:12px; color:#555;">Observações</div>
              <div style="font-size:13px;">${safe(pedido.observacoes)}</div>
            </div>
          </div>
        </div>
      `;

      const produtosTabelaHTML = `
        <div style="margin-top:20px;">
          <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:8px;">Produtos</div>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#F3F4F6;">
                <th style="text-align:left; padding:10px; font-size:12px;">Descrição</th>
                <th style="text-align:right; padding:10px; font-size:12px;">Preço unitário</th>
                <th style="text-align:center; padding:10px; font-size:12px;">Qtde</th>
                <th style="text-align:right; padding:10px; font-size:12px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${produtosHTML}
              <tr>
                <td colspan="3" style="padding:10px; text-align:right; font-weight:700;">Total</td>
                <td style="padding:10px; text-align:right; font-weight:700;">${currency(somaTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const garantiaHTML = `
        <div style="margin-top:18px;">
          <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:8px;">Garantia</div>
          <div style="font-size:12px; color:#333; white-space:pre-line;">${garantiasTexto}</div>
        </div>
      `;

      const termoHTML = termoEntregaAtivo ? `
        <div style="margin-top:18px;">
          <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:8px;">Termo de Entrega e Recebimento</div>
          <div style="font-size:12px; color:#333; white-space:pre-line;">${termoEntregaTexto}</div>
        </div>
      ` : '';

      // Página de fotos: restantes por item + fotos de controle
      const fotosRestantes = fotosPedido.filter((f: any) => !usedPhotoIds.includes(f.id));
      const fotosControle = (anexos || []).filter((a: any) => a.descricao === 'foto_controle');
      const fotosHTML = (fotosRestantes.length > 0 || fotosControle.length > 0) ? `
        <div style="page-break-before:always;">
          <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:8px;">Fotos</div>
          ${fotosRestantes.length > 0 ? `
          <div style="font-size:12px; color:#555; margin-bottom:6px;">Fotos do pedido</div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
            ${fotosRestantes.map((f: any) => `
              <div style="border:1px solid #eee; border-radius:8px; padding:8px; background:#FAFAFA;">
                <img src="${f.url_arquivo}" style="width:100%; height:auto; object-fit:cover; border-radius:6px;" crossorigin="anonymous" />
                <div style="font-size:11px; color:#555; margin-top:6px;">${format(new Date(f.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          ${fotosControle.length > 0 ? `
          <div style="font-size:12px; color:#555; margin-top:14px; margin-bottom:6px;">Fotos de controle</div>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
            ${fotosControle.map((f: any) => `
              <div style="border:1px solid #eee; border-radius:8px; padding:8px; background:#FAFAFA;">
                <img src="${f.url_arquivo}" style="width:100%; height:auto; object-fit:cover; border-radius:6px;" crossorigin="anonymous" />
                <div style="font-size:11px; color:#555; margin-top:6px;">${format(new Date(f.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      ` : '';

      // Monta o container e captura
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = '#fff';
      tempDiv.style.padding = '24px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.innerHTML = `
        ${headerHTML}
        ${clienteHTML}
        ${infosBasicasHTML}
        ${produtosTabelaHTML}
        ${garantiaHTML}
        ${termoHTML}
        ${fotosHTML}
      `;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        logging: false,
        imageTimeout: 0
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 12;  // margem superior ligeiramente maior
      const marginBottom = 22; // margem inferior maior para evitar conteúdo colado na base

      const imgWidth = pageWidth - (marginLeft + marginRight);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = marginTop;
      const pageBreakGap = 12; // mm de espaço real entre páginas

      if (imgHeight <= pageHeight - (marginTop + marginBottom + pageBreakGap)) {
        const yPosition = (pageHeight - imgHeight) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginLeft, yPosition, imgWidth, imgHeight);
      } else {
        // Primeira página
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - (marginTop + marginBottom + pageBreakGap));

        // Páginas subsequentes com gap real
        while (heightLeft > 0) {
          pdf.addPage();
          // Calcular nova posição considerando o gap
          position = -(imgHeight - heightLeft) + marginTop + pageBreakGap;
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginLeft, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - (marginTop + marginBottom + pageBreakGap));
        }
      }

      // --- NOVO: Páginas de fotos sem cortes ---
      const loadImageDataUrl = async (src: string): Promise<string> => {
        return await new Promise((resolve, reject) => {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.referrerPolicy = 'no-referrer';
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              const ctx = c.getContext('2d');
              if (!ctx) return reject(new Error('Canvas context não disponível'));
              ctx.drawImage(img, 0, 0);
              resolve(c.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = (e) => reject(e);
            img.src = src;
          } catch (e) {
            reject(e);
          }
        });
      };

      const addPhotosSection = async (tituloSecao: string, fotos: any[]) => {
        if (!fotos || fotos.length === 0) return;
        // Inserir um cabeçalho e grid 3-colunas, mantendo imagens inteiras (contain)
        const cols = 3;
        const gap = 6; // mm
        const contentW = pageWidth - (marginLeft + marginRight);
        const cellW = (contentW - gap * (cols - 1)) / cols; // mm
        const cellH = 60; // mm por célula (altura suficiente para manter proporções)

        // Começar nova página para a seção
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(17); // #111
        pdf.text(tituloSecao, marginLeft, marginTop);

        let x = marginLeft;
        let y = marginTop + 8; // espaço abaixo do título
        let colIndex = 0;

        for (const f of fotos) {
          // Se não couber mais uma linha completa, ir para próxima página
          if (y + cellH > pageHeight - marginBottom) {
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.setTextColor(17);
            pdf.text(tituloSecao, marginLeft, marginTop);
            y = marginTop + 8;
            colIndex = 0;
            x = marginLeft;
          }

          // Pré-carregar imagem como dataURL para evitar CORS
          let dataUrl: string | null = null;
          try {
            dataUrl = await loadImageDataUrl(f.url_arquivo);
          } catch (e) {
            // Se falhar, tentar usar diretamente a URL (pode não funcionar em todos os casos)
            dataUrl = null;
          }

          // Tentar adicionar imagem
          try {
            // Definir tamanho "contain" dentro da célula
            // Assumir proporção 4:3 como default se não conseguirmos natural sizes
            let imgWmm = cellW;
            let imgHmm = cellH;
            if (dataUrl) {
              // Sem metadados de naturalWidth/Height; manter contain por célula
              // Usamos contain simplificando: caber em cellW x cellH
              imgWmm = cellW;
              imgHmm = cellH;
            }

            // Centralizar dentro da célula
            const drawX = x + (cellW - imgWmm) / 2;
            const drawY = y + (cellH - imgHmm) / 2;

            pdf.addImage(dataUrl || f.url_arquivo, 'JPEG', drawX, drawY, imgWmm, imgHmm);
          } catch (e) {
            // Se houver erro na imagem, renderizar um placeholder
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.rect(x, y, cellW, cellH);
            pdf.text('Imagem não pôde ser carregada', x + 4, y + cellH / 2);
          }

          // Legenda com data
          try {
            const dateStr = f.created_at ? format(new Date(f.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '';
            if (dateStr) {
              pdf.setFontSize(9);
              pdf.setTextColor(85); // #555
              pdf.text(dateStr, x + 2, y + cellH + 4);
            }
          } catch {}

          // Avançar coluna
          colIndex++;
          if (colIndex >= cols) {
            // Próxima linha
            colIndex = 0;
            x = marginLeft;
            y += cellH + 12; // espaço vertical entre linhas
          } else {
            // Próxima coluna
            x += cellW + gap;
          }
        }
      };

      // Construir páginas específicas para fotos (pedido e controle)
      await addPhotosSection('Fotos do pedido', fotosRestantes);
      await addPhotosSection('Fotos de controle', fotosControle);

      const fileName = `pedido-${numero}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Erro ao gerar PDF do pedido:', err);
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

  return { generatePDF, generatePedidoPDF, printRef, printCurrentView, isPrinting };
};
import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Printer,
  ExternalLink,
  FileText,
  Loader2,
  X
} from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  fileName: string;
  isLoading?: boolean;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title,
  fileName,
  isLoading = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName || 'documento.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (err) {
        console.warn('Impressão direta via iframe bloqueada pelo navegador, abrindo nova janela:', err);
      }
    }
    if (pdfUrl) {
      const win = window.open(pdfUrl, '_blank');
      if (win) {
        win.focus();
        win.print();
      }
    }
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-[96vw] h-[92vh] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-background">
        {/* Header com ações */}
        <DialogHeader className="px-5 py-3 border-b flex-row items-center justify-between space-y-0 bg-muted/30">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base md:text-lg font-semibold truncate">
                {title || 'Visualizador de PDF'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {fileName || 'documento.pdf'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Botão Imprimir */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !pdfUrl}
              className="hidden sm:flex items-center gap-1.5 h-9 text-xs"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </Button>

            {/* Botão Abrir em Nova Aba */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              disabled={isLoading || !pdfUrl}
              className="hidden sm:flex items-center gap-1.5 h-9 text-xs"
              title="Abrir em tela inteira / nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nova aba</span>
            </Button>

            {/* Botão Baixar PDF destacado */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !pdfUrl}
              className="flex items-center gap-1.5 h-9 text-xs font-semibold shadow-sm"
              title="Baixar arquivo PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </Button>

            {/* Botão Fechar */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Corpo com o visualizador ou carregamento */}
        <div className="flex-1 w-full h-full bg-slate-900/5 dark:bg-slate-950 relative flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Gerando pré-visualização...</p>
                <p className="text-xs text-muted-foreground">Processando dados, fotos e layout do documento.</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={title}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="text-center p-8 space-y-2">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Nenhum documento gerado.</p>
              <p className="text-xs text-muted-foreground">Tente novamente gerar o PDF.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;

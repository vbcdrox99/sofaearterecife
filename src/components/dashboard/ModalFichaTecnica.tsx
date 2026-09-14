import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/dashboard/SearchableSelect';
import { Loader2, CheckCircle2, Tag, Ruler, AlertCircle, Save, ExternalLink } from 'lucide-react';

export interface ModalFichaTecnicaProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string | null;
  numeroPedido?: string | number;
  onSuccess?: () => void;
}

interface ItemFicha {
  id: string;
  sequencia: number;
  descricao: string;
  observacoes: string;
  dimensaoLargura: string;
  dimensaoComprimento: string;
  tecido: string;
  tipoPe: string;
  espuma: string;
  braco: string;
  fotos: { id: string; url: string }[];
}

const DEFAULT_ESPUMAS = ['D33', 'D30', 'D28', 'D45', 'Soft', 'Reforço', 'Troca'];
const DEFAULT_TIPOS_PE = ['Padrão', 'Metalon', 'Pé Gaspar', 'Madeira Castanho', 'Redondo Cromado', 'Sapata'];
const DEFAULT_BRACOS = ['Padrão', 'Slim', 'Ultra Slim', '10cm', '15cm', '20cm'];
const DEFAULT_TECIDOS = ['Bouclê Bege', 'Bouclê Cinza', 'Linho Cru', 'Linho Bege', 'Linho Cinza', 'Suede Bege', 'Suede Cinza', 'Veludo'];

export function ModalFichaTecnica({
  isOpen,
  onClose,
  pedidoId,
  numeroPedido,
  onSuccess,
}: ModalFichaTecnicaProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Informações do pedido
  const [infoPedido, setInfoPedido] = useState<{
    numero: string;
    clienteNome: string;
    observacaoGeral: string;
    dataEntrega: string;
  } | null>(null);

  // Itens de produto a serem editados
  const [itens, setItens] = useState<ItemFicha[]>([]);

  // Categorias disponíveis
  const [espumas, setEspumas] = useState<string[]>(DEFAULT_ESPUMAS);
  const [tiposPe, setTiposPe] = useState<string[]>(DEFAULT_TIPOS_PE);
  const [bracos, setBracos] = useState<string[]>(DEFAULT_BRACOS);
  const [tecidos, setTecidos] = useState<string[]>(DEFAULT_TECIDOS);

  useEffect(() => {
    if (isOpen && pedidoId) {
      carregarDados();
    } else {
      setItens([]);
      setInfoPedido(null);
    }
  }, [isOpen, pedidoId]);

  const carregarDados = async () => {
    if (!pedidoId) return;
    try {
      setLoading(true);

      // 1. Carregar categorias do banco com fallback
      try {
        const { data: catData } = await supabase.from('categorias').select('tipo, nome');
        if (catData && catData.length > 0) {
          const esp = catData.filter(c => c.tipo === 'espuma').map(c => c.nome);
          const pes = catData.filter(c => c.tipo === 'tipo_pe').map(c => c.nome);
          const brc = catData.filter(c => c.tipo === 'braco').map(c => c.nome);
          const tec = catData.filter(c => c.tipo === 'tecido').map(c => c.nome);

          if (esp.length > 0) setEspumas(Array.from(new Set([...DEFAULT_ESPUMAS, ...esp])));
          if (pes.length > 0) setTiposPe(Array.from(new Set([...DEFAULT_TIPOS_PE, ...pes])));
          if (brc.length > 0) setBracos(Array.from(new Set([...DEFAULT_BRACOS, ...brc])));
          if (tec.length > 0) setTecidos(Array.from(new Set([...DEFAULT_TECIDOS, ...tec])));
        }
      } catch (errCat) {
        console.warn('Aviso ao buscar categorias:', errCat);
      }

      // 2. Carregar dados do pedido
      const { data: pedData, error: pedErr } = await supabase
        .from('pedidos')
        .select(`
          numero_pedido,
          observacoes,
          data_previsao_entrega,
          clientes:cliente_id (nome)
        `)
        .eq('id', pedidoId)
        .single();

      if (pedErr) throw pedErr;

      setInfoPedido({
        numero: String(pedData?.numero_pedido || numeroPedido || ''),
        clienteNome: (pedData?.clientes as any)?.nome || 'Cliente não informado',
        observacaoGeral: pedData?.observacoes || '',
        dataEntrega: pedData?.data_previsao_entrega ? new Date(pedData.data_previsao_entrega).toLocaleDateString('pt-BR') : '',
      });

      // 3. Carregar anexos (fotos)
      const { data: anexosData } = await supabase
        .from('pedido_anexos')
        .select('id, url_arquivo, pedido_item_id')
        .eq('pedido_id', pedidoId);

      // 4. Carregar pedido_itens
      const { data: itensDb, error: itensErr } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('sequencia', { ascending: true });

      if (itensErr) throw itensErr;

      if (itensDb && itensDb.length > 0) {
        const itensFormatados: ItemFicha[] = itensDb.map(it => {
          // Extrai largura e comprimento de dimensoes salvas (ex: "2,20 x 1,10")
          let largura = '';
          let comprimento = '';
          if (it.dimensoes) {
            const partes = it.dimensoes.split(/[xX×]/).map((s: string) => s.trim());
            largura = partes[0] || '';
            comprimento = partes[1] || '';
          }

          const fotosItem = (anexosData || [])
            .filter((a: any) => a.pedido_item_id === it.id && a.url_arquivo)
            .map((a: any) => ({ id: a.id, url: a.url_arquivo }));

          return {
            id: it.id,
            sequencia: it.sequencia || 1,
            descricao: it.descricao || 'Produto sem descrição',
            observacoes: it.observacoes || '',
            dimensaoLargura: largura,
            dimensaoComprimento: comprimento,
            tecido: it.tecido || '',
            tipoPe: it.tipo_pe || '',
            espuma: it.espuma || '',
            braco: it.braco || '',
            fotos: fotosItem,
          };
        });

        setItens(itensFormatados);
      } else {
        setItens([]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados da ficha técnica:', err);
      toast({
        title: 'Erro ao carregar pedido',
        description: err.message || 'Não foi possível buscar as informações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções de manipulação por item
  const updateItemField = (id: string, field: keyof ItemFicha, value: any) => {
    setItens(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Funções para adicionar novas opções às categorias
  const handleAddCategory = async (tipo: 'espuma' | 'tipo_pe' | 'braco' | 'tecido', novoValor: string) => {
    if (!novoValor.trim()) return;
    const valorTrim = novoValor.trim();
    if (tipo === 'espuma') setEspumas(prev => prev.includes(valorTrim) ? prev : [...prev, valorTrim]);
    if (tipo === 'tipo_pe') setTiposPe(prev => prev.includes(valorTrim) ? prev : [...prev, valorTrim]);
    if (tipo === 'braco') setBracos(prev => prev.includes(valorTrim) ? prev : [...prev, valorTrim]);
    if (tipo === 'tecido') setTecidos(prev => prev.includes(valorTrim) ? prev : [...prev, valorTrim]);

    try {
      await supabase.from('categorias').insert({ tipo, nome: valorTrim });
    } catch (e) {
      console.warn('Erro ao salvar nova categoria:', e);
    }
  };

  const handleDeleteCategory = async (tipo: 'espuma' | 'tipo_pe' | 'braco' | 'tecido', valor: string) => {
    if (tipo === 'espuma') setEspumas(prev => prev.filter(v => v !== valor));
    if (tipo === 'tipo_pe') setTiposPe(prev => prev.filter(v => v !== valor));
    if (tipo === 'braco') setBracos(prev => prev.filter(v => v !== valor));
    if (tipo === 'tecido') setTecidos(prev => prev.filter(v => v !== valor));

    try {
      await supabase.from('categorias').delete().eq('tipo', tipo).eq('nome', valor);
    } catch (e) {
      console.warn('Erro ao excluir categoria:', e);
    }
  };

  const handleSalvarFicha = async () => {
    if (!pedidoId || itens.length === 0) return;
    try {
      setSalvando(true);

      for (const item of itens) {
        // Monta a string unificada de dimensões
        const larguraClean = item.dimensaoLargura.trim();
        const compClean = item.dimensaoComprimento.trim();
        const dimensoesFormatadas = [larguraClean, compClean].filter(Boolean).join(' × ');

        const { error } = await supabase
          .from('pedido_itens')
          .update({
            dimensoes: dimensoesFormatadas || null,
            tecido: item.tecido || '',
            tipo_pe: item.tipoPe || '',
            espuma: item.espuma || '',
            braco: item.braco || '',
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      toast({
        title: 'Ficha Técnica Atualizada!',
        description: `Especificações do Pedido #${infoPedido?.numero || ''} foram salvas.`,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar ficha técnica:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao gravar especificações.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 border-b bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  Ficha Técnica • Pedido #{infoPedido?.numero || numeroPedido || ''}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Especificações de produção (Pé, Tecido, Espuma, Braço e Dimensões)
                </DialogDescription>
              </div>
            </div>
            {infoPedido?.clienteNome && (
              <Badge variant="outline" className="hidden sm:inline-flex bg-muted/40 font-normal">
                Cliente: <span className="font-semibold ml-1">{infoPedido.clienteNome}</span>
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Carregando especificações do pedido...</p>
            </div>
          ) : itens.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
              <p className="font-medium text-sm">Nenhum produto encontrado neste pedido.</p>
              <p className="text-xs">Verifique se o pedido foi salvo com produtos cadastrados.</p>
            </div>
          ) : (
            <>
              {/* Contexto da Venda (Observações e Fotos) */}
              {infoPedido?.observacaoGeral && (
                <div className="p-3.5 rounded-xl border bg-muted/30 text-xs space-y-1">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    Observação Geral do Pedido (Venda):
                  </span>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {infoPedido.observacaoGeral}
                  </p>
                </div>
              )}

              {/* Lista de Itens para Especificação Técnica */}
              <div className="space-y-6">
                {itens.map((item, idx) => {
                  const preenchido = !!(item.tecido && item.tipoPe && item.espuma && item.braco && (item.dimensaoLargura || item.dimensaoComprimento));
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4 transition-all"
                    >
                      {/* Título do Item */}
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm sm:text-base">
                            {item.descricao}
                          </span>
                        </div>
                        {preenchido ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ficha Completa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs gap-1">
                            <AlertCircle className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                      </div>

                      {/* Observações / Fotos do Item da Venda */}
                      {(item.observacoes || item.fotos.length > 0) && (
                        <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-muted/20 border text-xs">
                          {item.fotos.length > 0 && (
                            <div className="flex gap-2 shrink-0">
                              {item.fotos.slice(0, 3).map((f) => (
                                <a
                                  key={f.id}
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative group w-14 h-14 rounded-md overflow-hidden border bg-background shrink-0"
                                >
                                  <img src={f.url} alt="Foto" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ExternalLink className="w-3 h-3" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                          {item.observacoes && (
                            <div className="flex-1 space-y-0.5">
                              <span className="text-[11px] font-medium text-muted-foreground">Detalhes informados na venda:</span>
                              <p className="text-foreground leading-snug">{item.observacoes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grid dos 5 Campos Técnicos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                        {/* 1. Dimensões */}
                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                          <Label className="text-xs font-medium flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-primary" />
                            Dimensões (L × C metros)
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={item.dimensaoLargura}
                              onChange={(e) => updateItemField(item.id, 'dimensaoLargura', e.target.value)}
                              placeholder="2,20"
                              className="h-9 text-xs text-center"
                              maxLength={6}
                            />
                            <span className="text-muted-foreground font-bold text-xs">×</span>
                            <Input
                              value={item.dimensaoComprimento}
                              onChange={(e) => updateItemField(item.id, 'dimensaoComprimento', e.target.value)}
                              placeholder="1,10"
                              className="h-9 text-xs text-center"
                              maxLength={6}
                            />
                          </div>
                        </div>

                        {/* 2. Tecido */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Tecido</Label>
                          <SearchableSelect
                            value={item.tecido}
                            onValueChange={(val) => updateItemField(item.id, 'tecido', val)}
                            options={tecidos}
                            placeholder="Selecionar tecido"
                            addLabel="Novo Tecido"
                            addPlaceholder="Ex: Bouclê Bege"
                            onAddOption={(novo) => handleAddCategory('tecido', novo)}
                            onDeleteOption={(rem) => handleDeleteCategory('tecido', rem)}
                            className="w-full"
                          />
                        </div>

                        {/* 3. Tipo de Pé */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Tipo de Pé</Label>
                          <SearchableSelect
                            value={item.tipoPe}
                            onValueChange={(val) => updateItemField(item.id, 'tipoPe', val)}
                            options={tiposPe}
                            placeholder="Selecionar pé"
                            addLabel="Novo Tipo de Pé"
                            addPlaceholder="Ex: Metalon Preto"
                            onAddOption={(novo) => handleAddCategory('tipo_pe', novo)}
                            onDeleteOption={(rem) => handleDeleteCategory('tipo_pe', rem)}
                            className="w-full"
                          />
                        </div>

                        {/* 4. Espuma */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Espuma</Label>
                          <SearchableSelect
                            value={item.espuma}
                            onValueChange={(val) => updateItemField(item.id, 'espuma', val)}
                            options={espumas}
                            placeholder="Selecionar espuma"
                            addLabel="Nova Espuma"
                            addPlaceholder="Ex: D33 Soft"
                            onAddOption={(novo) => handleAddCategory('espuma', novo)}
                            onDeleteOption={(rem) => handleDeleteCategory('espuma', rem)}
                            className="w-full"
                          />
                        </div>

                        {/* 5. Braço */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Braço</Label>
                          <SearchableSelect
                            value={item.braco}
                            onValueChange={(val) => updateItemField(item.id, 'braco', val)}
                            options={bracos}
                            placeholder="Selecionar braço"
                            addLabel="Novo Braço"
                            addPlaceholder="Ex: Slim 15cm"
                            onAddOption={(novo) => handleAddCategory('braco', novo)}
                            onDeleteOption={(rem) => handleDeleteCategory('braco', rem)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer com Ações */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={salvando}
          >
            Fechar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSalvarFicha}
            disabled={loading || salvando || itens.length === 0}
            className="gap-1.5"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Ficha Técnica
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModalFichaTecnica;

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Download, ZoomIn, Calendar, User, Package, Palette, Ruler, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LazyImage from '@/components/LazyImage';

interface PedidoAnexo {
  id: string;
  nome_arquivo: string;
  url_arquivo: string;
  tipo_arquivo: string;
  descricao: string;
  pedido_item_id?: string | null;
  created_at: string;
}

interface Pedido {
  id: string;
  numero_pedido: number;
  cliente_nome: string;
  descricao_sofa: string;
  tipo_sofa: string;
  tipo_servico?: string;
  cor: string;
  dimensoes: string;
  data_previsao_entrega: string;
  status: string;
  prioridade: string;
  espuma?: string;
  tecido?: string;
  braco?: string;
  tipo_pe?: string;
  frete?: number | null;
  preco_unitario?: number | null;
  valor_total?: number | null;
  valor_pago?: number | null;
  condicao_pagamento?: string | null;
  meios_pagamento?: string[] | null;
  observacoes?: string;
  created_at: string;
}

interface PedidoItem {
  id: string;
  pedido_id: string;
  descricao?: string;
  tipo_sofa?: string;
  cor?: string;
  dimensoes?: string;
  tipo_servico?: string;
  espuma?: string;
  tecido?: string;
  braco?: string;
  tipo_pe?: string;
  preco_unitario?: number;
  observacoes?: string;
  sequencia?: number;
}

interface PedidoPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
  pedidoItemId?: string | null;
}

const PedidoPhotosModal: React.FC<PedidoPhotosModalProps> = ({ isOpen, onClose, pedidoId, pedidoItemId }) => {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [anexos, setAnexos] = useState<PedidoAnexo[]>([]);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && pedidoId) {
      fetchPedidoData();
    }
  }, [isOpen, pedidoId]);

  const fetchPedidoData = async () => {
    try {
      setLoading(true);

      // Buscar dados do pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      // Buscar itens do pedido (produtos)
      const { data: itensData, error: itensError } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('sequencia', { ascending: true });

      if (itensError) throw itensError;

      // Buscar anexos do pedido
      const { data: anexosData, error: anexosError } = await supabase
        .from('pedido_anexos')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });

      if (anexosError) throw anexosError;

      setPedido(pedidoData);
      setItens(itensData || []);
      setAnexos(anexosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'entregue': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value?: number | null) => {
    const num = typeof value === 'number' ? value : 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const groupedAnexos = useMemo(() => ({
    foto_pedido: anexos.filter(anexo => anexo.descricao === 'foto_pedido'),
    foto_controle: anexos.filter(anexo => anexo.descricao === 'foto_controle')
  }), [anexos]);

  const allImages = useMemo(() => anexos.map(anexo => anexo.url_arquivo), [anexos]);

  const anexosPorItem = useMemo(() => {
    const map: Record<string, PedidoAnexo[]> = {};
    anexos.forEach((anexo) => {
      const key = anexo.pedido_item_id || 'sem_item';
      if (anexo.descricao === 'foto_pedido') {
        if (!map[key]) map[key] = [];
        map[key].push(anexo);
      }
    });
    return map;
  }, [anexos]);

  const produtoSelecionado: PedidoItem | null = useMemo(() => {
    if (!pedidoItemId) {
      return itens.length > 0 ? itens[0] : null;
    }
    return itens.find((it) => it.id === pedidoItemId) || null;
  }, [pedidoItemId, itens]);

  const numeroCompletoProduto = useMemo(() => {
    const n = pedido?.numero_pedido;
    const seq = produtoSelecionado?.sequencia;
    if (!n) return '';
    return `${n}${seq && seq > 1 ? `/${seq}` : ''}`;
  }, [pedido?.numero_pedido, produtoSelecionado?.sequencia]);

  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageIndex(allImages.indexOf(imageUrl));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1);
    } else {
      setSelectedImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0);
    }
    setSelectedImage(allImages[selectedImageIndex]);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando detalhes do pedido...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pedido #{pedido?.numero_pedido} - Detalhes e Fotos
            </DialogTitle>
          </DialogHeader>

          {pedido && (
            <div className="space-y-6">

              {/* Informações do Produto (selecionado) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações do Produto {numeroCompletoProduto ? `#${numeroCompletoProduto}` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {produtoSelecionado ? (
                    <div className="border rounded-lg p-3 space-y-2">
                      {produtoSelecionado.descricao && (
                        <>
                          <span className="font-medium">Descrição</span>
                          <p className="text-sm text-gray-700">{produtoSelecionado.descricao}</p>
                        </>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500">Tipo de Sofá</span>
                          <p className="text-sm">{produtoSelecionado.tipo_sofa || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Serviço</span>
                          <p className="text-sm">{produtoSelecionado.tipo_servico || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Cor</span>
                          <p className="text-sm">{produtoSelecionado.cor || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Dimensões</span>
                          <p className="text-sm">{produtoSelecionado.dimensoes || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Preço Unitário</span>
                          <p className="text-sm">{typeof produtoSelecionado.preco_unitario === 'number' ? formatCurrency(produtoSelecionado.preco_unitario) : ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Espuma</span>
                          <p className="text-sm">{produtoSelecionado.espuma || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Tecido</span>
                          <p className="text-sm">{produtoSelecionado.tecido || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Braço</span>
                          <p className="text-sm">{produtoSelecionado.braco || ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Tipo de Pé</span>
                          <p className="text-sm">{produtoSelecionado.tipo_pe || ''}</p>
                        </div>
                      </div>
                      {produtoSelecionado.observacoes && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Observações</span>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{produtoSelecionado.observacoes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Nenhum produto selecionado para este pedido</div>
                  )}
                </CardContent>
              </Card>

              {/* Informações do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Cliente:</span>
                      </div>
                      <p className="text-sm text-gray-700">{pedido.cliente_nome}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Entrega:</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {format(new Date(pedido.data_previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">Status:</span>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(pedido.status)}>
                          {pedido.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(pedido.prioridade)}>
                          {pedido.prioridade.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {pedido.observacoes && (
                    <div className="mt-4 space-y-2">
                      <span className="font-medium">Observações:</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {pedido.observacoes}
                      </p>
                    </div>
                  )}

                  {/* Resumo Financeiro */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Resumo Financeiro</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Total dos Produtos</span>
                        <p className="text-sm font-medium">{formatCurrency(pedido.valor_total)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Frete</span>
                        <p className="text-sm font-medium">{formatCurrency(pedido.frete)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Total com Frete</span>
                        <p className="text-sm font-medium">{formatCurrency((pedido.valor_total || 0) + (pedido.frete || 0))}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Valor Pago</span>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(pedido.valor_pago)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Saldo Devedor</span>
                        <p className={`text-sm font-medium ${(((pedido.valor_total || 0) + (pedido.frete || 0) - (pedido.valor_pago || 0)) > 0) ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency((pedido.valor_total || 0) + (pedido.frete || 0) - (pedido.valor_pago || 0))}
                        </p>
                      </div>
                    </div>


                    {/* Condição e Meio(s) de Pagamento */}
                    {(pedido.condicao_pagamento || (pedido.meios_pagamento && pedido.meios_pagamento.length)) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pedido.condicao_pagamento && (
                          <div>
                            <span className="text-xs text-gray-500">Condição de Pagamento</span>
                            <p className="text-sm">{pedido.condicao_pagamento}</p>
                          </div>
                        )}
                        {pedido.meios_pagamento && pedido.meios_pagamento.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">Meio(s) de Pagamento</span>
                            <p className="text-sm">{pedido.meios_pagamento.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>


              {/* Fotos do Pedido */}
              {anexos.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Fotos Anexadas ({anexos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="foto_pedido" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="foto_pedido">
                          Fotos do Pedido ({groupedAnexos.foto_pedido.length})
                        </TabsTrigger>
                        <TabsTrigger value="foto_controle">
                          Fotos de Controle ({groupedAnexos.foto_controle.length})
                        </TabsTrigger>
                      </TabsList>

                      {Object.entries(groupedAnexos).map(([tipo, fotos]) => (
                        <TabsContent key={tipo} value={tipo} className="mt-4">
                          {fotos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {fotos.map((anexo) => (
                                <div key={anexo.id} className="relative group">
                                  <div 
                                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => openImageViewer(anexo.url_arquivo)}
                                  >
                                    <LazyImage
                                      src={anexo.url_arquivo}
                                      alt={anexo.nome_arquivo}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-600 truncate">{anexo.nome_arquivo}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full h-7 text-xs"
                                      onClick={() => downloadImage(anexo.url_arquivo, anexo.nome_arquivo)}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>Nenhuma foto encontrada nesta categoria</p>
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Nenhuma foto anexada a este pedido</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Visualização de imagem</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <LazyImage
                src={allImages[selectedImageIndex]}
                alt="Visualização"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {/* Controles de navegação */}
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
              
              {/* Botão de fechar */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PedidoPhotosModal;
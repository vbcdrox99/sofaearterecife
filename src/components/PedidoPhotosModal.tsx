import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Download, ZoomIn, Calendar, User, Package, Palette, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
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
  created_at: string;
}

interface Pedido {
  id: string;
  numero_pedido: number;
  cliente_nome: string;
  descricao_sofa: string;
  tipo_sofa: string;
  cor: string;
  dimensoes: string;
  data_previsao_entrega: string;
  status: string;
  prioridade: string;
  observacoes?: string;
  created_at: string;
}

interface PedidoPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
}

const PedidoPhotosModal: React.FC<PedidoPhotosModalProps> = ({ isOpen, onClose, pedidoId }) => {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [anexos, setAnexos] = useState<PedidoAnexo[]>([]);
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

      // Buscar anexos do pedido
      const { data: anexosData, error: anexosError } = await supabase
        .from('pedido_anexos')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });

      if (anexosError) throw anexosError;

      setPedido(pedidoData);
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

  const groupedAnexos = useMemo(() => ({
    foto_pedido: anexos.filter(anexo => anexo.descricao === 'foto_pedido'),
    foto_controle: anexos.filter(anexo => anexo.descricao === 'foto_controle')
  }), [anexos]);

  const allImages = useMemo(() => anexos.map(anexo => anexo.url_arquivo), [anexos]);

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

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Tipo:</span>
                      </div>
                      <p className="text-sm text-gray-700">{pedido.tipo_sofa}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Cor:</span>
                      </div>
                      <p className="text-sm text-gray-700">{pedido.cor}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Dimensões:</span>
                      </div>
                      <p className="text-sm text-gray-700">{pedido.dimensoes}</p>
                    </div>
                  </div>

                  {pedido.descricao_sofa && (
                    <div className="mt-4 space-y-2">
                      <span className="font-medium">Descrição:</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {pedido.descricao_sofa}
                      </p>
                    </div>
                  )}

                  {pedido.observacoes && (
                    <div className="mt-4 space-y-2">
                      <span className="font-medium">Observações:</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {pedido.observacoes}
                      </p>
                    </div>
                  )}
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
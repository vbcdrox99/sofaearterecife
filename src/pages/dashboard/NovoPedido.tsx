import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  User,
  Package,
  Calendar as CalendarIcon,
  DollarSign,
  AlertCircle,
  Camera,
  Store,
  Plus,
  Minus,
  Trash2,
  Edit2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Truck,
  Layers,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { format, parse, isValid, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import ImageUpload, { UploadedImage } from '@/components/ImageUpload';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ClienteSelector, Cliente } from '@/components/dashboard/ClienteSelector';
import { VendedorSelector, Vendedor } from '@/components/dashboard/VendedorSelector';
import DiscountInput from '@/components/dashboard/DiscountInput';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatOrderNumber, formatCurrencyInput, cn } from '@/lib/utils';

// Helper: label com asterisco para campos obrigatórios
const RequiredLabel = ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <Label htmlFor={htmlFor} className={cn("flex items-center gap-1", className)}>
    {children}
    <span className="text-destructive text-sm leading-none">*</span>
  </Label>
);

// Interface para cada Produto individual do Pedido
export interface ProdutoItem {
  id?: string;
  descricao: string; // "Qual é o produto?"
  detalhes: string; // "Detalhes"
  precoUnitario: string; // "Valor unitário"
  quantidade: number; // "Quantidade"
  descontoTipo: 'percentage' | 'fixed';
  descontoValor: string; // "Desconto por item"
  visitaTecnicaAtiva: boolean; // "Visita técnica (sim/não)"
  visitaTecnicaData: string; // Data da visita no formato DD/MM/AAAA
  fotosPedido: UploadedImage[]; // "Foto do PRODUTO"
}

const defaultProdutoItem: ProdutoItem = {
  descricao: '',
  detalhes: '',
  precoUnitario: '',
  quantidade: 1,
  descontoTipo: 'percentage',
  descontoValor: '0',
  visitaTecnicaAtiva: false,
  visitaTecnicaData: '',
  fotosPedido: [],
};

const TERMO_ENTREGA_PADRAO = `Recebi o produto em perfeito estado, sem defeito ou avaria.

Nome:_______________________________________________CPF_________________________ DATA: _____._____._______

O serviço de FRETE E MONTAGEM é realizado por empresa terceirizada, indicada pela loja, caso o cliente opte por retirar por meios próprios, fica a empresa isenta de responsabilidade sobre possíveis danos ao produto.

O cliente deve informar durante o atendimento as condições do local de entrega do produto.
Ex: Quantos andares de escada, tamanho de elevador, porta e corredores...

Caso o produto precise ser entregue por escadas, será cobrado além da taxa de montagem (caso haja necessidade), 10,00 por andar.

Você deve recusar a entrega e descrever o motivo no verso do pedido nos seguintes casos:
* produto quebrado, amassado, riscado ou danificado;
* produto completamente diferente do que você comprou;
* faltam peças ou acessórios.

Após assinatura de recebimento de mercadoria em perfeito estado, não serão aceitas quaisquer devoluções ou reposições posteriores.`;

const TERMO_GARANTIA_PADRAO = `Este produto está efetivamente garantido contra eventuais defeitos de fabricação conforme prazos indicados abaixo, a partir da data de compra, sem prorrogação.
Reforma: Prazo TOTAL de 3 (três) meses.
Fabricação: Revestimentos: prazo total de 3 (três) meses, desde que o revestimento seja do mostruário Válleri. Não será concedida qualquer garantia ao revestimento quando o tecido for fornecido pelo próprio cliente ou tenha sido adquirido de empresa terceira por solicitação do mesmo.
Estrutura (madeiras, espumas, percintas, mecanismos, pés, fibras naturais): prazo total de 12 (doze) meses.

A garantia perderá a sua validade:
• Em caso de mau uso, considerando a finalidade a que se destina o móvel e as orientações constantes neste termo;
• Em caso de limpeza incorreta, falta de manutenção básica ao uso, aplicação de produtos químicos, tratamentos de proteção aplicados pelo comprador, detergentes, condicionadores, fluidos corporais ou danos devidos à exposição direta ou indireta à luz solar, umidade excessiva, calor excessivo, luminosidade intensa, ou condições semelhantes, bem como avaria de transporte, quando o mesmo for realizado pelo próprio consumidor;
• Em caso de danos causados pela ação de cupins, insetos, broca ou outras pragas;
• Se forem realizados, sem prévia autorização da fábrica, alterações, reparos ou substituições de partes do móvel, ou por qualquer meio danificar o produto por ato que praticar.

Solicitação de Assistência Técnica:
• O consumidor deverá entrar em contato através do canal de atendimento (81) 98771-4814 munido do pedido de compra, a fim de formalizar a solicitação de assistência técnica;
• A Válleri se reserva o direito de efetuar avaliação técnica da solicitação;
• Caso seja constatado uso inadequado ou a presença de quaisquer condições que excluem ou não compreendam a garantia do produto, as despesas decorrentes do transporte e da reforma serão por conta do cliente ou consumidor final.`;

const parseValor = (v: string | number | undefined | null): number => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const calculateFinalPrice = (price: number, type: 'percentage' | 'fixed', value: number): number => {
  if (!price) return 0;
  if (type === 'percentage') {
    return price * (1 - value / 100);
  } else {
    return Math.max(0, price - value);
  }
};

const converterDataISOParaBR = (dataISO?: string | null): string => {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('T')[0].split('-');
  if (!ano || !mes || !dia) return '';
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
};

const converterDataParaISO = (dataBR?: string): string => {
  if (!dataBR || dataBR.length !== 10) return '';
  const [dia, mes, ano] = dataBR.split('/');
  if (!dia || !mes || !ano || ano.length !== 4) return '';
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
};

const NovoPedido = () => {
  const { id: pedidoIdParam } = useParams();
  const isEditMode = !!pedidoIdParam;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, selectedStore, isFuncionario } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [lojaSelecionadaForm, setLojaSelecionadaForm] = useState<string>('loja_1');

  // Estados do Header do Pedido
  const [numeroPedido, setNumeroPedido] = useState<string>('');
  const [tipoPedido, setTipoPedido] = useState<'pedido' | 'orcamento'>('pedido');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);
  const [dataEntrega, setDataEntrega] = useState<string>('');
  const [observacaoGeral, setObservacaoGeral] = useState<string>('');
  const [frete, setFrete] = useState<string>('');

  // Estados da Lista de Produtos
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [editingProdutoIndex, setEditingProdutoIndex] = useState<number | null>(null);
  const [tempProduto, setTempProduto] = useState<ProdutoItem>({ ...defaultProdutoItem });

  // Estados do Pedido Geral (Financeiro, Garantia, Termos, Pagamento, Fotos)
  const [pedidoDescontoTipo, setPedidoDescontoTipo] = useState<'percentage' | 'fixed'>('percentage');
  const [pedidoDescontoValor, setPedidoDescontoValor] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('media');

  const [garantiaTipo, setGarantiaTipo] = useState<string>('meses');
  const [garantiaValor, setGarantiaValor] = useState<string>('3');
  const [garantiaTexto, setGarantiaTexto] = useState<string>(TERMO_GARANTIA_PADRAO);
  const [garantiaExpandida, setGarantiaExpandida] = useState<boolean>(false);

  const [termoEntregaAtivo, setTermoEntregaAtivo] = useState<boolean>(true);
  const [termoEntregaTexto, setTermoEntregaTexto] = useState<string>(TERMO_ENTREGA_PADRAO);
  const [termoEntregaExpandido, setTermoEntregaExpandido] = useState<boolean>(false);

  const [infoPedidoExpandido, setInfoPedidoExpandido] = useState<boolean>(false);
  const [formaPagamentoExpandido, setFormaPagamentoExpandido] = useState<boolean>(false);
  const [fotosControleExpandido, setFotosControleExpandido] = useState<boolean>(false);

  const [fotosControle, setFotosControle] = useState<UploadedImage[]>([]);

  // Anexos originais em modo edição
  const [anexosOriginais, setAnexosOriginais] = useState<UploadedImage[]>([]);

  // Sincronizar Loja
  useEffect(() => {
    if (selectedStore && selectedStore !== 'todas') {
      setLojaSelecionadaForm(selectedStore);
    } else {
      setLojaSelecionadaForm('loja_1');
    }
  }, [selectedStore]);

  // Buscar próximo número do pedido em criação
  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('numero_pedido')
          .order('numero_pedido', { ascending: false })
          .limit(1);

        let maxNumber = 0;
        if (!error && data && data.length > 0) {
          maxNumber = data[0].numero_pedido || 0;
        }

        const nextNumber = maxNumber + 1;
        const formattedNextNumber = formatOrderNumber(nextNumber, new Date().toISOString());

        setNumeroPedido(prev => prev || formattedNextNumber);
      } catch (err) {
        console.error('Erro ao buscar próximo número do pedido:', err);
      }
    };

    if (!isEditMode) {
      fetchNextNumber();
    }
  }, [isEditMode]);

  // Carregar dados se for modo edição
  useEffect(() => {
    const carregarPedido = async () => {
      if (!isEditMode || !pedidoIdParam) return;
      try {
        setIsLoading(true);
        const { data: pedido, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoIdParam)
          .single();

        if (error) throw error;

        // Header
        setNumeroPedido(pedido.numero_pedido ? String(pedido.numero_pedido) : '');
        setTipoPedido((pedido as any).tipo_pedido || 'pedido');
        setDataEntrega(converterDataISOParaBR(pedido.data_previsao_entrega));
        setObservacaoGeral(pedido.observacoes || '');
        setFrete(pedido.frete != null ? String(pedido.frete) : '');
        setPrioridade(pedido.prioridade || 'media');

        // Financeiro Geral
        setPedidoDescontoTipo((pedido.desconto_tipo as any) || 'percentage');
        setPedidoDescontoValor(pedido.desconto_valor != null ? String(pedido.desconto_valor) : '');
        setFormaPagamento(pedido.forma_pagamento || '');

        // Garantia & Termos
        setGarantiaTipo(pedido.garantia_tipo || 'meses');
        setGarantiaValor(pedido.garantia_valor != null ? String(pedido.garantia_valor) : '3');
        setGarantiaTexto(pedido.garantia_texto || TERMO_GARANTIA_PADRAO);
        setTermoEntregaAtivo(pedido.termo_entrega_ativo != null ? pedido.termo_entrega_ativo : true);
        setTermoEntregaTexto(pedido.termo_entrega_texto || TERMO_ENTREGA_PADRAO);

        if (pedido.loja) {
          setLojaSelecionadaForm(pedido.loja);
        }

        // Cliente
        if (pedido.cliente_id) {
          const { data: cData } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', pedido.cliente_id)
            .single();

          if (cData) {
            setClienteSelecionado({
              id: cData.id,
              nome: cData.nome,
              email: cData.email || '',
              telefone: cData.telefone || '',
              endereco_completo: cData.endereco_completo || '',
              cep: cData.cep || '',
              bairro: cData.bairro || '',
              cidade: cData.cidade || '',
              estado: cData.estado || '',
            });
          }
        } else if (pedido.cliente_nome) {
          setClienteSelecionado({
            id: '',
            nome: pedido.cliente_nome,
            email: pedido.cliente_email || '',
            telefone: pedido.cliente_telefone || '',
          });
        }

        // Vendedor
        if (pedido.vendedor_id) {
          const { data: vData } = await supabase
            .from('vendedores')
            .select('*')
            .eq('id', pedido.vendedor_id)
            .single();

          if (vData) {
            setVendedorSelecionado({
              id: vData.id,
              nome: vData.nome,
            });
          }
        }

        // Carregar Anexos
        const { data: anexosData } = await supabase
          .from('pedido_anexos')
          .select('*')
          .eq('pedido_id', pedidoIdParam)
          .order('created_at', { ascending: true });

        const todosAnexos: UploadedImage[] = (anexosData || []).map(a => ({
          id: a.id,
          file: new File([new Blob()], a.nome_arquivo, { type: a.tipo_arquivo || 'image/jpeg' }),
          preview: a.url_arquivo,
          uploaded: true,
          url: a.url_arquivo,
          name: a.nome_arquivo,
          size: a.tamanho_arquivo || 0,
          type: a.tipo_arquivo || 'image/jpeg',
          existing: true,
          pedidoItemId: a.pedido_item_id,
          tipoDescricao: a.descricao
        } as any));

        setAnexosOriginais(todosAnexos);

        const fotosControleCarregadas = todosAnexos.filter((a: any) => a.tipoDescricao === 'foto_controle');
        setFotosControle(fotosControleCarregadas);

        // Carregar Itens de Produtos
        const { data: itensDb, error: itensErr } = await supabase
          .from('pedido_itens')
          .select('*')
          .eq('pedido_id', pedidoIdParam)
          .order('sequencia', { ascending: true });

        if (!itensErr && Array.isArray(itensDb) && itensDb.length > 0) {
          const produtosMapeados: ProdutoItem[] = itensDb.map(it => {
            const fotosDoItem = todosAnexos.filter((a: any) => a.pedidoItemId === it.id);
            return {
              id: it.id,
              descricao: it.descricao || '',
              detalhes: it.observacoes || (it.dimensoes ? `Dimensões: ${it.dimensoes}` : ''),
              precoUnitario: it.preco_unitario != null ? String(it.preco_unitario) : '',
              quantidade: it.quantidade || 1,
              descontoTipo: (it.desconto_tipo as any) || 'percentage',
              descontoValor: it.desconto_valor != null ? String(it.desconto_valor) : '0',
              visitaTecnicaAtiva: !!it.visita_tecnica,
              visitaTecnicaData: converterDataISOParaBR(it.data_visita_tecnica),
              fotosPedido: fotosDoItem,
            };
          });
          setProdutos(produtosMapeados);
        } else if (pedido.descricao_sofa) {
          // Fallback caso seja um pedido legado sem pedido_itens
          const fotosPedidoLegado = todosAnexos.filter((a: any) => a.tipoDescricao === 'foto_pedido');
          setProdutos([
            {
              descricao: pedido.descricao_sofa || '',
              detalhes: pedido.dimensoes ? `Dimensões: ${pedido.dimensoes}` : '',
              precoUnitario: pedido.preco_unitario ? String(pedido.preco_unitario) : '',
              quantidade: pedido.quantidade || 1,
              descontoTipo: (pedido.desconto_tipo as any) || 'percentage',
              descontoValor: pedido.desconto_valor ? String(pedido.desconto_valor) : '0',
              visitaTecnicaAtiva: false,
              visitaTecnicaData: '',
              fotosPedido: fotosPedidoLegado,
            }
          ]);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do pedido:', err);
        toast({
          title: 'Erro ao carregar pedido',
          description: 'Não foi possível carregar os dados completos deste pedido.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarPedido();
  }, [isEditMode, pedidoIdParam]);

  // Cálculos Financeiros
  const totalProdutos = useMemo(() => {
    return produtos.reduce((acc, p) => {
      const precoUnit = parseValor(p.precoUnitario);
      const qtd = p.quantidade || 1;
      const precoTotalItem = precoUnit * qtd;
      const descVal = parseFloat(p.descontoValor) || 0;
      const finalItem = calculateFinalPrice(precoTotalItem, p.descontoTipo, descVal);
      return acc + finalItem;
    }, 0);
  }, [produtos]);

  const totalComFrete = useMemo(() => {
    const valorFrete = parseValor(frete);
    return totalProdutos + valorFrete;
  }, [totalProdutos, frete]);

  const totalFinalPedido = useMemo(() => {
    const descPedido = parseValor(pedidoDescontoValor);
    return calculateFinalPrice(totalComFrete, pedidoDescontoTipo, descPedido);
  }, [totalComFrete, pedidoDescontoTipo, pedidoDescontoValor]);

  // Manipulação de Produtos
  const handleOpenAddProduto = () => {
    setTempProduto({ ...defaultProdutoItem });
    setEditingProdutoIndex(null);
    setModalProdutoAberto(true);
  };

  const handleOpenEditProduto = (index: number) => {
    setTempProduto({ ...produtos[index] });
    setEditingProdutoIndex(index);
    setModalProdutoAberto(true);
  };

  const handleRemoveProduto = (index: number) => {
    setProdutos(prev => prev.filter((_, i) => i !== index));
    toast({
      title: 'Produto Removido',
      description: 'O produto foi retirado da lista do pedido.',
    });
  };

  const handleSaveProdutoModal = () => {
    if (!tempProduto.descricao.trim()) {
      toast({
        title: 'Nome do Produto Obrigatório',
        description: 'Por favor, informe qual é o produto antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    if (editingProdutoIndex !== null) {
      // Editando existente
      setProdutos(prev => prev.map((p, idx) => (idx === editingProdutoIndex ? tempProduto : p)));
      toast({
        title: 'Produto Atualizado',
        description: `"${tempProduto.descricao}" foi atualizado com sucesso.`,
      });
    } else {
      // Adicionando novo
      setProdutos(prev => [...prev, tempProduto]);
      toast({
        title: 'Produto Adicionado',
        description: `"${tempProduto.descricao}" foi incluído no pedido.`,
      });
    }

    setModalProdutoAberto(false);
    setEditingProdutoIndex(null);
    setTempProduto({ ...defaultProdutoItem });
  };

  // Submissão do Formulário Geral do Pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      toast({
        title: 'Cliente Obrigatório',
        description: 'Por favor, selecione ou cadastre um cliente para o pedido.',
        variant: 'destructive',
      });
      return;
    }

    if (produtos.length === 0) {
      toast({
        title: 'Nenhum Produto Adicionado',
        description: 'Adicione pelo menos um produto clicando em "PRODUTO +" para salvar o pedido.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const dataEntregaISO = converterDataParaISO(dataEntrega);
      const numeroPedidoLimpo = numeroPedido.replace(/\D/g, '') || String(Date.now()).slice(-6);

      const primeiroProduto = produtos[0];
      const quantidadeTotalGeral = produtos.reduce((sum, p) => sum + (p.quantidade || 1), 0);

      const pedidoPayload: any = {
        cliente_id: clienteSelecionado.id || null,
        cliente_nome: clienteSelecionado.nome,
        cliente_email: clienteSelecionado.email || null,
        cliente_telefone: clienteSelecionado.telefone,
        cliente_endereco: clienteSelecionado.endereco_completo || null,
        vendedor_id: vendedorSelecionado?.id || null,
        numero_pedido: parseInt(numeroPedidoLimpo, 10),
        tipo_pedido: tipoPedido,
        data_previsao_entrega: dataEntregaISO || null,
        observacoes: observacaoGeral || null,
        frete: parseValor(frete) || null,
        descricao_sofa: primeiroProduto.descricao,
        dimensoes: primeiroProduto.detalhes || null,
        preco_unitario: parseValor(primeiroProduto.precoUnitario) || null,
        quantidade: quantidadeTotalGeral,
        valor_total: totalFinalPedido,
        desconto_tipo: pedidoDescontoTipo,
        desconto_valor: parseValor(pedidoDescontoValor) || null,
        forma_pagamento: formaPagamento || null,
        prioridade: prioridade || 'media',
        garantia_tipo: garantiaTipo,
        garantia_valor: parseValor(garantiaValor) || null,
        garantia_texto: garantiaTexto,
        termo_entrega_ativo: termoEntregaAtivo,
        termo_entrega_texto: termoEntregaTexto,
        loja: (lojaSelecionadaForm as any) || 'loja_1',
        status: 'em_producao',
        created_by: user.id,
      };

      let pedidoSalvoId: string = pedidoIdParam || '';

      if (!isEditMode) {
        const { data: pedidoCriado, error: erroCriar } = await supabase
          .from('pedidos')
          .insert([pedidoPayload])
          .select()
          .single();

        if (erroCriar || !pedidoCriado) throw erroCriar || new Error('Erro ao cadastrar pedido');
        pedidoSalvoId = pedidoCriado.id;
      } else {
        const { error: erroUpdate } = await supabase
          .from('pedidos')
          .update(pedidoPayload)
          .eq('id', pedidoSalvoId);

        if (erroUpdate) throw erroUpdate;
      }

      // Em modo edição, remover itens e produções antigas para recriar sincronizados
      if (isEditMode) {
        await supabase.from('pedido_itens').delete().eq('pedido_id', pedidoSalvoId);
        await supabase.from('itens_producao').delete().eq('pedido_id', pedidoSalvoId);
      }

      // Salvar Itens do Pedido (Produtos)
      const itensPayload = produtos.map((p, idx) => ({
        pedido_id: pedidoSalvoId,
        sequencia: idx + 1,
        descricao: p.descricao,
        observacoes: p.detalhes || null,
        preco_unitario: parseValor(p.precoUnitario) || null,
        quantidade: p.quantidade || 1,
        desconto_tipo: p.descontoTipo,
        desconto_valor: parseFloat(p.descontoValor) || 0,
        visita_tecnica: !!p.visitaTecnicaAtiva,
        data_visita_tecnica: p.visitaTecnicaAtiva ? (converterDataParaISO(p.visitaTecnicaData) || null) : null,
        created_by: user.id,
        espuma: '',
        tecido: '',
        braco: '',
        tipo_pe: '',
        tipo_servico: '',
        tipo_sofa: '',
      }));

      const { data: itensInseridos, error: erroItens } = await supabase
        .from('pedido_itens')
        .insert(itensPayload)
        .select();

      if (erroItens) {
        console.error('Erro ao salvar pedido_itens:', erroItens);
        throw new Error('Falha ao salvar itens de produto do pedido.');
      }

      // Criar Etapas de Produção Automáticas para cada item
      if (itensInseridos && itensInseridos.length > 0) {
        const etapasPadrao = ['marcenaria', 'corte_costura', 'espuma', 'bancada', 'tecido'];
        const producaoPayload = itensInseridos.flatMap(item =>
          etapasPadrao.map(etapa => ({
            pedido_id: pedidoSalvoId,
            pedido_item_id: item.id,
            etapa,
            concluida: false,
          }))
        );

        const { error: erroProducao } = await supabase
          .from('itens_producao')
          .insert(producaoPayload);

        if (erroProducao) {
          console.warn('Aviso ao gerar itens de produção:', erroProducao);
        }
      }

      // Gerenciar Anexos (Fotos dos Produtos e Fotos de Controle)
      // Em edição, remover anexos excluídos
      if (isEditMode) {
        const todasFotosAtuais = [
          ...produtos.flatMap(p => p.fotosPedido),
          ...fotosControle
        ];
        const idsAtuais = todasFotosAtuais.filter(f => f.existing).map(f => f.id);
        const removidos = anexosOriginais.filter(a => !idsAtuais.includes(a.id));

        for (const rem of removidos) {
          try {
            await supabase.from('pedido_anexos').delete().eq('id', rem.id);
            if (rem.url) {
              const marker = '/pedido-imagens/';
              const idx = rem.url.indexOf(marker);
              if (idx !== -1) {
                const path = rem.url.substring(idx + marker.length);
                await supabase.storage.from('pedido-imagens').remove([path]);
              }
            }
          } catch (errStorage) {
            console.error('Erro ao excluir anexo antigo:', errStorage);
          }
        }
      }

      // Inserir Novas Fotos
      const novosAnexos: any[] = [];

      // Fotos de cada produto vinculadas ao seu item correspondente
      produtos.forEach((p, idx) => {
        const itemInserido = itensInseridos ? itensInseridos[idx] : null;
        const itemId = itemInserido ? itemInserido.id : null;
        const fotosNovas = p.fotosPedido.filter(f => !f.existing && f.uploaded && !!f.url);

        fotosNovas.forEach(foto => {
          novosAnexos.push({
            pedido_id: pedidoSalvoId,
            pedido_item_id: itemId,
            nome_arquivo: foto.name,
            url_arquivo: foto.url,
            tipo_arquivo: foto.type,
            tamanho_arquivo: foto.size,
            descricao: 'foto_pedido',
            uploaded_by: user.id,
          });
        });
      });

      // Fotos de Controle (sem vinculação a item de produto específico)
      const fotosControleNovas = fotosControle.filter(f => !f.existing && f.uploaded && !!f.url);
      fotosControleNovas.forEach(foto => {
        novosAnexos.push({
          pedido_id: pedidoSalvoId,
          pedido_item_id: null,
          nome_arquivo: foto.name,
          url_arquivo: foto.url,
          tipo_arquivo: foto.type,
          tamanho_arquivo: foto.size,
          descricao: 'foto_controle',
          uploaded_by: user.id,
        });
      });

      if (novosAnexos.length > 0) {
        const { error: erroAnexos } = await supabase
          .from('pedido_anexos')
          .insert(novosAnexos);

        if (erroAnexos) {
          console.error('Erro ao salvar anexos:', erroAnexos);
        }
      }

      toast({
        title: isEditMode ? 'Pedido Atualizado!' : 'Pedido Criado com Sucesso!',
        description: `Pedido #${numeroPedidoLimpo} foi salvo e enviado para a produção.`,
      });

      setTimeout(() => {
        navigate('/dashboard/producao');
      }, 1200);

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: isEditMode ? 'Erro ao Atualizar Pedido' : 'Erro ao Criar Pedido',
        description: error.message || 'Ocorreu um erro inesperado ao salvar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper de data para o Calendar popover
  const selectedDateObject = useMemo(() => {
    if (!dataEntrega || dataEntrega.length !== 10) return undefined;
    try {
      const parsed = parse(dataEntrega, 'dd/MM/yyyy', new Date());
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [dataEntrega]);

  const handleSelectCalendarDate = (date: Date | undefined) => {
    if (date && isValid(date)) {
      setDataEntrega(format(date, 'dd/MM/yyyy'));
    }
  };

  return (
    <DashboardLayout
      title={isEditMode ? "Editar Pedido" : "Novo Pedido"}
      description={isEditMode ? "Atualize os dados do pedido" : "Cadastre um novo pedido de forma rápida e completa"}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto pb-32 space-y-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ======================================================== */}
          {/* SEÇÃO 1: CABEÇALHO / HEADER DO PEDIDO (Expansível)        */}
          {/* ======================================================== */}
          <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden transition-all">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
            <CardHeader
              className="pb-4 cursor-pointer select-none hover:bg-muted/20 transition-colors"
              onClick={() => setInfoPedidoExpandido(prev => !prev)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Informações do Pedido
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Identificação, cliente, prazos de entrega e detalhes gerais
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  {/* Tipo de Registro (Pedido vs Orçamento) */}
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border">
                    <button
                      type="button"
                      onClick={() => setTipoPedido('pedido')}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                        tipoPedido === 'pedido'
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Pedido
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPedido('orcamento')}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                        tipoPedido === 'orcamento'
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Orçamento
                    </button>
                  </div>

                  {/* Botão + / - para expandir */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInfoPedidoExpandido(prev => !prev)}
                    className="h-7 w-7 p-0 rounded-full border bg-background/80 hover:bg-background text-foreground shrink-0 shadow-xs"
                    title={infoPedidoExpandido ? "Recolher informações" : "Expandir informações"}
                  >
                    {infoPedidoExpandido ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {infoPedidoExpandido && (
              <CardContent className="space-y-5 pt-1 border-t">
                {/* Linha de Loja (se administrador) */}
                {selectedStore === 'todas' && (
                  <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
                      <Store className="w-4 h-4" />
                      <span>Loja deste Pedido:</span>
                    </div>
                    <Select value={lojaSelecionadaForm} onValueChange={setLojaSelecionadaForm}>
                      <SelectTrigger className="w-full sm:w-[220px] bg-background">
                        <SelectValue placeholder="Selecione a loja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loja_1">Aragão</SelectItem>
                        <SelectItem value="loja_2">Boa Viagem</SelectItem>
                        <SelectItem value="loja_3">Tamarineira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Grid Principal do Header */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Número do Pedido */}
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="numeroPedido" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Número do Pedido
                    </Label>
                    <Input
                      id="numeroPedido"
                      value={numeroPedido}
                      onChange={(e) => setNumeroPedido(e.target.value)}
                      placeholder="Ex: 001"
                      className="font-bold text-base tracking-wide bg-background/50"
                    />
                  </div>

                  {/* Cliente com seletor e botão + */}
                  <div className="md:col-span-5 space-y-2">
                    <RequiredLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cliente
                    </RequiredLabel>
                    <ClienteSelector
                      selectedCliente={clienteSelecionado}
                      onClienteSelect={(c) => setClienteSelecionado(c)}
                    />
                  </div>

                  {/* Vendedor */}
                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vendedor
                    </Label>
                    <VendedorSelector
                      selectedVendedor={vendedorSelecionado}
                      onVendedorSelect={(v) => setVendedorSelecionado(v)}
                    />
                  </div>

                </div>

                {/* Detalhes do Cliente Selecionado */}
                {clienteSelecionado && (
                  <div className="p-3 rounded-lg bg-muted/40 border text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-muted-foreground font-medium">Telefone:</span>{' '}
                      <span className="font-semibold text-foreground">{clienteSelecionado.telefone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">E-mail:</span>{' '}
                      <span className="font-semibold text-foreground">{clienteSelecionado.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Endereço:</span>{' '}
                      <span className="font-semibold text-foreground">{clienteSelecionado.endereco_completo || '—'}</span>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Data da Entrega, Frete e Prioridade */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  
                  {/* Data da Entrega com Calendário */}
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      Data da Entrega
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={dataEntrega}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 2) setDataEntrega(val);
                          else if (val.length <= 4) setDataEntrega(`${val.slice(0, 2)}/${val.slice(2)}`);
                          else setDataEntrega(`${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`);
                        }}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className="font-medium bg-background/50"
                      />
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="px-3 shrink-0 gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span className="hidden sm:inline text-xs">Calendário</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end">
                          <div className="space-y-3">
                            <div className="flex gap-1.5 flex-wrap pb-2 border-b">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="text-xs h-7 px-2"
                                onClick={() => setDataEntrega(format(addDays(new Date(), 7), 'dd/MM/yyyy'))}
                              >
                                +7 dias
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="text-xs h-7 px-2"
                                onClick={() => setDataEntrega(format(addDays(new Date(), 15), 'dd/MM/yyyy'))}
                              >
                                +15 dias
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="text-xs h-7 px-2"
                                onClick={() => setDataEntrega(format(addDays(new Date(), 30), 'dd/MM/yyyy'))}
                              >
                                +30 dias
                              </Button>
                            </div>
                            <Calendar
                              mode="single"
                              selected={selectedDateObject}
                              onSelect={handleSelectCalendarDate}
                              locale={ptBR}
                              initialFocus
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Frete (R$) */}
                  <div className="md:col-span-4 space-y-2">
                    <Label htmlFor="frete" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                      Frete (R$) <span className="text-[10px] text-muted-foreground font-normal lowercase">(opcional)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">R$</span>
                      <Input
                        id="frete"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={frete}
                        onChange={(e) => setFrete(formatCurrencyInput(e.target.value))}
                        disabled={isEditMode && isFuncionario}
                        className="pl-9 font-medium bg-background/50"
                      />
                    </div>
                  </div>

                  {/* Prioridade */}
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Prioridade
                    </Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">🟢 Baixa</SelectItem>
                        <SelectItem value="media">🟡 Média</SelectItem>
                        <SelectItem value="alta">🟠 Alta</SelectItem>
                        <SelectItem value="urgente">🔴 Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                {/* Observação Geral */}
                <div className="space-y-2 pt-1">
                  <Label htmlFor="observacaoGeral" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observação Geral
                  </Label>
                  <Textarea
                    id="observacaoGeral"
                    value={observacaoGeral}
                    onChange={(e) => setObservacaoGeral(e.target.value)}
                    placeholder="Digite observações importantes sobre o pedido, restrições de entrega, orientações do cliente..."
                    rows={2}
                    className="bg-background/50 resize-y"
                  />
                </div>

              </CardContent>
            )}
          </Card>


          {/* ======================================================== */}
          {/* SEÇÃO 2: PRODUTOS (PRODUTO + E LISTAGEM)                 */}
          {/* ======================================================== */}
          <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Produtos do Pedido
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adicione e gerencie os itens e produtos que compõem este pedido
                  </CardDescription>
                </div>

                {/* Botão PRODUTO + em destaque */}
                <Button
                  type="button"
                  onClick={handleOpenAddProduto}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2 font-bold px-5 h-10 rounded-xl"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  PRODUTO +
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {produtos.length === 0 ? (
                /* Estado Vazio */
                <div className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/20 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <p className="font-semibold text-base">Nenhum produto adicionado ainda</p>
                    <p className="text-xs text-muted-foreground">
                      Clique no botão <strong>PRODUTO +</strong> acima para adicionar o primeiro item ao pedido.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenAddProduto}
                    className="mt-2 gap-2 text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeiro Produto
                  </Button>
                </div>
              ) : (
                /* Lista de Produtos Adicionados */
                <div className="space-y-3">
                  {produtos.map((prod, idx) => {
                    const precoUnit = parseValor(prod.precoUnitario);
                    const qtd = prod.quantidade || 1;
                    const precoTotal = precoUnit * qtd;
                    const descVal = parseFloat(prod.descontoValor) || 0;
                    const precoFinalItem = calculateFinalPrice(precoTotal, prod.descontoTipo, descVal);

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-border/80 bg-background/60 hover:bg-background/90 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                      >
                        {/* Info do Produto */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-bold text-xs bg-muted/60">
                              Item #{idx + 1}
                            </Badge>
                            <h4 className="font-bold text-base text-foreground truncate">
                              {prod.descricao || 'Produto sem nome'}
                            </h4>
                            {prod.visitaTecnicaAtiva && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 gap-1 text-[11px]">
                                <CalendarIcon className="w-3 h-3" />
                                Visita Técnica {prod.visitaTecnicaData ? `(${prod.visitaTecnicaData})` : ''}
                              </Badge>
                            )}
                          </div>

                          {/* Detalhes livres */}
                          {prod.detalhes && (
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-0.5">
                              {prod.detalhes}
                            </p>
                          )}

                          {/* Fotos miniatura se houver */}
                          {prod.fotosPedido && prod.fotosPedido.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                <Camera className="w-3 h-3" />
                                {prod.fotosPedido.length} foto(s):
                              </span>
                              <div className="flex -space-x-1.5">
                                {prod.fotosPedido.slice(0, 4).map((f, fIdx) => (
                                  <img
                                    key={fIdx}
                                    src={f.preview || f.url}
                                    alt="Foto miniatura"
                                    className="w-6 h-6 rounded-md object-cover border-2 border-background shadow-xs"
                                  />
                                ))}
                                {prod.fotosPedido.length > 4 && (
                                  <div className="w-6 h-6 rounded-md bg-muted text-[9px] font-bold flex items-center justify-center border-2 border-background">
                                    +{prod.fotosPedido.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Valores e Quantidade */}
                        <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                          <div className="text-right space-y-0.5">
                            <div className="text-xs text-muted-foreground">
                              {qtd}x {precoUnit > 0 ? precoUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                              {descVal > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                                  (-{prod.descontoTipo === 'percentage' ? `${descVal}%` : `R$ ${descVal}`})
                                </span>
                              )}
                            </div>
                            <div className="text-base font-extrabold text-foreground">
                              {precoFinalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditProduto(idx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduto(idx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              title="Remover Produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>


          {/* ======================================================== */}
          {/* SEÇÃO 3: PEDIDO GERAL (FINANCEIRO, GARANTIA, TERMOS)     */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Esquerda: Garantia, Termos, Pagamento, Fotos */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card de Garantia (Expansível) */}
              <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden transition-all">
                <CardHeader
                  className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                  onClick={() => setGarantiaExpandida(prev => !prev)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-semibold">
                        Garantia do Pedido
                      </CardTitle>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGarantiaExpandida(prev => !prev);
                      }}
                      className="h-7 w-7 p-0 rounded-full border bg-background/80 hover:bg-background text-foreground shrink-0 shadow-xs"
                      title={garantiaExpandida ? "Recolher garantia" : "Expandir garantia"}
                    >
                      {garantiaExpandida ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {garantiaExpandida && (
                  <CardContent className="space-y-4 pt-1 border-t">
                    <Tabs
                      value={garantiaTipo}
                      onValueChange={(v) => {
                        setGarantiaTipo(v);
                        setGarantiaValor(v === 'dias' ? '90' : v === 'meses' ? '3' : '1');
                      }}
                    >
                      <TabsList className="grid grid-cols-3 w-full max-w-[280px]">
                        <TabsTrigger value="dias">Dias</TabsTrigger>
                        <TabsTrigger value="meses">Meses</TabsTrigger>
                        <TabsTrigger value="anos">Anos</TabsTrigger>
                      </TabsList>

                      <TabsContent value="dias" className="pt-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '30' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('30')}
                          >
                            30 dias
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '90' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('90')}
                          >
                            90 dias
                          </Button>
                          <Input
                            placeholder="Outros (dias)"
                            value={!['30', '90'].includes(garantiaValor) ? garantiaValor : ''}
                            onChange={(e) => setGarantiaValor(e.target.value)}
                            className="w-32 h-9 text-xs"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="meses" className="pt-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '3' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('3')}
                          >
                            3 meses
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '12' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('12')}
                          >
                            12 meses
                          </Button>
                          <Input
                            placeholder="Outros (meses)"
                            value={!['3', '12'].includes(garantiaValor) ? garantiaValor : ''}
                            onChange={(e) => setGarantiaValor(e.target.value)}
                            className="w-32 h-9 text-xs"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="anos" className="pt-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '1' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('1')}
                          >
                            1 ano
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={garantiaValor === '3' ? 'default' : 'outline'}
                            onClick={() => setGarantiaValor('3')}
                          >
                            3 anos
                          </Button>
                          <Input
                            placeholder="Outros (anos)"
                            value={!['1', '3'].includes(garantiaValor) ? garantiaValor : ''}
                            onChange={(e) => setGarantiaValor(e.target.value)}
                            className="w-32 h-9 text-xs"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Texto dos Termos de Garantia</Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary gap-1"
                          onClick={() => setGarantiaTexto(TERMO_GARANTIA_PADRAO)}
                        >
                          <Sparkles className="w-3 h-3" />
                          Gerar automaticamente
                        </Button>
                      </div>
                      <Textarea
                        value={garantiaTexto}
                        onChange={(e) => setGarantiaTexto(e.target.value)}
                        rows={4}
                        placeholder="Condições e termos de garantia..."
                        className="text-xs bg-background/50 font-mono"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Card de Termos de Entrega e Recebimento (Expansível) */}
              <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden transition-all">
                <CardHeader
                  className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                  onClick={() => setTermoEntregaExpandido(prev => !prev)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-semibold">
                        Termos de Entrega e Recebimento
                      </CardTitle>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTermoEntregaExpandido(prev => !prev);
                      }}
                      className="h-7 w-7 p-0 rounded-full border bg-background/80 hover:bg-background text-foreground shrink-0 shadow-xs"
                      title={termoEntregaExpandido ? "Recolher termos" : "Expandir termos"}
                    >
                      {termoEntregaExpandido ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {termoEntregaExpandido && (
                  <CardContent className="space-y-4 pt-1 border-t">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Status do termo no pedido:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {termoEntregaAtivo ? 'Habilitado' : 'Desabilitado'}
                        </span>
                        <Switch
                          checked={termoEntregaAtivo}
                          onCheckedChange={setTermoEntregaAtivo}
                        />
                      </div>
                    </div>

                    {termoEntregaAtivo && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Texto do Termo</Label>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary gap-1"
                            onClick={() => setTermoEntregaTexto(TERMO_ENTREGA_PADRAO)}
                          >
                            <Sparkles className="w-3 h-3" />
                            Gerar automaticamente
                          </Button>
                        </div>
                        <Textarea
                          value={termoEntregaTexto}
                          onChange={(e) => setTermoEntregaTexto(e.target.value)}
                          rows={5}
                          placeholder="Termos de entrega..."
                          className="text-xs bg-background/50 font-mono"
                        />
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Forma de Pagamento (Expansível) */}
              <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden transition-all">
                <CardHeader
                  className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                  onClick={() => setFormaPagamentoExpandido(prev => !prev)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-semibold">
                        Forma de Pagamento
                      </CardTitle>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormaPagamentoExpandido(prev => !prev);
                      }}
                      className="h-7 w-7 p-0 rounded-full border bg-background/80 hover:bg-background text-foreground shrink-0 shadow-xs"
                      title={formaPagamentoExpandido ? "Recolher forma de pagamento" : "Expandir forma de pagamento"}
                    >
                      {formaPagamentoExpandido ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {formaPagamentoExpandido && (
                  <CardContent className="space-y-3 pt-1 border-t">
                    <Input
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      placeholder="Ex: À vista no PIX, 50% de entrada + 50% na entrega, 12x no cartão..."
                      className="bg-background/50 font-medium"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {['À vista (PIX/Dinheiro)', '50% sinal + 50% entrega', 'Cartão 10x sem juros', 'Cartão 12x'].map((sugestao) => (
                        <button
                          key={sugestao}
                          type="button"
                          onClick={() => setFormaPagamento(sugestao)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Fotos de Controle (Expansível) */}
              <Card className="border-border/60 shadow-sm bg-card/90 backdrop-blur-sm overflow-hidden transition-all">
                <CardHeader
                  className="pb-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                  onClick={() => setFotosControleExpandido(prev => !prev)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" />
                        Fotos de Controle
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Anexe fotos de controle interno, amostras de referência ou croquis
                      </CardDescription>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFotosControleExpandido(prev => !prev);
                      }}
                      className="h-7 w-7 p-0 rounded-full border bg-background/80 hover:bg-background text-foreground shrink-0 shadow-xs"
                      title={fotosControleExpandido ? "Recolher fotos de controle" : "Expandir fotos de controle"}
                    >
                      {fotosControleExpandido ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {fotosControleExpandido && (
                  <CardContent className="pt-1 border-t">
                    <ImageUpload
                      images={fotosControle}
                      onImagesChange={setFotosControle}
                      maxImages={6}
                      bucketName="pedido-imagens"
                      folder="fotos-controle"
                    />
                  </CardContent>
                )}
              </Card>

            </div>

            {/* Coluna Direita: Resumo Financeiro & Ação de Salvar */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-6 space-y-6">
                
                {/* Card de Resumo Financeiro */}
                <Card className="border-border/80 shadow-md bg-card overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Linha Total dos Produtos */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total dos Produtos ({produtos.length})</span>
                      <span className="font-semibold text-foreground">
                        {totalProdutos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* Linha Frete */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="font-semibold text-foreground">
                        {parseValor(frete) > 0
                          ? parseValor(frete).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'R$ 0,00'}
                      </span>
                    </div>

                    {/* Linha Subtotal */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t font-medium">
                      <span className="text-muted-foreground">Subtotal (Produtos + Frete)</span>
                      <span className="text-foreground">
                        {totalComFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* Desconto no Total do Pedido */}
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Desconto no Total do Pedido
                      </Label>
                      <DiscountInput
                        price={totalComFrete}
                        discountType={pedidoDescontoTipo}
                        discountValue={pedidoDescontoValor}
                        onDiscountTypeChange={setPedidoDescontoTipo}
                        onDiscountValueChange={(val) => setPedidoDescontoValor(val.toString())}
                        label=""
                        disabled={isEditMode && isFuncionario}
                      />
                    </div>

                    {/* Total Final */}
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 mt-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Total Final
                        </span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                          {totalFinalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80">
                        {tipoPedido === 'orcamento' ? 'Valor orçado' : 'Valor final do pedido'}
                      </p>
                    </div>

                    {/* Botão de Salvar Pedido */}
                    <div className="pt-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-2 rounded-xl"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            <span>{isEditMode ? 'Atualizando Pedido...' : 'Salvando Pedido...'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>{isEditMode ? 'Salvar Alterações' : 'Salvar PEDIDO'}</span>
                          </>
                        )}
                      </Button>
                    </div>

                  </CardContent>
                </Card>

              </div>
            </div>

          </div>

        </form>
      </motion.div>


      {/* ======================================================== */}
      {/* MODAL / ABA DE CRIAÇÃO & EDIÇÃO DE PRODUTO               */}
      {/* ======================================================== */}
      <Dialog open={modalProdutoAberto} onOpenChange={setModalProdutoAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {editingProdutoIndex !== null ? `Editar Produto #${editingProdutoIndex + 1}` : 'Adicionar Novo Produto'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os detalhes e valores do item para incluí-lo no pedido
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            
            {/* Qual é o produto? */}
            <div className="space-y-2">
              <RequiredLabel htmlFor="modalNomeProduto" className="text-sm font-semibold">
                Qual é o produto?
              </RequiredLabel>
              <Input
                id="modalNomeProduto"
                value={tempProduto.descricao}
                onChange={(e) => setTempProduto(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Sofá Retrátil 3 Lugares, Poltrona Decorativa, Puff..."
                className="font-medium text-base"
                autoFocus
              />
            </div>

            {/* Detalhes */}
            <div className="space-y-2">
              <Label htmlFor="modalDetalhesProduto" className="text-sm font-semibold">
                Detalhes
              </Label>
              <Textarea
                id="modalDetalhesProduto"
                value={tempProduto.detalhes}
                onChange={(e) => setTempProduto(prev => ({ ...prev, detalhes: e.target.value }))}
                placeholder="Descreva medidas, tecidos, espuma, modelo de braço, pés, acabamento ou qualquer especificação livre..."
                rows={3}
                className="resize-y"
              />
            </div>

            {/* Valor Unitário, Quantidade e Desconto por Item */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Valor Unitário */}
              <div className="space-y-2">
                <Label htmlFor="modalValorUnitario" className="text-sm font-semibold">
                  Valor Unitário
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">R$</span>
                  <Input
                    id="modalValorUnitario"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={tempProduto.precoUnitario}
                    onChange={(e) => setTempProduto(prev => ({ ...prev, precoUnitario: formatCurrencyInput(e.target.value) }))}
                    disabled={isEditMode && isFuncionario}
                    className="pl-9 font-medium"
                  />
                </div>
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label htmlFor="modalQuantidade" className="text-sm font-semibold">
                  Quantidade
                </Label>
                <Input
                  id="modalQuantidade"
                  type="number"
                  min={1}
                  value={tempProduto.quantidade || 1}
                  onChange={(e) => setTempProduto(prev => ({ ...prev, quantidade: parseInt(e.target.value, 10) || 1 }))}
                  className="font-medium"
                />
              </div>

            </div>

            {/* Desconto por Item */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Desconto por Item
              </Label>
              <DiscountInput
                price={parseValor(tempProduto.precoUnitario) * (tempProduto.quantidade || 1)}
                discountType={tempProduto.descontoTipo}
                discountValue={tempProduto.descontoValor}
                onDiscountTypeChange={(type) => setTempProduto(prev => ({ ...prev, descontoTipo: type }))}
                onDiscountValueChange={(val) => setTempProduto(prev => ({ ...prev, descontoValor: val.toString() }))}
                label=""
                disabled={isEditMode && isFuncionario}
              />
            </div>

            {/* Visita Técnica (Sim/Não) */}
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Visita Técnica</p>
                  <p className="text-xs text-muted-foreground">Necessário agendar visita técnica prévia?</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {tempProduto.visitaTecnicaAtiva ? 'Sim' : 'Não'}
                  </span>
                  <Switch
                    checked={tempProduto.visitaTecnicaAtiva}
                    onCheckedChange={(checked) => setTempProduto(prev => ({ ...prev, visitaTecnicaAtiva: checked }))}
                  />
                </div>
              </div>

              {tempProduto.visitaTecnicaAtiva && (
                <div className="pt-2 border-t space-y-1.5">
                  <Label htmlFor="modalDataVisita" className="text-xs font-semibold uppercase text-muted-foreground">
                    Data da Visita Técnica
                  </Label>
                  <Input
                    id="modalDataVisita"
                    value={tempProduto.visitaTecnicaData}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 2) setTempProduto(prev => ({ ...prev, visitaTecnicaData: val }));
                      else if (val.length <= 4) setTempProduto(prev => ({ ...prev, visitaTecnicaData: `${val.slice(0, 2)}/${val.slice(2)}` }));
                      else setTempProduto(prev => ({ ...prev, visitaTecnicaData: `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}` }));
                    }}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="max-w-[180px]"
                  />
                </div>
              )}
            </div>

            {/* Fotos do Produto */}
            <div className="space-y-2 pt-1">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" />
                Fotos do Produto
              </Label>
              <ImageUpload
                images={tempProduto.fotosPedido}
                onImagesChange={(imgs) => setTempProduto(prev => ({ ...prev, fotosPedido: imgs }))}
                maxImages={6}
                bucketName="pedido-imagens"
                folder="fotos-pedido"
              />
            </div>

          </div>

          <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalProdutoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveProdutoModal}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default NovoPedido;

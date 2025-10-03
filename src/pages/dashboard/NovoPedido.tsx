import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Phone, MapPin, Package, Calendar, DollarSign, Mail, AlertCircle, Plus, X, Trash2, Camera } from 'lucide-react';
import ImageUpload, { UploadedImage } from '@/components/ImageUpload';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ClienteSelector, Cliente } from '@/components/dashboard/ClienteSelector';

interface FormData {
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteEndereco: string;
  clienteCep: string;
  clienteBairro: string;
  clienteCidade: string;
  clienteEstado: string;
  numeroPedido: string;
  dataEntrega: string;
  descricao: string;
  tipoSofa: string;
  cor: string;
  dimensoes: string;
  dimensaoLargura: string;
  dimensaoComprimento: string;
  tipoServico: string;
  observacoes: string;
  espuma: string;
  tecido: string;
  braco: string;
  tipoPe: string;
  valorTotal: string;
  valorPago: string;
  prioridade: string;
  etapasNecessarias: string[];
  fotosPedido: UploadedImage[];
  fotosControle: UploadedImage[];
}

const NovoPedido = () => {
  const { id: pedidoIdParam } = useParams();
  const isEditMode = !!pedidoIdParam;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([
    'Preto', 'Branco', 'Cinza', 'Marrom', 'Bege', 'Azul', 'Verde', 'Vermelho', 'Rosa', 'Amarelo'
  ]);
  const [novaCor, setNovaCor] = useState('');
  const [modalNovaCorAberto, setModalNovaCorAberto] = useState(false);
  const [corParaExcluir, setCorParaExcluir] = useState<string | null>(null);

  // Estados para Tipo de Sofá
  const [tiposSofaDisponiveis, setTiposSofaDisponiveis] = useState<string[]>([
    '2 Lugares', '3 Lugares', 'Chaise', 'Canto', 'Reclinável'
  ]);
  const [novoTipoSofa, setNovoTipoSofa] = useState('');
  const [modalNovoTipoSofaAberto, setModalNovoTipoSofaAberto] = useState(false);
  const [tipoSofaParaExcluir, setTipoSofaParaExcluir] = useState<string | null>(null);

  // Estados para Espuma
  const [espumasDisponiveis, setEspumasDisponiveis] = useState<string[]>([
    'D33', 'D30', 'Reforço', 'Troca'
  ]);
  const [novaEspuma, setNovaEspuma] = useState('');
  const [modalNovaEspumaAberto, setModalNovaEspumaAberto] = useState(false);
  const [espumaParaExcluir, setEspumaParaExcluir] = useState<string | null>(null);

  // Estados para Braço
  const [bracosDisponiveis, setBracosDisponiveis] = useState<string[]>([
    'Padrão', 'BR Slim'
  ]);
  const [novoBraco, setNovoBraco] = useState('');
  const [modalNovoBracoAberto, setModalNovoBracoAberto] = useState(false);
  const [bracoParaExcluir, setBracoParaExcluir] = useState<string | null>(null);

  // Estados para Tipo de Pé
  const [tiposPeDisponiveis, setTiposPeDisponiveis] = useState<string[]>([
    'Padrão', 'Metalon', 'Pé Gaspar'
  ]);
  const [novoTipoPe, setNovoTipoPe] = useState('');
  const [modalNovoTipoPeAberto, setModalNovoTipoPeAberto] = useState(false);
  const [tipoPeParaExcluir, setTipoPeParaExcluir] = useState<string | null>(null);

  // Estados para Tipo de Serviço
  const [tiposServicoDisponiveis, setTiposServicoDisponiveis] = useState<string[]>([
    'REFORMA', 'FABRICAÇÃO', 'MÓVEIS PLANEJADOS'
  ]);
  const [novoTipoServico, setNovoTipoServico] = useState('');
  const [modalNovoTipoServicoAberto, setModalNovoTipoServicoAberto] = useState(false);
  const [tipoServicoParaExcluir, setTipoServicoParaExcluir] = useState<string | null>(null);

  // Estado para cliente selecionado
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  
  // Estados para etapas necessárias
  const etapasDisponiveis = ['marcenaria', 'corte_costura', 'espuma', 'bancada', 'tecido'];
  const [etapasSelecionadas, setEtapasSelecionadas] = useState<string[]>([]);
  
  const toggleEtapa = (etapa: string) => {
    setEtapasSelecionadas(prev => {
      if (prev.includes(etapa)) {
        return prev.filter(e => e !== etapa);
      } else {
        return [...prev, etapa];
      }
    });
  };
  const [formData, setFormData] = useState<FormData>({
    clienteId: '',
    clienteNome: '',
    clienteEmail: '',
    clienteTelefone: '',
    clienteEndereco: '',
    clienteCep: '',
    clienteBairro: '',
    clienteCidade: '',
    clienteEstado: '',
    numeroPedido: '',
    dataEntrega: '',
    descricao: '',
    tipoSofa: '',
    cor: '',
    dimensoes: '',
    dimensaoLargura: '',
    dimensaoComprimento: '',
    tipoServico: '',
    observacoes: '',
    espuma: '',
    tecido: '',
    braco: '',
    tipoPe: '',
    valorTotal: '',
    valorPago: '',
    prioridade: 'media',
    etapasNecessarias: [],
    fotosPedido: [],
    fotosControle: []
  });

  // Guardar anexos originais para comparação em edição
  const [anexosOriginaisPedido, setAnexosOriginaisPedido] = useState<UploadedImage[]>([]);
  const [anexosOriginaisControle, setAnexosOriginaisControle] = useState<UploadedImage[]>([]);

  const converterDataISOParaBR = (dataISO?: string) => {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    if (!ano || !mes || !dia) return '';
    return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
  };

  useEffect(() => {
    const carregarPedido = async () => {
      if (!isEditMode || !pedidoIdParam) return;
      try {
        const { data: pedido, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoIdParam)
          .single();
        if (error) throw error;

        setClienteSelecionado({
          id: pedido.cliente_id || '',
          nome: pedido.cliente_nome || '',
          email: pedido.cliente_email || '',
          telefone: pedido.cliente_telefone || ''
        });

        if (pedido.etapas_necessarias && Array.isArray(pedido.etapas_necessarias)) {
          setEtapasSelecionadas(pedido.etapas_necessarias);
        }

        // Parse robusto de dimensões salvas, aceitando 'x', 'X', '×', espaços e ponto/vírgula
        const dimensoesStr: string = pedido.dimensoes || '';
        const matches = dimensoesStr.match(/\d+[.,]?\d*/g) || [];
        const largura = matches[0] ? matches[0].replace('.', ',') : '';
        const comprimento = matches[1] ? matches[1].replace('.', ',') : '';
        const dimensoesNormalizadas = largura && comprimento
          ? `${largura} x ${comprimento}`
          : pedido.dimensoes || '';

        setFormData(prev => ({
          ...prev,
          clienteId: pedido.cliente_id || '',
          clienteNome: pedido.cliente_nome || '',
          clienteEmail: pedido.cliente_email || '',
          clienteTelefone: pedido.cliente_telefone || '',
          clienteEndereco: pedido.cliente_endereco || '',
          numeroPedido: pedido.numero_pedido ? String(pedido.numero_pedido) : '',
          dataEntrega: converterDataISOParaBR(pedido.data_previsao_entrega),
          descricao: pedido.descricao_sofa || '',
          tipoSofa: pedido.tipo_sofa || '',
          cor: pedido.cor || '',
          dimensoes: dimensoesNormalizadas,
          dimensaoLargura: largura,
          dimensaoComprimento: comprimento,
          tipoServico: pedido.tipo_servico || '',
          observacoes: pedido.observacoes || '',
          espuma: pedido.espuma || '',
          tecido: pedido.tecido || '',
          braco: pedido.braco || '',
          tipoPe: pedido.tipo_pe || '',
          valorTotal: pedido.valor_total ? String(pedido.valor_total) : '',
          valorPago: pedido.valor_pago ? String(pedido.valor_pago) : '',
          prioridade: pedido.prioridade || 'media',
          etapasNecessarias: pedido.etapas_necessarias || [],
          fotosPedido: [],
          fotosControle: []
        }));

        // Garantir que os selects exibam o valor salvo mesmo que não esteja nas listas
        if (pedido.tipo_sofa) {
          setTiposSofaDisponiveis(prev => prev.includes(pedido.tipo_sofa) ? prev : [...prev, pedido.tipo_sofa]);
        }
        if (pedido.cor) {
          setCoresDisponiveis(prev => prev.includes(pedido.cor) ? prev : [...prev, pedido.cor]);
        }
        if (pedido.espuma) {
          setEspumasDisponiveis(prev => prev.includes(pedido.espuma) ? prev : [...prev, pedido.espuma]);
        }
        if (pedido.braco) {
          setBracosDisponiveis(prev => prev.includes(pedido.braco) ? prev : [...prev, pedido.braco]);
        }
        if (pedido.tipo_pe) {
          setTiposPeDisponiveis(prev => prev.includes(pedido.tipo_pe) ? prev : [...prev, pedido.tipo_pe]);
        }
        if (pedido.tipo_servico) {
          setTiposServicoDisponiveis(prev => prev.includes(pedido.tipo_servico) ? prev : [...prev, pedido.tipo_servico]);
        }

        // Carregar dados completos do cliente (endereço detalhado) se existir cliente_id
        if (pedido.cliente_id) {
          const { data: clienteData, error: clienteError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', pedido.cliente_id)
            .single();

          if (!clienteError && clienteData) {
            // Atualizar seleção de cliente com dados completos
            setClienteSelecionado({
              id: clienteData.id,
              nome: clienteData.nome,
              email: clienteData.email || '',
              telefone: clienteData.telefone || '',
              endereco_completo: clienteData.endereco_completo || '',
              cep: clienteData.cep || '',
              bairro: clienteData.bairro || '',
              cidade: clienteData.cidade || '',
              estado: clienteData.estado || '',
            });

            // Preencher campos de endereço detalhado no formulário
            setFormData(prev => ({
              ...prev,
              clienteEndereco: clienteData.endereco_completo || prev.clienteEndereco || '',
              clienteCep: clienteData.cep || prev.clienteCep || '',
              clienteBairro: clienteData.bairro || prev.clienteBairro || '',
              clienteCidade: clienteData.cidade || prev.clienteCidade || '',
              clienteEstado: clienteData.estado || prev.clienteEstado || '',
            }));
          }
        }

        // Buscar anexos existentes para pré-carregar no formulário
        const { data: anexosData, error: anexosError } = await supabase
          .from('pedido_anexos')
          .select('*')
          .eq('pedido_id', pedidoIdParam)
          .order('created_at', { ascending: true });

        if (anexosError) {
          console.error('Erro ao carregar anexos do pedido:', anexosError);
        } else {
          const fotosPedidoExistentes: UploadedImage[] = (anexosData || [])
            .filter(a => a.descricao === 'foto_pedido')
            .map(a => ({
              id: a.id,
              file: new File([new Blob()], a.nome_arquivo, { type: a.tipo_arquivo || 'image/jpeg' }),
              preview: a.url_arquivo,
              uploaded: true,
              url: a.url_arquivo,
              name: a.nome_arquivo,
              size: 0,
              type: a.tipo_arquivo || 'image/jpeg',
              existing: true,
            }));

          const fotosControleExistentes: UploadedImage[] = (anexosData || [])
            .filter(a => a.descricao === 'foto_controle')
            .map(a => ({
              id: a.id,
              file: new File([new Blob()], a.nome_arquivo, { type: a.tipo_arquivo || 'image/jpeg' }),
              preview: a.url_arquivo,
              uploaded: true,
              url: a.url_arquivo,
              name: a.nome_arquivo,
              size: 0,
              type: a.tipo_arquivo || 'image/jpeg',
              existing: true,
            }));

          setFormData(prev => ({
            ...prev,
            fotosPedido: fotosPedidoExistentes,
            fotosControle: fotosControleExistentes,
          }));
          setAnexosOriginaisPedido(fotosPedidoExistentes);
          setAnexosOriginaisControle(fotosControleExistentes);
        }
      } catch (err) {
        console.error('Erro ao carregar pedido para edição:', err);
      }
    };
    carregarPedido();
  }, [isEditMode, pedidoIdParam]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para formatar data no formato DD/MM/AAAA
  const formatarData = (value: string) => {
    // Remove tudo que não é número
    const apenasNumeros = value.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/AAAA
    if (apenasNumeros.length <= 2) {
      return apenasNumeros;
    } else if (apenasNumeros.length <= 4) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
    } else {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`;
    }
  };

  const handleDataChange = (value: string) => {
    const dataFormatada = formatarData(value);
    setFormData(prev => ({ ...prev, dataEntrega: dataFormatada }));
  };

  // Função para converter data DD/MM/AAAA para formato ISO AAAA-MM-DD
  const converterDataParaISO = (dataBR: string) => {
    if (!dataBR || dataBR.length !== 10) return '';
    
    const [dia, mes, ano] = dataBR.split('/');
    if (!dia || !mes || !ano || ano.length !== 4) return '';
    
    // Validar se é uma data válida
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    if (data.getDate() !== parseInt(dia) || 
        data.getMonth() !== parseInt(mes) - 1 || 
        data.getFullYear() !== parseInt(ano)) {
      return '';
    }
    
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  };

  // Função para formatar dimensões com vírgula automática
  const formatarDimensao = (value: string) => {
    // Remove tudo que não é número
    const apenasNumeros = value.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (!apenasNumeros) return '';
    
    // Se tem apenas 1 dígito, retorna como está
    if (apenasNumeros.length === 1) return apenasNumeros;
    
    // Se tem 2 ou mais dígitos, adiciona vírgula após o primeiro
    return `${apenasNumeros.slice(0, 1)},${apenasNumeros.slice(1, 3)}`;
  };

  const handleDimensaoChange = (field: 'dimensaoLargura' | 'dimensaoComprimento', value: string) => {
    const valorFormatado = formatarDimensao(value);
    setFormData(prev => ({ 
      ...prev, 
      [field]: valorFormatado,
      // Atualizar o campo dimensoes combinado para compatibilidade
      dimensoes: field === 'dimensaoLargura' 
        ? `${valorFormatado} x ${prev.dimensaoComprimento}`
        : `${prev.dimensaoLargura} x ${valorFormatado}`
    }));
  };

  // Funções para manipular imagens
  const handleFotosPedidoChange = (images: UploadedImage[]) => {
    setFormData(prev => ({ ...prev, fotosPedido: images }));
  };

  const handleFotosControleChange = (images: UploadedImage[]) => {
    setFormData(prev => ({ ...prev, fotosControle: images }));
  };

  // Função para lidar com a seleção de cliente
  const handleClienteSelect = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente);
    
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteEmail: cliente.email || '',
        clienteTelefone: cliente.telefone,
        clienteEndereco: cliente.endereco_completo || '',
        clienteCep: cliente.cep || '',
        clienteBairro: cliente.bairro || '',
        clienteCidade: cliente.cidade || '',
        clienteEstado: cliente.estado || '',
      }));
    } else {
      // Limpar dados do cliente se nenhum cliente for selecionado
      setFormData(prev => ({
        ...prev,
        clienteId: '',
        clienteNome: '',
        clienteEmail: '',
        clienteTelefone: '',
        clienteEndereco: '',
        clienteCep: '',
        clienteBairro: '',
        clienteCidade: '',
        clienteEstado: '',
      }));
    }
  };

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP está correto.",
          variant: "destructive"
        });
        return;
      }

      // Atualiza os campos de endereço
      setFormData(prev => ({
        ...prev,
        clienteBairro: data.bairro || '',
        clienteCidade: data.localidade || '',
        clienteEstado: data.uf || '',
        clienteEndereco: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}`
      }));

      toast({
        title: "Endereço encontrado!",
        description: "Os dados do endereço foram preenchidos automaticamente."
      });

    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para lidar com mudança no CEP
  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, clienteCep: value }));
    
    // Busca automaticamente quando o CEP tiver 8 dígitos
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarEnderecoPorCep(value);
    }
  };

  // Gerar número do pedido automaticamente apenas em modo de criação
  useEffect(() => {
    if (!isEditMode) {
      const numeroPedido = generatePedidoNumber();
      setFormData(prev => ({ ...prev, numeroPedido }));
    }
  }, [isEditMode]);

  // Carregar categorias do banco de dados
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const { data: categorias, error } = await supabase
          .from('categorias')
          .select('tipo, nome');

        if (error) {
          console.error('Erro ao carregar categorias:', error);
          return;
        }

        if (categorias) {
          // Separar categorias por tipo
          const cores = categorias.filter(cat => cat.tipo === 'cor').map(cat => cat.nome);
          const tiposSofa = categorias.filter(cat => cat.tipo === 'tipo_sofa').map(cat => cat.nome);
          const espumas = categorias.filter(cat => cat.tipo === 'espuma').map(cat => cat.nome);
          const bracos = categorias.filter(cat => cat.tipo === 'braco').map(cat => cat.nome);
          const tiposPe = categorias.filter(cat => cat.tipo === 'tipo_pe').map(cat => cat.nome);

          // Atualizar estados apenas se houver dados no banco
          if (cores.length > 0) setCoresDisponiveis(cores);
          if (tiposSofa.length > 0) setTiposSofaDisponiveis(tiposSofa);
          if (espumas.length > 0) setEspumasDisponiveis(espumas);
          if (bracos.length > 0) setBracosDisponiveis(bracos);
          if (tiposPe.length > 0) setTiposPeDisponiveis(tiposPe);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    carregarCategorias();
  }, []);

  // Garantir que os selects sempre incluam o valor atual do formulário
  useEffect(() => {
    const { tipoSofa, cor, espuma, braco, tipoPe, tipoServico } = formData;
    if (tipoSofa) setTiposSofaDisponiveis(prev => prev.includes(tipoSofa) ? prev : [...prev, tipoSofa]);
    if (cor) setCoresDisponiveis(prev => prev.includes(cor) ? prev : [...prev, cor]);
    if (espuma) setEspumasDisponiveis(prev => prev.includes(espuma) ? prev : [...prev, espuma]);
    if (braco) setBracosDisponiveis(prev => prev.includes(braco) ? prev : [...prev, braco]);
    if (tipoPe) setTiposPeDisponiveis(prev => prev.includes(tipoPe) ? prev : [...prev, tipoPe]);
    if (tipoServico) setTiposServicoDisponiveis(prev => prev.includes(tipoServico) ? prev : [...prev, tipoServico]);
  }, [formData.tipoSofa, formData.cor, formData.espuma, formData.braco, formData.tipoPe, formData.tipoServico]);

  // Reforçar que os valores atuais permaneçam visíveis quando listas são recarregadas
  useEffect(() => {
    const { tipoSofa, cor, espuma, braco, tipoPe, tipoServico } = formData;
    if (tipoSofa && !tiposSofaDisponiveis.includes(tipoSofa)) {
      setTiposSofaDisponiveis(prev => [...prev, tipoSofa]);
    }
    if (cor && !coresDisponiveis.includes(cor)) {
      setCoresDisponiveis(prev => [...prev, cor]);
    }
    if (espuma && !espumasDisponiveis.includes(espuma)) {
      setEspumasDisponiveis(prev => [...prev, espuma]);
    }
    if (braco && !bracosDisponiveis.includes(braco)) {
      setBracosDisponiveis(prev => [...prev, braco]);
    }
    if (tipoPe && !tiposPeDisponiveis.includes(tipoPe)) {
      setTiposPeDisponiveis(prev => [...prev, tipoPe]);
    }
    if (tipoServico && !tiposServicoDisponiveis.includes(tipoServico)) {
      setTiposServicoDisponiveis(prev => [...prev, tipoServico]);
    }
  }, [tiposSofaDisponiveis, coresDisponiveis, espumasDisponiveis, bracosDisponiveis, tiposPeDisponiveis, tiposServicoDisponiveis]);

  const generatePedidoNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PED${year}${month}${day}${random}`;
  };

  const adicionarNovaCor = async () => {
    if (novaCor.trim() && !coresDisponiveis.includes(novaCor.trim())) {
      try {
        const novaCorFormatada = novaCor.trim();
        
        // Salvar no banco de dados
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'cor',
            nome: novaCorFormatada
          });

        if (error) throw error;

        setCoresDisponiveis(prev => [...prev, novaCorFormatada]);
        setFormData(prev => ({ ...prev, cor: novaCorFormatada }));
        setNovaCor('');
        setModalNovaCorAberto(false);
        toast({
          title: "Cor adicionada!",
          description: `A cor "${novaCorFormatada}" foi adicionada com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar cor:', error);
        toast({
          title: "Erro ao adicionar cor",
          description: "Não foi possível adicionar a cor. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (coresDisponiveis.includes(novaCor.trim())) {
      toast({
        title: "Cor já existe",
        description: "Esta cor já está na lista de cores disponíveis.",
        variant: "destructive",
      });
    }
  };

  const excluirCor = async (corParaRemover: string) => {
    try {
      // Remover do banco de dados
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'cor')
        .eq('nome', corParaRemover);

      if (error) throw error;

      setCoresDisponiveis(prev => prev.filter(cor => cor !== corParaRemover));
      if (formData.cor === corParaRemover) {
        setFormData(prev => ({ ...prev, cor: '' }));
      }
      setCorParaExcluir(null);
      toast({
        title: "Cor removida!",
        description: `A cor "${corParaRemover}" foi removida da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir cor:', error);
      toast({
        title: "Erro ao excluir cor",
        description: "Não foi possível excluir a cor. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções para Tipo de Sofá
  const adicionarNovoTipoSofa = async () => {
    if (novoTipoSofa.trim() && !tiposSofaDisponiveis.includes(novoTipoSofa.trim())) {
      try {
        const novoTipoFormatado = novoTipoSofa.trim();
        
        // Salvar no banco de dados
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'tipo_sofa',
            nome: novoTipoFormatado
          });

        if (error) throw error;

        setTiposSofaDisponiveis(prev => [...prev, novoTipoFormatado]);
        setFormData(prev => ({ ...prev, tipoSofa: novoTipoFormatado }));
        setNovoTipoSofa('');
        setModalNovoTipoSofaAberto(false);
        toast({
          title: "Tipo de sofá adicionado!",
          description: `O tipo "${novoTipoFormatado}" foi adicionado com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar tipo de sofá:', error);
        toast({
          title: "Erro ao adicionar tipo",
          description: "Não foi possível adicionar o tipo de sofá. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (tiposSofaDisponiveis.includes(novoTipoSofa.trim())) {
      toast({
        title: "Tipo já existe",
        description: "Este tipo de sofá já está na lista.",
        variant: "destructive",
      });
    }
  };

  const excluirTipoSofa = async (tipoParaRemover: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'tipo_sofa')
        .eq('nome', tipoParaRemover);

      if (error) throw error;

      setTiposSofaDisponiveis(prev => prev.filter(tipo => tipo !== tipoParaRemover));
      if (formData.tipoSofa === tipoParaRemover) {
        setFormData(prev => ({ ...prev, tipoSofa: '' }));
      }
      setTipoSofaParaExcluir(null);
      toast({
        title: "Tipo removido!",
        description: `O tipo "${tipoParaRemover}" foi removido da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir tipo de sofá:', error);
      toast({
        title: "Erro ao excluir tipo",
        description: "Não foi possível excluir o tipo de sofá. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções para Espuma
  const adicionarNovaEspuma = async () => {
    if (novaEspuma.trim() && !espumasDisponiveis.includes(novaEspuma.trim())) {
      try {
        const novaEspumaFormatada = novaEspuma.trim();
        
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'espuma',
            nome: novaEspumaFormatada
          });

        if (error) throw error;

        setEspumasDisponiveis(prev => [...prev, novaEspumaFormatada]);
        setFormData(prev => ({ ...prev, espuma: novaEspumaFormatada }));
        setNovaEspuma('');
        setModalNovaEspumaAberto(false);
        toast({
          title: "Espuma adicionada!",
          description: `A espuma "${novaEspumaFormatada}" foi adicionada com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar espuma:', error);
        toast({
          title: "Erro ao adicionar espuma",
          description: "Não foi possível adicionar a espuma. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (espumasDisponiveis.includes(novaEspuma.trim())) {
      toast({
        title: "Espuma já existe",
        description: "Esta espuma já está na lista.",
        variant: "destructive",
      });
    }
  };

  const excluirEspuma = async (espumaParaRemover: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'espuma')
        .eq('nome', espumaParaRemover);

      if (error) throw error;

      setEspumasDisponiveis(prev => prev.filter(espuma => espuma !== espumaParaRemover));
      if (formData.espuma === espumaParaRemover) {
        setFormData(prev => ({ ...prev, espuma: '' }));
      }
      setEspumaParaExcluir(null);
      toast({
        title: "Espuma removida!",
        description: `A espuma "${espumaParaRemover}" foi removida da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir espuma:', error);
      toast({
        title: "Erro ao excluir espuma",
        description: "Não foi possível excluir a espuma. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções para Braço
  const adicionarNovoBraco = async () => {
    if (novoBraco.trim() && !bracosDisponiveis.includes(novoBraco.trim())) {
      try {
        const novoBracoFormatado = novoBraco.trim();
        
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'braco',
            nome: novoBracoFormatado
          });

        if (error) throw error;

        setBracosDisponiveis(prev => [...prev, novoBracoFormatado]);
        setFormData(prev => ({ ...prev, braco: novoBracoFormatado }));
        setNovoBraco('');
        setModalNovoBracoAberto(false);
        toast({
          title: "Braço adicionado!",
          description: `O braço "${novoBracoFormatado}" foi adicionado com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar braço:', error);
        toast({
          title: "Erro ao adicionar braço",
          description: "Não foi possível adicionar o braço. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (bracosDisponiveis.includes(novoBraco.trim())) {
      toast({
        title: "Braço já existe",
        description: "Este braço já está na lista.",
        variant: "destructive",
      });
    }
  };

  const excluirBraco = async (bracoParaRemover: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'braco')
        .eq('nome', bracoParaRemover);

      if (error) throw error;

      setBracosDisponiveis(prev => prev.filter(braco => braco !== bracoParaRemover));
      if (formData.braco === bracoParaRemover) {
        setFormData(prev => ({ ...prev, braco: '' }));
      }
      setBracoParaExcluir(null);
      toast({
        title: "Braço removido!",
        description: `O braço "${bracoParaRemover}" foi removido da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir braço:', error);
      toast({
        title: "Erro ao excluir braço",
        description: "Não foi possível excluir o braço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções para Tipo de Pé
  const adicionarNovoTipoPe = async () => {
    if (novoTipoPe.trim() && !tiposPeDisponiveis.includes(novoTipoPe.trim())) {
      try {
        const novoTipoPeFormatado = novoTipoPe.trim();
        
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'tipo_pe',
            nome: novoTipoPeFormatado
          });

        if (error) throw error;

        setTiposPeDisponiveis(prev => [...prev, novoTipoPeFormatado]);
        setFormData(prev => ({ ...prev, tipoPe: novoTipoPeFormatado }));
        setNovoTipoPe('');
        setModalNovoTipoPeAberto(false);
        toast({
          title: "Tipo de pé adicionado!",
          description: `O tipo "${novoTipoPeFormatado}" foi adicionado com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar tipo de pé:', error);
        toast({
          title: "Erro ao adicionar tipo de pé",
          description: "Não foi possível adicionar o tipo de pé. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (tiposPeDisponiveis.includes(novoTipoPe.trim())) {
      toast({
        title: "Tipo já existe",
        description: "Este tipo de pé já está na lista.",
        variant: "destructive",
      });
    }
  };

  const excluirTipoPe = async (tipoPeParaRemover: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'tipo_pe')
        .eq('nome', tipoPeParaRemover);

      if (error) throw error;

      setTiposPeDisponiveis(prev => prev.filter(tipo => tipo !== tipoPeParaRemover));
      if (formData.tipoPe === tipoPeParaRemover) {
        setFormData(prev => ({ ...prev, tipoPe: '' }));
      }
      setTipoPeParaExcluir(null);
      toast({
        title: "Tipo de pé removido!",
        description: `O tipo "${tipoPeParaRemover}" foi removido da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir tipo de pé:', error);
      toast({
        title: "Erro ao excluir tipo de pé",
        description: "Não foi possível excluir o tipo de pé. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções para Tipo de Serviço
  const adicionarNovoTipoServico = async () => {
    if (novoTipoServico.trim() && !tiposServicoDisponiveis.includes(novoTipoServico.trim())) {
      try {
        const novoTipoFormatado = novoTipoServico.trim();
        
        // Salvar no banco de dados
        const { error } = await supabase
          .from('categorias')
          .insert({
            tipo: 'tipo_servico',
            nome: novoTipoFormatado
          });

        if (error) throw error;

        setTiposServicoDisponiveis(prev => [...prev, novoTipoFormatado]);
        setFormData(prev => ({ ...prev, tipoServico: novoTipoFormatado }));
        setNovoTipoServico('');
        setModalNovoTipoServicoAberto(false);
        toast({
          title: "Tipo de serviço adicionado!",
          description: `O tipo "${novoTipoFormatado}" foi adicionado com sucesso.`,
        });
      } catch (error) {
        console.error('Erro ao adicionar tipo de serviço:', error);
        toast({
          title: "Erro ao adicionar tipo",
          description: "Não foi possível adicionar o tipo de serviço. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (tiposServicoDisponiveis.includes(novoTipoServico.trim())) {
      toast({
        title: "Tipo já existe",
        description: "Este tipo de serviço já está na lista.",
        variant: "destructive",
      });
    }
  };

  const excluirTipoServico = async (tipoServicoParaRemover: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('tipo', 'tipo_servico')
        .eq('nome', tipoServicoParaRemover);

      if (error) throw error;

      setTiposServicoDisponiveis(prev => prev.filter(tipo => tipo !== tipoServicoParaRemover));
      if (formData.tipoServico === tipoServicoParaRemover) {
        setFormData(prev => ({ ...prev, tipoServico: '' }));
      }
      setTipoServicoParaExcluir(null);
      toast({
        title: "Tipo de serviço removido!",
        description: `O tipo "${tipoServicoParaRemover}" foi removido da lista.`,
      });
    } catch (error) {
      console.error('Erro ao excluir tipo de serviço:', error);
      toast({
        title: "Erro ao excluir tipo de serviço",
        description: "Não foi possível excluir o tipo de serviço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!clienteSelecionado) {
        throw new Error('Selecione um cliente para o pedido');
      }

      if (!formData.dataEntrega || !formData.descricao) {
        throw new Error('Preencha todos os dados do pedido');
      }

      // Validar formato da data
      const dataISO = converterDataParaISO(formData.dataEntrega);
      if (!dataISO) {
        throw new Error('Por favor, informe uma data válida no formato DD/MM/AAAA');
      }

      // Garantir dimensões combinadas mesmo se o usuário não tocar nos inputs
      // Extrai dois números (com vírgula ou ponto) dos campos existentes e salva no formato "Largura Comprimento"
      const extrairDimensoes = (entrada: string) => {
        const nums = (entrada || '').match(/\d+[.,]?\d*/g) || [];
        const [l, c] = [nums[0] || '', nums[1] || ''];
        return { l: l.replace('.', ','), c: c.replace('.', ',') };
      };
      const { l: l1, c: c1 } = extrairDimensoes(formData.dimensoes);
      const { l: l2, c: c2 } = extrairDimensoes(`${formData.dimensaoLargura} ${formData.dimensaoComprimento}`);
      const larguraFinal = l1 || l2;
      const comprimentoFinal = c1 || c2;
      const dimensoesCombinadas = (larguraFinal && comprimentoFinal) ? `${larguraFinal} ${comprimentoFinal}` : '';

      if (!formData.tipoSofa || !formData.cor || !dimensoesCombinadas) {
        throw new Error('Preencha o tipo, cor e dimensões do sofá');
      }

      if (!formData.tipoServico) {
        throw new Error('Selecione o tipo de serviço');
      }

      if (!formData.espuma || !formData.tecido || !formData.braco || !formData.tipoPe) {
        throw new Error('Preencha todas as especificações do produto');
      }
      
      if (etapasSelecionadas.length === 0) {
        throw new Error('Selecione pelo menos uma etapa necessária para o pedido');
      }

      // Valores padrão para campos comerciais removidos
      const valorTotal = 0;
      const valorPago = 0;

      // Verificar se o usuário está autenticado
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Preparar dados do pedido
      const pedidoData: any = {
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome, // Manter por compatibilidade
        cliente_email: clienteSelecionado.email,
        cliente_telefone: clienteSelecionado.telefone,
        cliente_endereco: formData.clienteEndereco,
        data_previsao_entrega: dataISO,
        descricao_sofa: formData.descricao,
        tipo_sofa: formData.tipoSofa,
        tipo_servico: formData.tipoServico,
        cor: formData.cor,
        dimensoes: dimensoesCombinadas,
        observacoes: formData.observacoes,
        espuma: formData.espuma,
        tecido: formData.tecido,
        braco: formData.braco,
        tipo_pe: formData.tipoPe,
        valor_total: valorTotal,
        valor_pago: valorPago,
        prioridade: formData.prioridade,
        status: 'pendente',
        created_by: user.id,
        etapas_necessarias: etapasSelecionadas
      };

      // Incluir numero_pedido apenas se fornecido pelo usuário
      if (formData.numeroPedido.trim()) {
        // Extrair apenas os números do campo numero_pedido
        const numeroLimpo = formData.numeroPedido.replace(/\D/g, '');
        if (numeroLimpo) {
          pedidoData.numero_pedido = parseInt(numeroLimpo);
        }
      }

      let pedidoAtualId = pedidoIdParam || '';
      let pedidoCriado = null as any;
      if (!isEditMode) {
        const { data, error } = await supabase
          .from('pedidos')
          .insert([pedidoData])
          .select();
        if (error) throw error;
        pedidoCriado = data[0];
        pedidoAtualId = pedidoCriado.id;
      } else {
        const { data, error } = await supabase
          .from('pedidos')
          .update(pedidoData)
          .eq('id', pedidoAtualId)
          .select();
        if (error) throw error;
        pedidoCriado = data[0];
      }

      // Salvar/atualizar anexos (evita duplicar existentes e permite exclusão em edição)
      const todasImagens = [
        ...formData.fotosPedido.map(img => ({ ...img, tipo: 'foto_pedido' })),
        ...formData.fotosControle.map(img => ({ ...img, tipo: 'foto_controle' }))
      ];

      // Inserir apenas imagens novas (não existentes) que já possuem URL (upload concluído)
      const novasImagens = todasImagens.filter(img => !img.existing && img.uploaded && !!img.url);
      if (novasImagens.length > 0) {
        const anexosData = novasImagens.map(img => ({
          pedido_id: pedidoAtualId,
          nome_arquivo: img.name,
          url_arquivo: img.url,
          tipo_arquivo: img.type,
          tamanho_arquivo: img.size,
          descricao: img.tipo,
          uploaded_by: user.id
        }));

        const { error: anexosError } = await supabase
          .from('pedido_anexos')
          .insert(anexosData);

        if (anexosError) {
          console.error('Erro ao salvar anexos:', anexosError);
        }
      }

      // Em modo edição, remover anexos que foram excluídos pelo usuário
      if (isEditMode) {
        const atuaisExistentes = todasImagens.filter(img => img.existing).map(img => img.id);
        const origPedidoIds = anexosOriginaisPedido.map(a => a.id);
        const origControleIds = anexosOriginaisControle.map(a => a.id);

        const removidosPedido = anexosOriginaisPedido.filter(a => !atuaisExistentes.includes(a.id));
        const removidosControle = anexosOriginaisControle.filter(a => !atuaisExistentes.includes(a.id));
        const removidos = [...removidosPedido, ...removidosControle];

        for (const rem of removidos) {
          try {
            // Remover registro do banco
            const { error: delError } = await supabase
              .from('pedido_anexos')
              .delete()
              .eq('id', rem.id);
            if (delError) {
              console.error('Erro ao remover registro de anexo:', delError);
            }

            // Remover arquivo do storage
            if (rem.url) {
              const marker = '/pedido-imagens/';
              const idx = rem.url.indexOf(marker);
              if (idx !== -1) {
                const path = rem.url.substring(idx + marker.length);
                const { error: storageErr } = await supabase.storage
                  .from('pedido-imagens')
                  .remove([path]);
                if (storageErr) {
                  console.error('Erro ao remover arquivo do storage:', storageErr);
                }
              }
            }
          } catch (e) {
            console.error('Erro ao remover anexo:', e);
          }
        }
      }

      if (!isEditMode) {
        try {
          const { producaoService } = await import('@/lib/supabase');
          await producaoService.criarEtapasPedido(pedidoAtualId, etapasSelecionadas);
          await supabase
            .from('pedidos')
            .update({ status: 'em_producao' })
            .eq('id', pedidoAtualId);

          toast({
            title: "Pedido Criado com Sucesso!",
            description: `Pedido #${pedidoCriado.numero_pedido} foi cadastrado e enviado para produção.`,
          });
        } catch (producaoError) {
          console.error('Erro ao criar etapas de produção:', producaoError);
          toast({
            title: "Pedido Criado com Aviso",
            description: `Pedido #${pedidoCriado.numero_pedido} foi cadastrado, mas houve erro ao criar etapas de produção.`,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Pedido Atualizado",
          description: `Pedido #${pedidoCriado.numero_pedido} foi atualizado com sucesso.`,
        });
      }

      // Reset e redirecionamento
      if (!isEditMode) {
        setFormData({
        clienteId: '',
        clienteNome: '',
        clienteEmail: '',
        clienteTelefone: '',
        clienteEndereco: '',
        clienteCep: '',
        clienteBairro: '',
        clienteCidade: '',
        clienteEstado: '',
        numeroPedido: '',
        dataEntrega: '',
        descricao: '',
        tipoSofa: '',
        cor: '',
        dimensoes: '',
        dimensaoLargura: '',
        dimensaoComprimento: '',
        tipoServico: '',
        observacoes: '',
        espuma: '',
        tecido: '',
        braco: '',
        tipoPe: '',
        valorTotal: '',
        valorPago: '',
        prioridade: 'media',
        etapasNecessarias: [],
        fotosPedido: [],
        fotosControle: []
      });
        setClienteSelecionado(null);
        setEtapasSelecionadas([]);
        setTimeout(() => {
          navigate('/dashboard/pedidos');
        }, 2000);
      } else {
        navigate('/dashboard/pedidos');
      }

    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: isEditMode ? "Erro ao Atualizar Pedido" : "Erro ao Criar Pedido",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title={isEditMode ? "Editar Pedido" : "Novo Pedido"}
      description={isEditMode ? "Atualize os dados do pedido" : "Cadastrar novo pedido de sofá personalizado"}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClienteSelector
                clienteSelecionado={clienteSelecionado}
                onClienteSelect={handleClienteSelect}
                onClienteChange={(cliente) => {
                  if (cliente) {
                    handleClienteSelect(cliente);
                  }
                }}
              />
              
              {/* Informações do cliente selecionado */}
              {clienteSelecionado && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <User className="h-4 w-4" />
                    <span>Cliente Selecionado: {clienteSelecionado.nome}</span>
                    {clienteSelecionado.email && (
                      <span className="text-muted-foreground">• {clienteSelecionado.email}</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Campos de endereço - mostrados apenas se um cliente estiver selecionado */}
              {clienteSelecionado && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clienteCep">CEP</Label>
                    <Input
                      id="clienteCep"
                      value={formData.clienteCep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clienteBairro">Bairro</Label>
                    <Input
                      id="clienteBairro"
                      value={formData.clienteBairro}
                      onChange={(e) => handleInputChange('clienteBairro', e.target.value)}
                      placeholder="Nome do bairro"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clienteCidade">Cidade</Label>
                    <Input
                      id="clienteCidade"
                      value={formData.clienteCidade}
                      onChange={(e) => handleInputChange('clienteCidade', e.target.value)}
                      placeholder="Nome da cidade"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clienteEstado">Estado</Label>
                    <Input
                      id="clienteEstado"
                      value={formData.clienteEstado}
                      onChange={(e) => handleInputChange('clienteEstado', e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clienteEndereco">Endereço Completo (Rua e Número)</Label>
                    <Input
                      id="clienteEndereco"
                      value={formData.clienteEndereco}
                      onChange={(e) => handleInputChange('clienteEndereco', e.target.value)}
                      placeholder="Rua, número, complemento"
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Dados do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroPedido">Número do Pedido</Label>
                <Input
                  id="numeroPedido"
                  value={formData.numeroPedido}
                  onChange={(e) => handleInputChange('numeroPedido', e.target.value)}
                  placeholder="Ex: PED250909164 (deixe vazio para gerar automaticamente)"
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="dataEntrega">Data de Entrega</Label>
                 <Input
                   id="dataEntrega"
                   type="text"
                   placeholder="DD/MM/AAAA"
                   value={formData.dataEntrega}
                   onChange={(e) => handleDataChange(e.target.value)}
                   maxLength={10}
                   required
                 />
               </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada do pedido"
                  rows={3}
                  required
                />
              </div>
              
              {/* Campo de Foto do Pedido */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto do Pedido
                </Label>
                <ImageUpload
                  images={formData.fotosPedido}
                  onImagesChange={handleFotosPedidoChange}
                  maxImages={5}
                  bucketName="pedido-imagens"
                  folder="fotos-pedido"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoSofa">Tipo de Sofá</Label>
                <div className="flex gap-2">
                  <Select value={formData.tipoSofa} onValueChange={(value) => handleInputChange('tipoSofa', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de sofá" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposSofaDisponiveis.map((tipo) => (
                        <div key={tipo} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={tipo} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {tipo}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTipoSofaParaExcluir(tipo);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovoTipoSofaAberto} onOpenChange={setModalNovoTipoSofaAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Tipo de Sofá</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="novo-tipo-sofa">Nome do Tipo</Label>
                          <Input
                            id="novo-tipo-sofa"
                            value={novoTipoSofa}
                            onChange={(e) => setNovoTipoSofa(e.target.value)}
                            placeholder="Digite o nome do novo tipo"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                adicionarNovoTipoSofa();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovoTipoSofaAberto(false);
                              setNovoTipoSofa('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovoTipoSofa}
                            disabled={!novoTipoSofa.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de Confirmação para Excluir Tipo de Sofá */}
                  <Dialog open={!!tipoSofaParaExcluir} onOpenChange={() => setTipoSofaParaExcluir(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Excluir Tipo de Sofá</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir o tipo <strong>"{tipoSofaParaExcluir}"</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTipoSofaParaExcluir(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => tipoSofaParaExcluir && excluirTipoSofa(tipoSofaParaExcluir)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex gap-2">
                  <Select value={formData.cor} onValueChange={(value) => handleInputChange('cor', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      {coresDisponiveis.map((cor) => (
                        <div key={cor} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={cor} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {cor}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCorParaExcluir(cor);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovaCorAberto} onOpenChange={setModalNovaCorAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Nova Cor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nova-cor">Nome da Cor</Label>
                          <Input
                            id="nova-cor"
                            value={novaCor}
                            onChange={(e) => setNovaCor(e.target.value)}
                            placeholder="Digite o nome da nova cor"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                adicionarNovaCor();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovaCorAberto(false);
                              setNovaCor('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovaCor}
                            disabled={!novaCor.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de Confirmação para Excluir Cor */}
                  <Dialog open={!!corParaExcluir} onOpenChange={() => setCorParaExcluir(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Excluir Cor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir a cor <strong>"{corParaExcluir}"</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCorParaExcluir(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => corParaExcluir && excluirCor(corParaExcluir)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensoes">Dimensões (metros)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="dimensaoLargura"
                      value={formData.dimensaoLargura}
                      onChange={(e) => handleDimensaoChange('dimensaoLargura', e.target.value)}
                      placeholder="2,20"
                      maxLength={4}
                      className="text-center"
                      required
                    />
                  </div>
                  <span className="text-lg font-bold text-muted-foreground px-2">×</span>
                  <div className="flex-1">
                    <Input
                      id="dimensaoComprimento"
                      value={formData.dimensaoComprimento}
                      onChange={(e) => handleDimensaoChange('dimensaoComprimento', e.target.value)}
                      placeholder="1,10"
                      maxLength={4}
                      className="text-center"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                <div className="flex gap-2">
                  <Select value={formData.tipoServico} onValueChange={(value) => handleInputChange('tipoServico', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServicoDisponiveis.map((tipoServico) => (
                        <div key={tipoServico} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={tipoServico} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {tipoServico}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTipoServicoParaExcluir(tipoServico);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovoTipoServicoAberto} onOpenChange={setModalNovoTipoServicoAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Tipo de Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="novoTipoServico">Nome do Tipo de Serviço</Label>
                          <Input
                            id="novoTipoServico"
                            value={novoTipoServico}
                            onChange={(e) => setNovoTipoServico(e.target.value)}
                            placeholder="Ex: MANUTENÇÃO"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovoTipoServicoAberto(false);
                              setNovoTipoServico('');
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovoTipoServico}
                            className="flex-1"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Dialog open={tipoServicoParaExcluir !== null} onOpenChange={() => setTipoServicoParaExcluir(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>Tem certeza que deseja excluir o tipo de serviço "{tipoServicoParaExcluir}"?</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTipoServicoParaExcluir(null)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => tipoServicoParaExcluir && excluirTipoServico(tipoServicoParaExcluir)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Etapas Necessárias */}
              <div className="space-y-2 md:col-span-2">
                <Label>Etapas Necessárias</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione as etapas de produção onde este pedido deve aparecer. Clique para selecionar/deselecionar.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {etapasDisponiveis.map((etapa) => {
                    const isSelected = etapasSelecionadas.includes(etapa);
                    const etapaLabel = {
                      'marcenaria': 'Marcenaria',
                      'corte_costura': 'Corte Costura',
                      'espuma': 'Espuma',
                      'bancada': 'Bancada',
                      'tecido': 'Tecido'
                    }[etapa] || etapa;
                    
                    return (
                      <Button
                        key={etapa}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`h-12 text-sm font-medium transition-all ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleEtapa(etapa)}
                      >
                        {etapaLabel}
                      </Button>
                    );
                  })}
                </div>
                {etapasSelecionadas.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Atenção:</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Nenhuma etapa selecionada. O pedido não aparecerá em nenhuma etapa de produção.
                    </p>
                  </div>
                )}
                {etapasSelecionadas.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">Etapas selecionadas:</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {etapasSelecionadas.map(etapa => {
                        const etapaLabel = {
                          'marcenaria': 'Marcenaria',
                          'corte_costura': 'Corte Costura',
                          'espuma': 'Espuma',
                          'bancada': 'Bancada',
                          'tecido': 'Tecido'
                        }[etapa] || etapa;
                        return etapaLabel;
                      }).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre o pedido"
                  rows={2}
                />
              </div>
              
              {/* Campo de Fotos de Controle */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos de Controle
                </Label>
                <ImageUpload
                  images={formData.fotosControle}
                  onImagesChange={handleFotosControleChange}
                  maxImages={3}
                  bucketName="pedido-imagens"
                  folder="fotos-controle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="espuma">Espuma</Label>
                <div className="flex gap-2">
                  <Select value={formData.espuma} onValueChange={(value) => handleInputChange('espuma', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de espuma" />
                    </SelectTrigger>
                    <SelectContent>
                      {espumasDisponiveis.map((espuma) => (
                        <div key={espuma} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={espuma} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {espuma}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEspumaParaExcluir(espuma);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovaEspumaAberto} onOpenChange={setModalNovaEspumaAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Nova Espuma</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nova-espuma">Nome da Espuma</Label>
                          <Input
                            id="nova-espuma"
                            value={novaEspuma}
                            onChange={(e) => setNovaEspuma(e.target.value)}
                            placeholder="Digite o nome da nova espuma"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                adicionarNovaEspuma();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovaEspumaAberto(false);
                              setNovaEspuma('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovaEspuma}
                            disabled={!novaEspuma.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de Confirmação para Excluir Espuma */}
                  <Dialog open={!!espumaParaExcluir} onOpenChange={() => setEspumaParaExcluir(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Excluir Espuma</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir a espuma <strong>"{espumaParaExcluir}"</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEspumaParaExcluir(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => espumaParaExcluir && excluirEspuma(espumaParaExcluir)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tecido">Tecido</Label>
                <Input
                  id="tecido"
                  value={formData.tecido}
                  onChange={(e) => handleInputChange('tecido', e.target.value)}
                  placeholder="Especificação do tecido"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="braco">Braço</Label>
                <div className="flex gap-2">
                  <Select value={formData.braco} onValueChange={(value) => handleInputChange('braco', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de braço" />
                    </SelectTrigger>
                    <SelectContent>
                      {bracosDisponiveis.map((braco) => (
                        <div key={braco} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={braco} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {braco}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setBracoParaExcluir(braco);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovoBracoAberto} onOpenChange={setModalNovoBracoAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Braço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="novo-braco">Nome do Braço</Label>
                          <Input
                            id="novo-braco"
                            value={novoBraco}
                            onChange={(e) => setNovoBraco(e.target.value)}
                            placeholder="Digite o nome do novo braço"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                adicionarNovoBraco();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovoBracoAberto(false);
                              setNovoBraco('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovoBraco}
                            disabled={!novoBraco.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de Confirmação para Excluir Braço */}
                  <Dialog open={!!bracoParaExcluir} onOpenChange={() => setBracoParaExcluir(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Excluir Braço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir o braço <strong>"{bracoParaExcluir}"</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBracoParaExcluir(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => bracoParaExcluir && excluirBraco(bracoParaExcluir)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoPe">Tipo de Pé</Label>
                <div className="flex gap-2">
                  <Select value={formData.tipoPe} onValueChange={(value) => handleInputChange('tipoPe', value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de pé" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPeDisponiveis.map((tipoPe) => (
                        <div key={tipoPe} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                          <SelectItem value={tipoPe} className="flex-1 border-0 p-0 focus:bg-transparent">
                            {tipoPe}
                          </SelectItem>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTipoPeParaExcluir(tipoPe);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={modalNovoTipoPeAberto} onOpenChange={setModalNovoTipoPeAberto}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Tipo de Pé</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="novo-tipo-pe">Nome do Tipo de Pé</Label>
                          <Input
                            id="novo-tipo-pe"
                            value={novoTipoPe}
                            onChange={(e) => setNovoTipoPe(e.target.value)}
                            placeholder="Digite o nome do novo tipo de pé"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                adicionarNovoTipoPe();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setModalNovoTipoPeAberto(false);
                              setNovoTipoPe('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={adicionarNovoTipoPe}
                            disabled={!novoTipoPe.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de Confirmação para Excluir Tipo de Pé */}
                  <Dialog open={!!tipoPeParaExcluir} onOpenChange={() => setTipoPeParaExcluir(null)}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Excluir Tipo de Pé</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Tem certeza que deseja excluir o tipo de pé <strong>"{tipoPeParaExcluir}"</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTipoPeParaExcluir(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => tipoPeParaExcluir && excluirTipoPe(tipoPeParaExcluir)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard/pedidos')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? 'Atualizando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Atualizar Pedido' : 'Salvar Pedido'}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default NovoPedido;
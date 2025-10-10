import { Camera, Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload, { UploadedImage } from '@/components/ImageUpload';

export interface ProdutoValues {
  descricao: string;
  fotosPedido: UploadedImage[];
  tipoSofa: string;
  cor: string;
  dimensaoLargura: string;
  dimensaoComprimento: string;
  tipoServico: string;
  precoUnitario: string;
  observacoes: string;
  espuma: string;
  tecido: string;
  braco: string;
  tipoPe: string;
}

interface ProdutoCamposProps {
  titulo?: string;
  values: ProdutoValues;
  onChange: (field: keyof ProdutoValues, value: string) => void;
  onFotosChange: (images: UploadedImage[]) => void;
  onDimensaoChange: (field: 'dimensaoLargura' | 'dimensaoComprimento', value: string) => void;
  imageFolder: string;

  // Opções
  tiposSofaDisponiveis: string[];
  coresDisponiveis: string[];
  tiposServicoDisponiveis: string[];
  espumasDisponiveis: string[];
  bracosDisponiveis: string[];
  tiposPeDisponiveis: string[];

  // Abertura dos modais (controlados no pai)
  setModalNovoTipoSofaAberto: (open: boolean) => void;
  setModalNovaCorAberto: (open: boolean) => void;
  setModalNovoTipoServicoAberto: (open: boolean) => void;
  setModalNovaEspumaAberto: (open: boolean) => void;
  setModalNovoBracoAberto: (open: boolean) => void;
  setModalNovoTipoPeAberto: (open: boolean) => void;

  // Exclusões (controladas no pai)
  setTipoSofaParaExcluir: (value: string | null) => void;
  setCorParaExcluir: (value: string | null) => void;
  setTipoServicoParaExcluir: (value: string | null) => void;
  setEspumaParaExcluir: (value: string | null) => void;
  setBracoParaExcluir: (value: string | null) => void;
  setTipoPeParaExcluir: (value: string | null) => void;

  // Etapas
  etapasDisponiveis: string[];
  etapasSelecionadas: string[];
  onToggleEtapa: (etapa: string) => void;
}

const ProdutoCampos = ({
  titulo,
  values,
  onChange,
  onFotosChange,
  onDimensaoChange,
  imageFolder,
  tiposSofaDisponiveis,
  coresDisponiveis,
  tiposServicoDisponiveis,
  espumasDisponiveis,
  bracosDisponiveis,
  tiposPeDisponiveis,
  setModalNovoTipoSofaAberto,
  setModalNovaCorAberto,
  setModalNovoTipoServicoAberto,
  setModalNovaEspumaAberto,
  setModalNovoBracoAberto,
  setModalNovoTipoPeAberto,
  setTipoSofaParaExcluir,
  setCorParaExcluir,
  setTipoServicoParaExcluir,
  setEspumaParaExcluir,
  setBracoParaExcluir,
  setTipoPeParaExcluir,
  etapasDisponiveis,
  etapasSelecionadas,
  onToggleEtapa,
}: ProdutoCamposProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {titulo && (
        <div className="md:col-span-2">
          <Label className="text-base font-medium">{titulo}</Label>
        </div>
      )}

      <div className="space-y-2 md:col-span-2">
        <Label>Descrição</Label>
        <Textarea
          value={values.descricao}
          onChange={(e) => onChange('descricao', e.target.value)}
          placeholder="Descrição detalhada do pedido"
          rows={3}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Foto do Pedido
        </Label>
        <ImageUpload
          images={values.fotosPedido}
          onImagesChange={onFotosChange}
          maxImages={5}
          bucketName="pedido-imagens"
          folder={imageFolder}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Sofá</Label>
        <div className="flex gap-2">
          <Select value={values.tipoSofa} onValueChange={(v) => onChange('tipoSofa', v)}>
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
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovoTipoSofaAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex gap-2">
          <Select value={values.cor} onValueChange={(v) => onChange('cor', v)}>
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
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovaCorAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dimensões (metros)</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={values.dimensaoLargura}
              onChange={(e) => onDimensaoChange('dimensaoLargura', e.target.value)}
              placeholder="2,20"
              maxLength={4}
              className="text-center"
            />
          </div>
          <span className="text-lg font-bold text-muted-foreground px-2">×</span>
          <div className="flex-1">
            <Input
              value={values.dimensaoComprimento}
              onChange={(e) => onDimensaoChange('dimensaoComprimento', e.target.value)}
              placeholder="1,10"
              maxLength={4}
              className="text-center"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Serviço</Label>
        <div className="flex gap-2">
          <Select value={values.tipoServico} onValueChange={(v) => onChange('tipoServico', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o tipo de serviço" />
            </SelectTrigger>
            <SelectContent>
              {tiposServicoDisponiveis.map((ts) => (
                <div key={ts} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                  <SelectItem value={ts} className="flex-1 border-0 p-0 focus:bg-transparent">
                    {ts}
                  </SelectItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTipoServicoParaExcluir(ts);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovoTipoServicoAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Preço Unitário
        </Label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={values.precoUnitario}
          onChange={(e) => onChange('precoUnitario', e.target.value)}
          placeholder="Ex: 199.90"
        />
      </div>

      <div className="space-y-2">
        <Label>Espuma</Label>
        <div className="flex gap-2">
          <Select value={values.espuma} onValueChange={(v) => onChange('espuma', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione a espuma" />
            </SelectTrigger>
            <SelectContent>
              {espumasDisponiveis.map((es) => (
                <div key={es} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                  <SelectItem value={es} className="flex-1 border-0 p-0 focus:bg-transparent">
                    {es}
                  </SelectItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEspumaParaExcluir(es);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovaEspumaAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tecido</Label>
        <Input
          value={values.tecido}
          onChange={(e) => onChange('tecido', e.target.value)}
          placeholder="Especificação do tecido"
        />
      </div>

      <div className="space-y-2">
        <Label>Braço</Label>
        <div className="flex gap-2">
          <Select value={values.braco} onValueChange={(v) => onChange('braco', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o braço" />
            </SelectTrigger>
            <SelectContent>
              {bracosDisponiveis.map((b) => (
                <div key={b} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                  <SelectItem value={b} className="flex-1 border-0 p-0 focus:bg-transparent">
                    {b}
                  </SelectItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBracoParaExcluir(b);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovoBracoAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Pé</Label>
        <div className="flex gap-2">
          <Select value={values.tipoPe} onValueChange={(v) => onChange('tipoPe', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o tipo de pé" />
            </SelectTrigger>
            <SelectContent>
              {tiposPeDisponiveis.map((tp) => (
                <div key={tp} className="flex items-center justify-between group hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm cursor-pointer">
                  <SelectItem value={tp} className="flex-1 border-0 p-0 focus:bg-transparent">
                    {tp}
                  </SelectItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTipoPeParaExcluir(tp);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setModalNovoTipoPeAberto(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Observações</Label>
        <Textarea
          value={values.observacoes}
          onChange={(e) => onChange('observacoes', e.target.value)}
          placeholder="Observações adicionais sobre o produto"
          rows={2}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Etapas Necessárias</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Selecione as etapas de produção onde este pedido deve aparecer. Clique para selecionar/deselecionar.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {etapasDisponiveis.map((etapa) => {
            const isSelected = etapasSelecionadas.includes(etapa);
            const etapaLabel: Record<string, string> = {
              marcenaria: 'Marcenaria',
              corte_costura: 'Corte Costura',
              espuma: 'Espuma',
              bancada: 'Bancada',
              tecido: 'Tecido',
            };
            const label = etapaLabel[etapa] || etapa;
            return (
              <Button
                key={etapa}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                className={`h-12 text-sm font-medium transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}
                onClick={() => onToggleEtapa(etapa)}
              >
                {label}
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
      </div>
    </div>
  );
};

export default ProdutoCampos;
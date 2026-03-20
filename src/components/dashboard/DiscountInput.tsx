import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent } from 'lucide-react';
import { formatCurrencyInput } from '@/lib/utils';

interface DiscountInputProps {
  price: number;
  discountType: 'percentage' | 'fixed';
  discountValue: string | number;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
  onDiscountValueChange: (value: string | number) => void;
  label?: string;
}

const parseValor = (v: string | number) => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const DiscountInput: React.FC<DiscountInputProps> = ({
  price,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  label = "Desconto"
}) => {
  const numDiscountValue = useMemo(() => parseValor(discountValue), [discountValue]);

  const finalPrice = useMemo(() => {
    if (!price) return 0;
    if (discountType === 'percentage') {
      return price * (1 - numDiscountValue / 100);
    } else {
      return Math.max(0, price - numDiscountValue);
    }
  }, [price, discountType, numDiscountValue]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={discountType}
          onValueChange={(v) => onDiscountTypeChange(v as 'percentage' | 'fixed')}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <span>%</span>
              </div>
            </SelectItem>
            <SelectItem value="fixed">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>R$</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type={discountType === 'percentage' ? "number" : "text"}
          inputMode={discountType === 'percentage' ? "numeric" : "decimal"}
          min={discountType === 'percentage' ? "0" : undefined}
          step={discountType === 'percentage' ? "1" : undefined}
          max={discountType === 'percentage' ? "100" : undefined}
          value={discountValue || ''}
          onChange={(e) => {
            if (discountType === 'percentage') {
              onDiscountValueChange(parseFloat(e.target.value) || 0);
            } else {
              onDiscountValueChange(formatCurrencyInput(e.target.value));
            }
          }}
          placeholder={discountType === 'percentage' ? "Ex: 10" : "Ex: 50,00"}
          className="flex-1"
        />
      </div>

      {price > 0 && (numDiscountValue > 0) && (
        <div className="text-sm text-muted-foreground mt-1">
          <span className="line-through mr-2">
            {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="font-bold text-green-600">
            {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}
    </div>
  );
};

export default DiscountInput;

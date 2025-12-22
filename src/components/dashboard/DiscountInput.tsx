import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent } from 'lucide-react';

interface DiscountInputProps {
  price: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
  onDiscountValueChange: (value: number) => void;
  label?: string;
}

const DiscountInput: React.FC<DiscountInputProps> = ({
  price,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  label = "Desconto"
}) => {
  const finalPrice = useMemo(() => {
    if (!price) return 0;
    if (discountType === 'percentage') {
      return price * (1 - discountValue / 100);
    } else {
      return Math.max(0, price - discountValue);
    }
  }, [price, discountType, discountValue]);

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
          type="number"
          min="0"
          step={discountType === 'percentage' ? "1" : "0.01"}
          max={discountType === 'percentage' ? "100" : undefined}
          value={discountValue || ''}
          onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
          placeholder={discountType === 'percentage' ? "Ex: 10" : "Ex: 50.00"}
          className="flex-1"
        />
      </div>
      
      {price > 0 && (discountValue > 0) && (
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

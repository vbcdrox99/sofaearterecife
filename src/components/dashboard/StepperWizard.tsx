import { motion } from 'framer-motion';
import { Check, User, Calendar, Package, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepConfig {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    label: 'Cliente',
    description: 'Cliente e vendedor',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 2,
    label: 'Entrega',
    description: 'Número e data',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 3,
    label: 'Produto',
    description: 'Especificações',
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: 4,
    label: 'Detalhes',
    description: 'Financeiro e fotos',
    icon: <DollarSign className="w-4 h-4" />,
  },
];

interface StepperWizardProps {
  currentStep: number;
}

export function StepperWizard({ currentStep }: StepperWizardProps) {
  const totalSteps = STEPS.length;
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-8 px-2">
      {/* Barra de progresso */}
      <div className="relative mb-6">
        {/* Track cinza */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-6" />
        {/* Track preenchido */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-primary mx-6 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progressPercent / 100 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ right: 'auto', width: `calc(${progressPercent}% - 1.5rem)` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                {/* Círculo do step */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-background',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary bg-primary/10 shadow-md shadow-primary/20',
                    isPending && 'border-border text-muted-foreground bg-background'
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </motion.div>

                {/* Label e descrição */}
                <div className="flex flex-col items-center text-center">
                  <span
                    className={cn(
                      'text-xs font-semibold transition-colors duration-200',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block max-w-[80px] leading-tight mt-0.5">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface SofaValleri {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  dimensions: string;
  materials: string[];
  images: string[];
  isNew?: boolean;
}

export const CATEGORIAS_VALLERI = [
  "Todos",
  "Assinatura",
  "Familia",
  "Minimalista",
  "Modulares"
];

export const SOFAS_VALLERI: SofaValleri[] = [
  {
    id: "imperial-family",
    name: "Imperial Family",
    description: "Espaço e conforto absolutos para toda a família.",
    longDescription: "Desenhado com proporções generosas, o Imperial Family é o epicentro do convívio. Seu estofamento profundo e molas ensacadas duplas garantem que a elegância não sacrifique o aconchego das noites de cinema em casa.",
    price: 8900,
    dimensions: "3.20m x 1.80m x 0.95m",
    materials: ["Linho Nobre Off-White", "Estrutura de Madeira Maciça", "Espuma D33 Soft"],
    images: [
      "/1.jpg",
      "/1.jpg"
    ],
    isNew: true
  },
  {
    id: "carbon-elegance",
    name: "Carbon Elegance",
    description: "Minimalismo metálico e tons profundos.",
    longDescription: "Uma afirmação de design moderno. O Carbon Elegance mescla um tecido tecnológico em tom grafite escuro com pés discretos em metal prateado, evocando a sofisticação de um estúdio de alta costura.",
    price: 6500,
    dimensions: "2.40m x 1.00m x 0.85m",
    materials: ["Veludo Carbono", "Pés Metálicos Prateados", "Plumas de Ganso Sintéticas"],
    images: [
      "/2.jpg",
      "/2.jpg"
    ]
  },
  {
    id: "ruby-velvet",
    name: "Ruby Velvet Signature",
    description: "O toque de paixão no seu salão principal.",
    longDescription: "Nossa peça conceitual. O Ruby Velvet utiliza um veludo italiano num tom vermelho vinho profundo. É a fusão perfeita entre a ousadia artística e o clássico atemporal.",
    price: 7200,
    dimensions: "2.80m x 1.10m x 0.88m",
    materials: ["Veludo Italiano Vinho", "Detalhes em Aço Escovado", "Percintas Elásticas Premium"],
    images: [
      "/3.jpg",
      "/3.jpg"
    ]
  },
  {
    id: "luna-curve",
    name: "Luna Curve",
    description: "Fluidez orgânica que abraça o ambiente.",
    longDescription: "Com formas curvas inspiradas no movimento suave das dunas, o Luna rompe a rigidez das salas tradicionais, oferecendo um convite visual ao relaxamento imediato.",
    price: 5800,
    dimensions: "2.60m x 1.15m x 0.80m",
    materials: ["Bouclé Branco Neve", "Design Orgânico", "Espuma D28 Alta Resiliência"],
    images: [
      "/4.jpg",
      "/4.jpg"
    ]
  }
];

export const SERVICOS_VALLERI = [
  {
    title: "Consultoria Domiciliar",
    desc: "Nossos designers vão até você para medir e harmonizar.",
    icon: "Home"
  },
  {
    title: "Alta Alfaiataria",
    desc: "Costuras precisas e tecidos importados selecionados a dedo.",
    icon: "Scissors"
  },
  {
    title: "Entrega White-Glove",
    desc: "Instalação cuidadosa e impecável por nossa equipe treinada.",
    icon: "Truck"
  }
];

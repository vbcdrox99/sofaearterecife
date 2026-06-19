export interface Sofa {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  dimensions: string;
  fabrics: string[];
  details: string[];
  whatsappText: string;
}

export const SOFAS: Sofa[] = [
  {
    id: "aurora-organico",
    name: "Aurora Orgânico",
    category: "Orgânicos",
    price: 4890,
    description: "Inspirado nas curvas fluidas da natureza, o Aurora traz leveza e fluidez para ambientes contemporâneos. Uma verdadeira escultura de conforto revestida em bouclé premium.",
    images: ["/images/sofa_organico.png"],
    dimensions: "2.50m (L) x 1.15m (P) x 0.85m (A)",
    fabrics: ["Bouclé Premium Creme", "Linho Cinza Soft", "Chenille Off-White"],
    details: [
      "Estrutura em madeira de eucalipto imunizada e tratada",
      "Espuma de alta resiliência D30 com manta siliconada",
      "Design curvo ergonômico autoral",
      "Base recuada em madeira maciça com tom carvalho"
    ],
    whatsappText: "Olá! Gostaria de fazer um orçamento sob medida para o Sofá Aurora Orgânico."
  },
  {
    id: "quadra-modular",
    name: "Quadra Modular",
    category: "Modulares",
    price: 5990,
    description: "Módulos independentes e versáteis que permitem criar a configuração perfeita para sua sala. O design minimalista de linhas retas e costuras invisíveis expressa a modernidade urbana.",
    images: ["/images/sofa_modular.png"],
    dimensions: "3.20m (L) x 1.80m (P) x 0.80m (A) - Configuração 4 Módulos",
    fabrics: ["Linho Rústico Grafite", "Camurça Sintética Preta", "Linho Mescla Prata"],
    details: [
      "Sistema de engate invisível para união dos módulos",
      "Assentos com molas ensacadas individuais",
      "Módulos configuráveis (com braço, sem braço, puff, chaise)",
      "Pés em aço carbono com acabamento preto fosco"
    ],
    whatsappText: "Olá! Tenho interesse no Sofá Quadra Modular. Gostaria de entender as opções de configuração."
  },
  {
    id: "versatile-retratil",
    name: "Versatile Retrátil",
    category: "Retráteis",
    price: 5290,
    description: "O máximo conforto sem abrir mão da estética sofisticada. Mecanismo retrátil em aço carbono de funcionamento suave, perfeito para sessões de cinema em família com estilo e elegância.",
    images: ["/images/sofa_retratil.png"],
    dimensions: "2.60m (L) x 1.20m/1.75m (P) x 0.90m (A)",
    fabrics: ["Veludo Premium Verde Oliva", "Veludo Soft Cinza Chumbo", "Linho Premium Off-White"],
    details: [
      "Mecanismo retrátil em aço carbono com pintura epóxi",
      "Encosto reclinável com 5 estágios e almofadas de fibra siliconada",
      "Assento com espuma D33 e molas ensacadas de alta densidade",
      "Acabamento com costura pespontada dupla"
    ],
    whatsappText: "Olá! Gostaria de mais informações e opções de tecidos para o Sofá Versatile Retrátil."
  },
  {
    id: "monolith-minimal",
    name: "Monolith Minimalista",
    category: "Minimalistas",
    price: 4490,
    description: "Uma peça única de formas puras e proporções perfeitas. O Monolith é desenhado para quem busca sobriedade visual e elegância arquitetônica.",
    images: ["/images/sofa_modular.png"], // Reusing high-quality render
    dimensions: "2.20m (L) x 0.95m (P) x 0.78m (A)",
    fabrics: ["Bouclé Cinza Claro", "Linho Puro Areia", "Couro Ecológico Preto"],
    details: [
      "Design monobloco com braços integrados largos",
      "Suspensão com percintas elásticas italianas de alta resistência",
      "Pés invisíveis com sapatas niveladoras anti-risco",
      "Conforto firme com estabilidade excepcional"
    ],
    whatsappText: "Olá! Quero um orçamento sob medida para o Sofá Monolith Minimalista."
  }
];

export const CATEGORIES = ["Todos", "Orgânicos", "Modulares", "Retráteis", "Minimalistas"];

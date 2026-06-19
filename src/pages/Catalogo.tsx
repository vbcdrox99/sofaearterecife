import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Heart, 
  ArrowLeft, 
  MessageCircle, 
  Check, 
  Sliders, 
  ChevronRight,
  Sparkles,
  X,
  Compass
} from "lucide-react";
import { SOFAS, CATEGORIES, Sofa } from "../data/sofas";

// Mapping fabric names to color codes representing their physical textures/shades
const FABRIC_COLORS: Record<string, { hex: string; desc: string }> = {
  "Bouclé Premium Creme": { hex: "#EBE7DD", desc: "Textura felpuda e macia" },
  "Linho Cinza Soft": { hex: "#8E9094", desc: "Trama média de linho natural" },
  "Chenille Off-White": { hex: "#F3EFE9", desc: "Fios macios entrelaçados" },
  "Linho Rústico Grafite": { hex: "#34363A", desc: "Trama encorpada e robusta" },
  "Camurça Sintética Preta": { hex: "#1A1A1C", desc: "Toque acamurçado aveludado" },
  "Linho Mescla Prata": { hex: "#BDC1C6", desc: "Fios mesclados prata e cinza" },
  "Veludo Premium Verde Oliva": { hex: "#3A463B", desc: "Veludo italiano de alto brilho" },
  "Veludo Soft Cinza Chumbo": { hex: "#2C2E30", desc: "Toque aveludado fosco" },
  "Linho Premium Off-White": { hex: "#EDEBE4", desc: "Trama fina de linho puro" },
  "Bouclé Cinza Claro": { hex: "#CFD2D6", desc: "Textura bouclé contemporânea" },
  "Linho Puro Areia": { hex: "#D6C3A9", desc: "Tom quente de linho cru" },
  "Couro Ecológico Preto": { hex: "#121213", desc: "Couro sintético microtexturizado" }
};

// Poetic designer notes for each sofa
const DESIGNER_NOTES: Record<string, string> = {
  "aurora-organico": "O Aurora desafia a rigidez retilínea tradicional. Cada contorno foi desenhado para acompanhar a ergonomia natural do corpo, agindo como uma escultura viva que ancora a sala.",
  "quadra-modular": "Linhas puras e volumetria monolítica. O Quadra é um exercício de arquitetura interna: módulos autônomos que funcionam como blocos de construção para moldar o espaço de convivência.",
  "versatile-retratil": "Desenvolvido com o desafio de ocultar a engenharia mecânica. Quando recolhido, possui a estética esguia de um sofá fixo italiano; quando aberto, revela uma chaise profunda de relaxamento.",
  "monolith-minimal": "Proporção áurea em escala estofada. A ausência de pés visíveis cria a ilusão de que o sofá flutua levemente a poucos centímetros do chão, ressaltando o volume escultural de seus braços."
};

export default function Catalogo() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedSofa, setSelectedSofa] = useState<Sofa>(SOFAS[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFabric, setSelectedFabric] = useState(selectedSofa.fabrics[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "especificacoes">("design");

  // Update fabric selection when sofa changes
  React.useEffect(() => {
    setSelectedFabric(selectedSofa.fabrics[0]);
  }, [selectedSofa]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const filteredSofas = SOFAS.filter(sofa => {
    const matchesCategory = selectedCategory === "Todos" || sofa.category === selectedCategory;
    const matchesSearch = sofa.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sofa.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleWhatsAppQuote = (sofa: Sofa) => {
    const text = encodeURIComponent(
      `${sofa.whatsappText}\n\n*Especificações Selecionadas:*\n- Tecido: ${selectedFabric}\n- Dimensões Padrão: ${sofa.dimensions}`
    );
    window.open(`https://wa.me/5581999999999?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#0A0A0A] font-sans antialiased overflow-x-hidden relative selection:bg-red-600 selection:text-white">
      
      {/* 1. Fine technical grid pattern background (Silver/Grey) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "35px 35px"
        }}
      />

      {/* 2. SVG Noise/Grain Texture Overlay (Makes backgrounds look like fine textured plaster/paper) */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
        </filter>
      </svg>
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.08] bg-transparent z-40" 
        style={{ filter: "url(#noiseFilter)" }}
      />

      {/* 3. Subtle background warm/red lights for depth */}
      <div className="absolute top-[5%] left-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.035)_0%,transparent_60%)] rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_50%)] rounded-full blur-[100px] pointer-events-none" />

      {/* ================= NAVBAR ================= */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30">
        <div className="max-w-[1300px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-black transition-colors duration-300 group font-mono font-bold"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Painel</span>
            </Link>
            <span className="h-4 w-[1px] bg-neutral-200" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 block animate-pulse" />
              <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-neutral-500">Recife-PE</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-[0.3em] text-black">VALLERI</h1>
            <p className="text-[8px] tracking-[0.4em] uppercase text-red-500 -mt-0.5 font-mono">ESTOFADOS SOB MEDIDA</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span>MOD.2026</span>
          </div>
        </div>
      </nav>

      {/* ================= MAIN HERO / INTRODUCTION ================= */}
      <header className="max-w-[1300px] mx-auto px-6 pt-12 pb-8 relative">
        {/* Editorial style crosshairs (+) decoration */}
        <span className="absolute top-2 left-6 text-[10px] text-neutral-300 font-mono pointer-events-none">+</span>
        <span className="absolute top-2 right-6 text-[10px] text-neutral-300 font-mono pointer-events-none">+</span>

        <div className="max-w-4xl">
          <span className="text-[10px] uppercase tracking-[0.35em] text-red-500 font-bold block mb-2 font-mono">
            // ALTA ALFAIATARIA EM ESTOFADOS
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
            A arte de dar forma ao seu espaço. 
            <span className="block font-serif italic font-normal text-neutral-500 mt-2 text-3xl sm:text-4xl lg:text-5xl">
              Sofás projetados sob medida para viver e inspirar.
            </span>
          </h2>
          <p className="text-sm text-neutral-600 mt-6 max-w-2xl leading-relaxed">
            Criamos estofados exclusivos com foco no minimalismo, simetria e conforto ergonômico.
            Produção local artesanal voltada para quem valoriza a elegância acessível e o design autoral.
          </p>
        </div>
      </header>

      {/* ================= FILTERS & SEARCH ROW ================= */}
      <section className="max-w-[1300px] mx-auto px-6 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Category Selector */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 font-mono ${
                  selectedCategory === category 
                    ? "bg-black text-white border-black font-bold shadow-md shadow-black/10" 
                    : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:text-black"
                }`}
              >
                <span>{category}</span>
                {selectedCategory === category && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex items-center w-full md:max-w-xs">
            <Search size={14} className="absolute left-3.5 text-neutral-400" />
            <input 
              type="text"
              placeholder="Buscar modelo no catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black/35 focus:bg-white w-full transition-all duration-300 font-mono"
            />
          </div>

        </div>
      </section>

      {/* ================= PRODUCT CATALOG GRID ================= */}
      <main className="max-w-[1300px] mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          
          {/* Decorative grid corner points */}
          <span className="absolute -top-3 -left-3 text-[10px] text-neutral-300 font-mono pointer-events-none">+</span>
          <span className="absolute -bottom-3 -right-3 text-[10px] text-neutral-300 font-mono pointer-events-none">+</span>

          <AnimatePresence mode="popLayout">
            {filteredSofas.map((sofa) => {
              const isSelected = selectedSofa.id === sofa.id;
              return (
                <motion.div
                  layout
                  key={sofa.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => {
                    setSelectedSofa(sofa);
                    setIsDetailOpen(true);
                  }}
                  className={`group bg-white rounded-3xl overflow-hidden cursor-pointer border p-4 flex flex-col justify-between transition-all duration-400 relative ${
                    isSelected 
                      ? "border-red-500 shadow-xl shadow-red-900/5 ring-1 ring-red-500/25" 
                      : "border-neutral-200/80 hover:border-neutral-400 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {/* Subtle index tag */}
                  <span className="absolute top-3 left-4 text-[8px] text-neutral-300 font-mono group-hover:text-red-500 transition-colors">
                    // MODEL.{sofa.id.substring(0, 3).toUpperCase()}
                  </span>

                  {/* Heart button */}
                  <button 
                    onClick={(e) => toggleFavorite(sofa.id, e)}
                    className="absolute top-3 right-4 p-2.5 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 hover:border-neutral-200 transition-all duration-300 z-10"
                  >
                    <Heart 
                      size={13} 
                      className={favorites.includes(sofa.id) ? "fill-red-600 text-red-600 animate-pulse" : "text-neutral-400 group-hover:text-black"} 
                    />
                  </button>

                  {/* Sofa Image Frame */}
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-neutral-50 relative border border-neutral-100">
                    <img 
                      src={sofa.images[0]} 
                      alt={sofa.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/95 border border-neutral-200 px-2.5 py-0.5 rounded-md text-[8px] text-neutral-500 font-bold font-mono tracking-wider shadow-sm">
                      {sofa.category.toUpperCase()}
                    </div>
                  </div>

                  {/* Description Info */}
                  <div>
                    <div className="flex justify-between items-baseline gap-2 mb-1.5">
                      <h3 className="text-base font-extrabold tracking-tight text-neutral-900 group-hover:text-red-600 transition-colors">
                        {sofa.name}
                      </h3>
                      <span className="text-xs font-bold text-neutral-500 font-mono">
                        A partir de R$ {sofa.price.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {sofa.description}
                    </p>
                  </div>

                  {/* Action Link Row */}
                  <div className="mt-5 flex items-center justify-between pt-3.5 border-t border-neutral-100">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-widest group-hover:text-red-600 transition-colors flex items-center gap-1.5 font-mono font-bold">
                      <Sparkles size={11} className="text-neutral-400 group-hover:text-red-500" />
                      //ver_detalhes
                    </span>
                    <div className="w-6 h-6 rounded-full bg-neutral-50 group-hover:bg-red-500 flex items-center justify-center transition-colors duration-300">
                      <ChevronRight 
                        size={12} 
                        className="text-neutral-600 group-hover:text-white transition-colors duration-300" 
                      />
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* ================= SLIDE-OVER DRAWER (DETAILS VIEW) ================= */}
      {/* Dynamic Slide-over layout from the right on Desktop, bottom-sheet on Mobile */}
      <AnimatePresence>
        {isDetailOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-40"
            />

            {/* Slide-over details panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-[480px] bg-white border-l border-neutral-200 z-50 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-red-50 border border-red-200 text-red-500 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    Sob Medida
                  </span>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-200/80 transition-colors border border-neutral-200 text-neutral-500 hover:text-black"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Body Scroll Content */}
              <div className="flex-1 p-6 space-y-6">
                
                {/* Product Title and ID */}
                <div>
                  <span className="text-[9px] text-neutral-400 font-mono tracking-widest block uppercase mb-1">
                    Coleção Valleri / ID: {selectedSofa.id.toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight text-neutral-900">
                    {selectedSofa.name}
                  </h3>
                </div>

                {/* Big Image Render with ambient backlight */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-200/80 relative shadow-inner p-1">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_60%)] blur-md pointer-events-none" />
                  <img 
                    src={selectedSofa.images[0]} 
                    alt={selectedSofa.name} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                {/* Custom Tabs (Design vs specs) */}
                <div className="flex border-b border-neutral-200 font-mono text-[10px]">
                  <button 
                    onClick={() => setActiveTab("design")}
                    className={`pb-2 pr-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "design" 
                        ? "text-black border-b-2 border-red-500 font-bold" 
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    /design e conceito
                  </button>
                  <button 
                    onClick={() => setActiveTab("especificacoes")}
                    className={`pb-2 px-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "especificacoes" 
                        ? "text-black border-b-2 border-red-500 font-bold" 
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    /ficha técnica
                  </button>
                </div>

                {/* Tab content panel */}
                <div className="min-h-[140px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "design" ? (
                      <motion.div
                        key="design-tab"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <p className="text-xs text-neutral-600 leading-relaxed italic font-serif">
                          "{DESIGNER_NOTES[selectedSofa.id] || selectedSofa.description}"
                        </p>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-bold">Estética Autoral</p>
                          <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                            Modelo desenhado para se adequar a salas contemporâneas, aliando a sofisticação da alta costura no estofado com a robustez e durabilidade estrutural.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="specs-tab"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4 text-xs"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-neutral-400 font-mono uppercase tracking-wider text-[9px]">Dimensões padrão</p>
                            <p className="font-bold text-neutral-800 mt-1">{selectedSofa.dimensions}</p>
                          </div>
                          <div>
                            <p className="text-neutral-400 font-mono uppercase tracking-wider text-[9px]">Estrutura</p>
                            <p className="text-neutral-800 mt-1">Madeira de Eucalipto Imunizado</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-neutral-400 font-mono uppercase tracking-wider text-[9px] mb-2">Especificações Técnicas</p>
                          <ul className="space-y-1.5">
                            {selectedSofa.details.map((detail, idx) => (
                              <li key={idx} className="text-neutral-600 flex items-start gap-2">
                                <Check size={11} className="text-red-500 mt-0.5 shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fabric Selector */}
                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-bold">Selecione o Tecido</p>
                    <span className="text-[10px] text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200 font-mono">
                      {selectedFabric}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {selectedSofa.fabrics.map((fabric) => {
                      const swatch = FABRIC_COLORS[fabric] || { hex: "#8E9094", desc: "" };
                      const isSelected = selectedFabric === fabric;
                      return (
                        <button
                          key={fabric}
                          title={`${fabric} - ${swatch.desc}`}
                          onClick={() => setSelectedFabric(fabric)}
                          className={`w-7 h-7 rounded-full border transition-all duration-300 flex items-center justify-center relative ${
                            isSelected 
                              ? "border-red-500 ring-2 ring-red-100 ring-offset-2 ring-offset-white scale-110 shadow-md" 
                              : "border-neutral-200 hover:border-neutral-400 hover:scale-105"
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-1 -right-1 border border-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Drawer Footer CTA */}
              <div className="p-5 border-t border-neutral-200 bg-neutral-50">
                <button 
                  onClick={() => handleWhatsAppQuote(selectedSofa)}
                  className="w-full bg-black text-white hover:bg-neutral-900 text-xs uppercase tracking-widest font-mono font-bold py-4 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 group shadow-lg shadow-black/10"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={14} className="fill-white text-white" />
                    //enviar_orcamento
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">R$ {selectedSofa.price.toLocaleString("pt-BR")}</span>
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-white border-t border-neutral-200/80 py-10 text-center text-xs text-neutral-400 font-mono relative mt-auto">
        <span className="absolute top-2 left-6 text-[8px] text-neutral-300 pointer-events-none">+</span>
        <span className="absolute top-2 right-6 text-[8px] text-neutral-300 pointer-events-none">+</span>
        <p className="text-neutral-500">VALLERI ATELIÊ ESTOFADOS • RECIFE-PE</p>
        <p className="text-[10px] text-neutral-400 mt-2">© 2026 Todos os direitos reservados. Feito sob medida.</p>
      </footer>

    </div>
  );
}

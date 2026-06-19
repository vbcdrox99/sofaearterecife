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
  Info,
  Layers,
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

// Poetic designer notes for each sofa to add "soul" and detail
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
    <div className="min-h-screen bg-[#050507] text-white font-sans antialiased overflow-x-hidden relative selection:bg-red-600 selection:text-white">
      
      {/* 1. Fine technical grid pattern background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px"
        }}
      />

      {/* 2. SVG Noise/Grain Texture Overlay */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0" />
        </filter>
      </svg>
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.06] bg-transparent z-40" 
        style={{ filter: "url(#noiseFilter)" }}
      />

      {/* 3. Floating Interactive Crimson & Silver Glow Orbs */}
      <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.06)_0%,transparent_60%)] rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[10%] right-[10%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_50%)] rounded-full blur-[110px] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
        
        {/* ================= LEFT COLUMN: STICKY DETAIL VIEW ================= */}
        <div className={`${
          isDetailOpen ? "fixed inset-0 z-50 flex" : "hidden lg:flex"
        } lg:col-span-5 col-span-1 lg:h-screen lg:sticky lg:top-0 flex-col justify-start lg:justify-between border-r border-neutral-900 bg-[#070709] p-5 sm:p-6 lg:p-8 overflow-y-auto`}>
          
          {/* Header Controls */}
          <div className="flex items-center justify-between z-10 w-full mb-6 lg:mb-4 flex-none">
            {/* Desktop link (always visible on desktop, goes to dashboard) */}
            <Link 
              to="/dashboard" 
              className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-300 group font-mono"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>/voltar</span>
            </Link>
            {/* Mobile close button (only visible in mobile detail overlay) */}
            <button 
              onClick={() => setIsDetailOpen(false)} 
              className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-300 group font-mono"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>/fechar</span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-neutral-600 font-mono tracking-wider">
                ID: {selectedSofa.id.toUpperCase()}
              </span>
              <button 
                onClick={(e) => toggleFavorite(selectedSofa.id, e)}
                className="p-2 rounded-full border border-neutral-900 bg-neutral-950/60 hover:border-red-950/60 hover:bg-red-950/15 transition-all duration-300"
              >
                <Heart 
                  size={15} 
                  className={favorites.includes(selectedSofa.id) ? "fill-red-600 text-red-600" : "text-neutral-400 hover:text-white"} 
                />
              </button>
            </div>
          </div>

          {/* Sofa Image and Backdrop Ambient Backlight */}
          <div className="relative flex-none lg:flex-1 flex flex-col justify-center items-center py-6 min-h-[300px] lg:min-h-0 shrink-0 select-none">
            
            {/* Ambient Red Glow right behind the sofa to give it POP and depth */}
            <div className="absolute w-[80%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.08)_0%,transparent_60%)] blur-2xl pointer-events-none" />

            {/* Large Watermark Title */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 0.8 }}
              className="absolute top-6 text-center pointer-events-none"
            >
              <h2 className="text-6xl sm:text-7xl font-extrabold tracking-[0.25em] text-white">VALLERI</h2>
              <p className="text-[10px] tracking-[0.4em] uppercase text-red-500 mt-1 font-mono">estofados de alfaiataria</p>
            </motion.div>

            {/* Sofa Photo Render */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSofa.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden relative group border border-neutral-900 bg-black/50 p-1"
              >
                {/* Tech blueprint corner indicators (+) inside the frame to add graphic texture */}
                <span className="absolute top-2 left-2 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
                <span className="absolute top-2 right-2 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
                <span className="absolute bottom-2 left-2 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
                <span className="absolute bottom-2 right-2 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
                
                <img 
                  src={selectedSofa.images[0]} 
                  alt={selectedSofa.name}
                  className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Glassmorphic Card Overlay */}
          <motion.div 
            layout
            className="bg-[#0f0f12]/95 backdrop-blur-xl text-white rounded-3xl p-5 sm:p-6 border border-neutral-800/80 shadow-2xl relative w-full overflow-hidden mt-4 lg:mt-0 flex-none shrink-0"
          >
            {/* Top border glowing crimson accent gradient */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
            
            {/* Card Corner indicators */}
            <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-700 font-mono">+</span>
            <span className="absolute top-2.5 right-2.5 text-[8px] text-neutral-700 font-mono">+</span>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] bg-red-950/20 border border-red-900/40 text-red-500 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 font-mono">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  Móvel Sob Medida
                </span>
                <motion.h3 
                  key={selectedSofa.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl sm:text-2xl font-extrabold tracking-tight text-white"
                >
                  {selectedSofa.name}
                </motion.h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-[10px] text-red-500 font-mono">
                  VL
                </div>
                <div className="text-[10px] leading-tight hidden sm:block">
                  <p className="font-semibold text-neutral-300">Design Valleri</p>
                  <p className="text-neutral-500 font-mono">ED. LIMITADA</p>
                </div>
              </div>
            </div>

            {/* Custom Tab selectors: Design vs technical sheet */}
            <div className="flex border-b border-neutral-900 mb-4 font-mono text-[10px]">
              <button 
                onClick={() => setActiveTab("design")}
                className={`pb-2 pr-4 uppercase tracking-widest transition-all duration-300 ${
                  activeTab === "design" 
                    ? "text-white border-b border-red-600 font-bold" 
                    : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                /inspiração
              </button>
              <button 
                onClick={() => setActiveTab("especificacoes")}
                className={`pb-2 px-4 uppercase tracking-widest transition-all duration-300 ${
                  activeTab === "especificacoes" 
                    ? "text-white border-b border-red-600 font-bold" 
                    : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                /ficha técnica
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[145px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeTab === "design" ? (
                  <motion.div
                    key="design"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                      "{DESIGNER_NOTES[selectedSofa.id] || selectedSofa.description}"
                    </p>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">Estética Proposta</p>
                      <p className="text-[10px] text-neutral-300 font-medium mt-0.5">
                        Linhas fluidas, encaixes discretos e design focado no minimalismo contemporâneo.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="specs"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px]">Dimensões padrão</p>
                        <p className="font-semibold text-neutral-300 mt-0.5">{selectedSofa.dimensions}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px]">Estrutura</p>
                        <p className="text-neutral-300 mt-0.5">Eucalipto Imunizado</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px] mb-1">Destaques estruturais</p>
                      <ul className="space-y-1">
                        {selectedSofa.details.map((detail, idx) => (
                          <li key={idx} className="text-[9px] text-neutral-400 flex items-start gap-1">
                            <Check size={9} className="text-red-500 mt-0.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fabric Selectors with real color indicators */}
              <div className="mt-4 pt-3 border-t border-neutral-900/60">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">Selecione o Tecido</p>
                  <span className="text-[9px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-mono">
                    {selectedFabric}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedSofa.fabrics.map((fabric) => {
                    const swatch = FABRIC_COLORS[fabric] || { hex: "#8E9094", desc: "" };
                    const isSelected = selectedFabric === fabric;
                    return (
                      <button
                        key={fabric}
                        title={`${fabric} - ${swatch.desc}`}
                        onClick={() => setSelectedFabric(fabric)}
                        className={`w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center relative ${
                          isSelected 
                            ? "border-red-500 ring-2 ring-red-950 ring-offset-2 ring-offset-[#0f0f12] scale-110" 
                            : "border-neutral-800 hover:border-neutral-600 hover:scale-105"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-1 -right-1 border border-black" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Call to Action Button */}
            <button 
              onClick={() => handleWhatsAppQuote(selectedSofa)}
              className="w-full bg-white text-black hover:bg-neutral-200 text-[10px] uppercase tracking-widest font-mono font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 group mt-6"
            >
              <span className="flex items-center gap-1.5">
                <MessageCircle size={14} className="fill-black text-black" />
                //SOLICITAR_ORÇAMENTO
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-700 font-bold">R$ {selectedSofa.price.toLocaleString("pt-BR")}</span>
                <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
          </motion.div>

        </div>

        {/* ================= RIGHT COLUMN: EXPLORER AND PRODUCTS GRID ================= */}
        <div className="lg:col-span-7 col-span-1 p-6 sm:p-8 lg:p-12 flex flex-col justify-between min-h-screen relative">
          
          {/* Decorative Corner crosshairs in the Explorer layout */}
          <span className="absolute top-4 left-4 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
          <span className="absolute top-4 right-4 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
          <span className="absolute bottom-4 left-4 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>
          <span className="absolute bottom-4 right-4 text-[9px] text-neutral-800 font-mono pointer-events-none">+</span>

          {/* Header Title and Search Bar */}
          <div className="mb-10 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold block mb-1.5 font-mono">
                  /COLEÇÃO_VALLERI_2026
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Design Moderno.
                  <span className="block text-neutral-500 font-normal mt-1 italic text-2xl sm:text-3xl">
                    Feito sob medida para o seu estilo.
                  </span>
                </h1>
              </div>

              {/* Search Input */}
              <div className="relative flex items-center w-full md:max-w-xs">
                <Search size={14} className="absolute left-3.5 text-neutral-500" />
                <input 
                  type="text"
                  placeholder="Buscar modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#101012]/80 border border-neutral-900 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-900/50 w-full transition-all duration-300 font-mono"
                />
              </div>
            </div>

            {/* Custom Modern Tag Pills Filter */}
            <div className="flex flex-wrap gap-2 mt-8">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 font-mono ${
                    selectedCategory === category 
                      ? "bg-white text-black border-white font-bold" 
                      : "bg-[#0d0d0f]/80 text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
                  }`}
                >
                  <span>{category}</span>
                  {selectedCategory === category && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 block animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 flex-1 mb-8">
            <AnimatePresence mode="popLayout">
              {filteredSofas.map((sofa) => (
                <motion.div
                  layout
                  key={sofa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => {
                    setSelectedSofa(sofa);
                    setIsDetailOpen(true);
                  }}
                  className={`group rounded-2xl overflow-hidden cursor-pointer border p-3.5 flex flex-col justify-between transition-all duration-300 relative ${
                    selectedSofa.id === sofa.id 
                      ? "bg-[#111114]/90 border-red-950/60 shadow-[0_0_20px_rgba(220,38,38,0.06)]" 
                      : "bg-[#0a0a0c]/80 backdrop-blur-sm border-neutral-900/80 hover:border-neutral-850 hover:shadow-[0_0_20px_rgba(255,255,255,0.015)]"
                  }`}
                >
                  {/* Subtle corner crosshair inside the card */}
                  <span className="absolute top-2 left-2 text-[8px] text-neutral-900 group-hover:text-red-950 font-mono transition-colors pointer-events-none">+</span>
                  <span className="absolute top-2 right-2 text-[8px] text-neutral-900 group-hover:text-red-950 font-mono transition-colors pointer-events-none">+</span>

                  {/* Heart / Favorite Button */}
                  <button 
                    onClick={(e) => toggleFavorite(sofa.id, e)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-black/70 backdrop-blur-md border border-neutral-900 hover:bg-black/90 transition-all duration-300 z-10"
                  >
                    <Heart 
                      size={13} 
                      className={favorites.includes(sofa.id) ? "fill-red-600 text-red-600" : "text-neutral-400 hover:text-white"} 
                    />
                  </button>

                  {/* Sofa Preview Image */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-neutral-950 relative border border-neutral-900">
                    <img 
                      src={sofa.images[0]} 
                      alt={sofa.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    
                    {/* Floating Monospace Tag inside the image */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-neutral-800 px-2 py-0.5 rounded text-[8px] text-neutral-400 font-mono tracking-widest">
                      {sofa.category.toUpperCase()}
                    </div>
                  </div>

                  {/* Info Row */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-red-400 transition-colors">
                        {sofa.name}
                      </h4>
                      <span className="text-xs font-semibold text-neutral-400 group-hover:text-white font-mono shrink-0">
                        R$ {sofa.price.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {sofa.description}
                    </p>
                  </div>

                  {/* Custom Minimalist Action Indicator */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-900/60">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-red-500 transition-colors flex items-center gap-1 font-mono">
                      <Sparkles size={11} className="text-neutral-500 group-hover:text-red-500" />
                      //ver_detalhes
                    </span>
                    <ChevronRight 
                      size={12} 
                      className="text-neutral-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" 
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Floating Sticky Bottom Bar (Reference: "Added 13 Pics") */}
          <div className="bg-[#0a0a0c]/90 border border-neutral-900/80 rounded-2xl p-4 flex items-center justify-between mt-auto backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Sliders size={13} className="text-red-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">Garantia & Origem</p>
                <p className="text-xs text-neutral-500">Produção Local em Recife • 5 Anos de Suporte Estrutural</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
              <span className="font-semibold text-white">{filteredSofas.length}</span>
              <span>/modelos</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

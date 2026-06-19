import React, { useState, useRef } from "react";
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
  Compass,
  ArrowUpRight
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

// Interactive card that captures mouse coordinates for a custom spotlight glow
function BentoCard({ 
  className = "", 
  onClick, 
  children 
}: { 
  className?: string; 
  onClick?: () => void; 
  children: React.ReactNode 
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border border-neutral-900 bg-[#0a0a0c]/85 hover:border-neutral-800 transition-all duration-500 group cursor-pointer ${className}`}
    >
      {/* Dynamic Cursor Spotlight Overlay (Crimson/Red) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(220, 38, 38, 0.07) 0%, transparent 60%)`
        }}
      />
      {/* Dynamic Cursor Spotlight Overlay (Silver/White) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"
        style={{
          background: `radial-gradient(150px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 255, 255, 0.02) 0%, transparent 50%)`
        }}
      />

      {/* Grid crosshairs (+) inside card corners */}
      <span className="absolute top-3 left-3 text-[8px] text-neutral-800 group-hover:text-red-900/60 font-mono transition-colors z-10 pointer-events-none">+</span>
      <span className="absolute top-3 right-3 text-[8px] text-neutral-800 group-hover:text-red-900/60 font-mono transition-colors z-10 pointer-events-none">+</span>
      <span className="absolute bottom-3 left-3 text-[8px] text-neutral-800 group-hover:text-red-900/60 font-mono transition-colors z-10 pointer-events-none">+</span>
      <span className="absolute bottom-3 right-3 text-[8px] text-neutral-800 group-hover:text-red-900/60 font-mono transition-colors z-10 pointer-events-none">+</span>

      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}

export default function Catalogo() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedSofa, setSelectedSofa] = useState<Sofa>(SOFAS[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFabric, setSelectedFabric] = useState(selectedSofa.fabrics[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "especificacoes">("design");

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
      
      {/* 1. Subtle blueprints grid backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.012]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* 2. SVG Turbulence Noise Filter (Adds organic matte/concrete paper texture) */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0" />
        </filter>
      </svg>
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.06] bg-transparent z-40" 
        style={{ filter: "url(#noiseFilter)" }}
      />

      {/* 3. Ambient animated glow orbs (Red/Crimson & Silver) */}
      <div className="absolute top-[-5%] left-[10%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.06)_0%,transparent_60%)] rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "12s" }} />
      <div className="absolute bottom-[20%] right-[5%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-full blur-[120px] pointer-events-none" />

      {/* ================= HEADER / BRAND NAVIGATION ================= */}
      <nav className="w-full border-b border-neutral-900 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1300px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-300 group font-mono font-bold"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>[ painel ]</span>
            </Link>
            <span className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 block animate-pulse" />
              <span className="text-[9px] tracking-[0.25em] uppercase font-mono text-neutral-400">Ateliê Recife</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-[0.3em] text-white">VALLERI</h1>
            <p className="text-[8px] tracking-[0.4em] uppercase text-red-500 -mt-0.5 font-mono">SOFÁS SOB MEDIDA</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span>VL-C.26</span>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <header className="max-w-[1300px] mx-auto px-6 pt-16 pb-12 relative">
        <span className="absolute top-4 left-6 text-[10px] text-neutral-800 font-mono pointer-events-none">+</span>
        <span className="absolute top-4 right-6 text-[10px] text-neutral-800 font-mono pointer-events-none">+</span>

        <div className="max-w-4xl">
          <span className="text-[10px] uppercase tracking-[0.35em] text-red-500 font-bold block mb-3 font-mono">
            // DESIGN DE ALTA ALFAIATARIA AO ALCANCE DO SEU LAR
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
            Sua sala merece design autoral.
            <span className="block font-serif italic font-normal text-neutral-400 mt-3 text-3xl sm:text-4xl lg:text-5xl">
              Proporções nobres e conforto sob medida para a vida real.
            </span>
          </h2>
          <p className="text-sm text-neutral-400 mt-6 max-w-2xl leading-relaxed">
            Na Valleri, criamos sofás sob medida projetados especificamente para a classe média que busca elegância e durabilidade. 
            Sem intermediários, com produção local em Recife e materiais nobres que transformam seu espaço.
          </p>
        </div>
      </header>

      {/* ================= CONTROLS: FILTERS & SEARCH ROW ================= */}
      <section className="max-w-[1300px] mx-auto px-6 mb-8">
        <div className="bg-[#0b0b0d]/90 border border-neutral-900 rounded-3xl p-4 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 font-mono ${
                  selectedCategory === category 
                    ? "bg-white text-black border-white font-bold shadow-md" 
                    : "bg-neutral-950 text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
                }`}
              >
                <span>{category}</span>
                {selectedCategory === category && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 block animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex items-center w-full md:max-w-xs">
            <Search size={14} className="absolute left-3.5 text-neutral-500" />
            <input 
              type="text"
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-950 border border-neutral-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-900/50 w-full transition-all duration-300 font-mono"
            />
          </div>

        </div>
      </section>

      {/* ================= BENTO GRID SHOWCASE CATALOG ================= */}
      <main className="max-w-[1300px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative">
          
          {/* Decorative outer crosshair nodes */}
          <span className="absolute -top-3 -left-3 text-[10px] text-neutral-800 font-mono pointer-events-none">+</span>
          <span className="absolute -bottom-3 -right-3 text-[10px] text-neutral-800 font-mono pointer-events-none">+</span>

          {/* Card 1: Brand Concept Card (Bento double-width - 2 cols) */}
          <BentoCard className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-between min-h-[260px] bg-gradient-to-br from-[#0c0c0f] to-[#08080a]">
            <div className="max-w-xl">
              <span className="text-[8px] bg-red-950/30 border border-red-900/50 text-red-500 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono mb-4">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                Destaque • Coleção 2026
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Matérias-primas nobres, cortes de alta alfaiataria e conforto cirúrgico.
              </h3>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Nossos sofás contam com estruturas em eucalipto tratada contra fungos e brocas, almofadas de assento com molas ensacadas de compressão responsiva e espumas selecionadas de alta resiliência (D30 a D33).
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-neutral-900/60 pt-4 mt-6">
              <div className="flex gap-6 text-[10px] text-neutral-500 font-mono">
                <span>/MADEIRA_MACIÇA</span>
                <span>/MOLAS_ENSACADAS</span>
                <span>/ESPUMA_D30</span>
              </div>
              <span className="text-[9px] text-red-500 font-mono tracking-wider">VALLERI ATELIÊ</span>
            </div>
          </BentoCard>

          {/* Sofa Cards mapping using the BentoCard layout */}
          {filteredSofas.map((sofa) => (
            <BentoCard 
              key={sofa.id}
              onClick={() => {
                setSelectedSofa(sofa);
                setIsDetailOpen(true);
              }}
              className="p-4 flex flex-col justify-between"
            >
              {/* Card Header Info */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <span className="text-[8px] text-neutral-500 font-mono tracking-widest uppercase">
                  // {sofa.category}
                </span>
                
                {/* Heart/Favorite */}
                <button 
                  onClick={(e) => toggleFavorite(sofa.id, e)}
                  className="p-1.5 rounded-full bg-black/60 border border-neutral-800/80 hover:border-red-950/60 hover:bg-red-950/15 transition-all duration-300"
                >
                  <Heart 
                    size={12} 
                    className={favorites.includes(sofa.id) ? "fill-red-600 text-red-600" : "text-neutral-400 group-hover:text-white"} 
                  />
                </button>
              </div>

              {/* Photo Frame */}
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-neutral-950 border border-neutral-900 relative">
                <img 
                  src={sofa.images[0]} 
                  alt={sofa.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                
                {/* Micro tech code floating in photo */}
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 border border-neutral-800 px-2 py-0.5 rounded text-[8px] text-neutral-400 font-mono tracking-widest">
                  VLR.{sofa.id.substring(0, 3).toUpperCase()}
                </div>
              </div>

              {/* Specs & Pricing */}
              <div>
                <div className="flex justify-between items-baseline gap-2 mb-1">
                  <h4 className="text-sm font-extrabold tracking-tight text-white group-hover:text-red-500 transition-colors">
                    {sofa.name}
                  </h4>
                  <span className="text-xs font-bold text-neutral-400 font-mono">
                    R$ {sofa.price.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                  {sofa.description}
                </p>
              </div>

              {/* Tech details footer */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-900/60">
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest group-hover:text-red-500 transition-colors flex items-center gap-1 font-mono font-bold">
                  <Sparkles size={11} className="text-neutral-500 group-hover:text-red-500" />
                  //ver_especificacoes
                </span>
                <div className="w-6 h-6 rounded-full bg-neutral-950 group-hover:bg-red-600 flex items-center justify-center transition-colors duration-300">
                  <ChevronRight 
                    size={12} 
                    className="text-neutral-500 group-hover:text-white transition-colors duration-300" 
                  />
                </div>
              </div>
            </BentoCard>
          ))}

          {/* Card 7: Fabric Showroom Card (Bento standard size) */}
          <BentoCard className="p-5 flex flex-col justify-between bg-gradient-to-b from-[#0a0a0c] to-[#050507]">
            <div>
              <span className="text-[8px] text-neutral-500 font-mono tracking-widest block uppercase mb-2">
                // SHOWROOM_TEXTURAS
              </span>
              <h4 className="text-sm font-extrabold text-white tracking-tight">Alfaiataria em Tecidos</h4>
              <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                Selecionamos tramas nobres para garantir a durabilidade e o toque agradável. Do toque aveludado italiano à rusticidade elegante do linho puro.
              </p>
            </div>

            {/* Micro visual grid of fabric color swatches */}
            <div className="grid grid-cols-6 gap-1.5 my-4 pt-3 border-t border-neutral-900/50">
              {Object.entries(FABRIC_COLORS).slice(0, 12).map(([name, swatch]) => (
                <div 
                  key={name}
                  title={name}
                  className="aspect-square rounded-full border border-neutral-800/80 cursor-help"
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>

            <div className="text-[9px] text-neutral-600 font-mono flex items-center justify-between">
              <span>+12 Opções</span>
              <span>/MOSTRUÁRIO</span>
            </div>
          </BentoCard>

        </div>
      </main>

      {/* ================= IMERSIVE SLIDE-OVER DRAWER (Sofa details) ================= */}
      <AnimatePresence>
        {isDetailOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Slide-over details drawer from the right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-[480px] bg-[#0c0c0f] border-l border-neutral-900 z-50 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-neutral-900/80 flex items-center justify-between bg-black/20">
                <span className="text-[9px] bg-red-950/30 border border-red-900/50 text-red-500 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  Valleri Atelier
                </span>
                
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Body Scroll Content */}
              <div className="flex-1 p-6 space-y-6">
                
                {/* Sofa Name and Reference Code */}
                <div>
                  <span className="text-[9px] text-neutral-500 font-mono tracking-widest block uppercase mb-1">
                    Coleção Valleri / ID: {selectedSofa.id.toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight text-white">
                    {selectedSofa.name}
                  </h3>
                </div>

                {/* Big Image Render with ambient backlight */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-neutral-900 relative shadow-inner p-1">
                  {/* Subtle red glowing backlight */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.08)_0%,transparent_60%)] blur-md pointer-events-none" />
                  
                  {/* Tech specs corner points */}
                  <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>
                  <span className="absolute top-2.5 right-2.5 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>
                  <span className="absolute bottom-2.5 left-2.5 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>
                  <span className="absolute bottom-2.5 right-2.5 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>
                  
                  <img 
                    src={selectedSofa.images[0]} 
                    alt={selectedSofa.name} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                {/* Custom Tech Tabs */}
                <div className="flex border-b border-neutral-900 font-mono text-[10px]">
                  <button 
                    onClick={() => setActiveTab("design")}
                    className={`pb-2 pr-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "design" 
                        ? "text-white border-b border-red-500 font-bold" 
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    /design e conceito
                  </button>
                  <button 
                    onClick={() => setActiveTab("especificacoes")}
                    className={`pb-2 px-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "especificacoes" 
                        ? "text-white border-b border-red-500 font-bold" 
                        : "text-neutral-500 hover:text-neutral-300"
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
                        <p className="text-xs text-neutral-400 leading-relaxed italic">
                          "{DESIGNER_NOTES[selectedSofa.id] || selectedSofa.description}"
                        </p>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono font-bold">Estética Autoral</p>
                          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
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
                            <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px]">Dimensões padrão</p>
                            <p className="font-bold text-neutral-200 mt-1">{selectedSofa.dimensions}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px]">Estrutura</p>
                            <p className="text-neutral-200 mt-1">Madeira de Eucalipto Imunizado</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-neutral-500 font-mono uppercase tracking-wider text-[9px] mb-2">Especificações Técnicas</p>
                          <ul className="space-y-1.5">
                            {selectedSofa.details.map((detail, idx) => (
                              <li key={idx} className="text-neutral-400 flex items-start gap-2">
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

                {/* Fabric Selector with real color circles */}
                <div className="pt-4 border-t border-neutral-900/60">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono font-bold">Selecione o Tecido</p>
                    <span className="text-[10px] text-neutral-300 bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-900 font-mono">
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
                              ? "border-red-500 ring-2 ring-red-950 ring-offset-2 ring-offset-[#0c0c0f] scale-110 shadow-md" 
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

              {/* Drawer Footer CTA */}
              <div className="p-5 border-t border-neutral-900 bg-black/30">
                <button 
                  onClick={() => handleWhatsAppQuote(selectedSofa)}
                  className="w-full bg-white text-black hover:bg-neutral-200 text-xs uppercase tracking-widest font-mono font-bold py-4 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 group shadow-lg"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={14} className="fill-black text-black" />
                    //enviar_orcamento
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-600 font-bold">R$ {selectedSofa.price.toLocaleString("pt-BR")}</span>
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-black/40 border-t border-neutral-900/80 py-12 text-center text-xs text-neutral-500 font-mono relative mt-auto">
        <span className="absolute top-4 left-6 text-[8px] text-neutral-800 pointer-events-none">+</span>
        <span className="absolute top-4 right-6 text-[8px] text-neutral-800 pointer-events-none">+</span>
        <p className="text-neutral-400">VALLERI ATELIÊ ESTOFADOS • RECIFE-PE</p>
        <p className="text-[10px] text-neutral-500 mt-2">© 2026 Todos os direitos reservados. Feito sob medida para a classe média brasileira.</p>
      </footer>

    </div>
  );
}

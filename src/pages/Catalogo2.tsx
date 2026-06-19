import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  Zap,
  Maximize2
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

// Technical specs and designer logs
const DESIGNER_NOTES: Record<string, string> = {
  "aurora-organico": "Sintonia orgânica inspirada no biomorfismo clássico. As curvas desafiam a geometria cartesiana rígida das salas tradicionais, criando um fluxo natural de circulação e relaxamento.",
  "quadra-modular": "Arquitetura interna configurável. Projetado como blocos de repouso estrutural independentes. Encaixes de engate invisível que permitem a adaptação aos diferentes ritos de moradia.",
  "versatile-retratil": "Engenharia mecânica integrada sob linhas de alfaiataria fina. Reclinação oculta por trilhos deslizantes pantográficos, oferecendo o conforto profundo de uma chaise longue com perfil limpo.",
  "monolith-minimal": "Exploração volumétrica monolítica. A base recuada suspende o sofá a poucos centímetros do chão, conferindo leveza visual a um bloco sólido de alta densidade estrutural."
};

// 3D Tilting Card Component to provide futuristic physics-based mouse reactions
const TiltingCard = ({ 
  sofa, 
  isSelected, 
  onSelect, 
  favorites, 
  toggleFavorite 
}: { 
  sofa: Sofa; 
  isSelected: boolean; 
  onSelect: () => void; 
  favorites: string[]; 
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Calculate rotation angles
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const tiltX = (yc - y) / 12; // Degrees
    const tiltY = (x - xc) / 12;

    cardRef.current.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      className={`group rounded-3xl overflow-hidden cursor-pointer border p-4 flex flex-col justify-between transition-all duration-300 relative bg-[#09090c]/70 backdrop-blur-md ${
        isSelected 
          ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30" 
          : "border-neutral-900 hover:border-neutral-800 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* 1. Dynamic Radial Cursor Glow Spotlight inside the card */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, rgba(239, 68, 68, 0.08), transparent 80%)`
          }}
        />
      )}

      {/* Futuristic graphic blueprints */}
      <span className="absolute top-3 left-4 text-[8px] text-neutral-800 group-hover:text-red-950 font-mono tracking-widest pointer-events-none select-none">
        SYS.VLR_{sofa.id.substring(0, 3).toUpperCase()}
      </span>
      <span className="absolute top-3 right-4 text-[8px] text-neutral-800 group-hover:text-red-950 font-mono pointer-events-none select-none">+</span>

      {/* Favorite Heart Button */}
      <button 
        onClick={(e) => toggleFavorite(sofa.id, e)}
        className="absolute top-5 right-5 p-2 rounded-full bg-black/60 border border-neutral-900 hover:bg-red-950/20 hover:border-red-900/50 transition-all duration-300 z-10"
      >
        <Heart 
          size={13} 
          className={favorites.includes(sofa.id) ? "fill-red-500 text-red-500 animate-pulse" : "text-neutral-500 hover:text-white"} 
        />
      </button>

      {/* Image Frame with hover pop-out */}
      <div 
        className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-black/50 relative border border-neutral-900"
        style={{ transform: "translateZ(15px)" }}
      >
        <img 
          src={sofa.images[0]} 
          alt={sofa.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
        
        {/* Floating monospace tags */}
        <div className="absolute bottom-3 left-3 bg-red-950/40 border border-red-900/40 px-2.5 py-0.5 rounded text-[8px] text-red-400 font-mono tracking-widest uppercase">
          {sofa.category}
        </div>
      </div>

      {/* Description Info */}
      <div style={{ transform: "translateZ(10px)" }}>
        <div className="flex justify-between items-baseline gap-2 mb-1.5">
          <h3 className="text-sm font-extrabold tracking-tight text-white group-hover:text-red-400 transition-colors">
            {sofa.name}
          </h3>
          <span className="text-xs font-bold text-neutral-400 group-hover:text-white font-mono">
            R$ {sofa.price.toLocaleString("pt-BR")}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
          {sofa.description}
        </p>
      </div>

      {/* Tech indicators footer */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-950/60 z-10">
        <span className="text-[9px] text-neutral-500 uppercase tracking-widest group-hover:text-red-400 transition-colors flex items-center gap-1.5 font-mono">
          <Sparkles size={11} className="text-neutral-700 group-hover:text-red-400" />
          //EXIBIR_PRODUTO
        </span>
        <div className="w-5 h-5 rounded-full bg-neutral-950 border border-neutral-900 group-hover:bg-red-600 group-hover:border-red-500 flex items-center justify-center transition-colors duration-300">
          <ChevronRight 
            size={11} 
            className="text-neutral-600 group-hover:text-white transition-colors duration-300" 
          />
        </div>
      </div>

    </div>
  );
};

export default function Catalogo2() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax hook setups using Framer Motion
  const { scrollYProgress } = useScroll();
  const yHeroText = useTransform(scrollYProgress, [0, 0.4], [0, -100]);
  const yHeroImage = useTransform(scrollYProgress, [0, 0.4], [0, 50]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedSofa, setSelectedSofa] = useState<Sofa>(SOFAS[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFabric, setSelectedFabric] = useState(selectedSofa.fabrics[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "especificacoes">("design");

  // Track coordinates for interactive graphic HUD
  const [coords, setCoords] = useState({ lat: -8.0539, lon: -34.8811 });

  useEffect(() => {
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

  // Mouse tracker for global HUD stats
  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    const deltaX = (e.clientX / window.innerWidth) * 0.005;
    const deltaY = (e.clientY / window.innerHeight) * 0.005;
    setCoords({
      lat: -8.0539 - deltaY,
      lon: -34.8811 - deltaX
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMoveGlobal}
      className="min-h-screen bg-[#030304] text-white font-sans antialiased overflow-x-hidden relative selection:bg-red-600 selection:text-white"
    >
      {/* 1. Monospace Technical Blueprint Grid */}
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

      {/* 2. SVG Grain Overlay for fine texture */}
      <svg className="hidden">
        <filter id="sciFiNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0" />
        </filter>
      </svg>
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.06] bg-transparent z-40" 
        style={{ filter: "url(#sciFiNoise)" }}
      />

      {/* 3. Liquid Colored Floating Orbs (Vibrant mesh look) */}
      <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_60%)] rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "12s" }} />
      <div className="absolute top-[40%] right-[5%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08)_0%,transparent_60%)] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "15s" }} />
      <div className="absolute bottom-[5%] left-[15%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06)_0%,transparent_60%)] rounded-full blur-[130px] pointer-events-none" />

      {/* HUD System Overlay (Floating digital labels) */}
      <div className="hidden lg:block fixed left-6 bottom-6 z-30 pointer-events-none font-mono text-[9px] text-neutral-600 space-y-1">
        <p>SYSTEM_LINK: ACTIVE</p>
        <p>LOC_RECIFE: {coords.lat.toFixed(5)}° S / {coords.lon.toFixed(5)}° W</p>
        <p>FPS_MONITOR: 60 / REFRESH_OK</p>
      </div>

      {/* ================= HIGH-IMPACT PARALLAX HERO SECTION ================= */}
      <section className="min-h-screen flex flex-col justify-between py-12 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        
        {/* Navigation bar integrated into hero */}
        <div className="flex justify-between items-center z-10 w-full max-w-[1300px] mx-auto">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>//RETORNAR_PAINEL</span>
          </Link>
          
          <div className="text-right">
            <h1 className="text-2xl font-extrabold tracking-[0.3em] bg-gradient-to-r from-white via-neutral-200 to-red-600 bg-clip-text text-transparent">VALLERI</h1>
            <p className="text-[8px] tracking-[0.4em] uppercase text-red-500 font-mono mt-0.5">ateliê tecnológico</p>
          </div>
        </div>

        {/* Hero Title and Parallax Elements */}
        <div className="max-w-[1300px] mx-auto w-full my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Text Column */}
          <motion.div 
            style={{ y: yHeroText, opacity: opacityHero }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-900/40 bg-red-950/20 text-red-400 font-mono text-[10px] uppercase tracking-widest">
              <Zap size={10} className="animate-bounce" />
              SÉRIE NEXUS 2026 / CONCEITO SOFISTICADO
            </div>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Estofados com <br />
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                DNA de Alta Costura.
              </span>
            </h2>
            
            <p className="text-sm sm:text-base text-neutral-400 max-w-xl leading-relaxed">
              Descubra um novo conceito onde a engenharia mecânica de ponta encontra o acabamento primoroso.
              Sofás moldados sob medida para transformar sua sala em um templo de conforto e modernidade.
            </p>

            <div className="flex gap-4 pt-4">
              <a 
                href="#catalog"
                className="bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all duration-300"
              >
                <span>EXPLORAR CATÁLOGO</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Right Parallax Image Column */}
          <motion.div 
            style={{ y: yHeroImage, opacity: opacityHero }}
            className="lg:col-span-5 flex justify-center relative min-h-[300px] lg:min-h-0"
          >
            {/* Tech blueprints circles behind the image */}
            <div className="absolute w-[360px] h-[360px] border border-neutral-900 rounded-full flex items-center justify-center animate-spin pointer-events-none opacity-40" style={{ animationDuration: "35s" }}>
              <div className="w-[300px] h-[300px] border border-dashed border-red-950 rounded-full" />
            </div>

            {/* Float hero sofa mock */}
            <div className="w-full max-w-[400px] aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-900 bg-black/60 p-1 flex items-center justify-center z-10 animate-pulse" style={{ animationDuration: "5s" }}>
              <img 
                src={SOFAS[0].images[0]} 
                alt="Valleri Premium Sofa" 
                className="w-[95%] h-[95%] object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </motion.div>

        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-between items-center w-full max-w-[1300px] mx-auto z-10 flex-none font-mono text-[9px] text-neutral-600">
          <span>COOR_REF: 8.0539° S, 34.8811° W</span>
          <div className="flex flex-col items-center gap-2">
            <span className="uppercase tracking-widest">SCROLL PARA BAIXO</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-neutral-600 to-transparent" />
          </div>
          <span>ED.04/2026</span>
        </div>

      </section>

      {/* ================= ACTIONS BAR (SEARCH & FILTER TABS) ================= */}
      <section id="catalog" className="max-w-[1300px] mx-auto px-6 mb-10 pt-20">
        <div className="bg-[#09090c]/80 border border-neutral-900/80 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4 relative">
          
          {/* Blueprint decorations inside actions bar */}
          <span className="absolute top-2 left-2 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>
          <span className="absolute bottom-2 right-2 text-[8px] text-neutral-800 font-mono pointer-events-none">+</span>

          {/* Navigation categories */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[9px] uppercase tracking-widest px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-1.5 font-mono ${
                  selectedCategory === category 
                    ? "bg-red-600 text-white border-red-500 font-bold shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                    : "bg-neutral-950/60 text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
                }`}
              >
                <span>{category}</span>
                {selectedCategory === category && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white block animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Real-time search bar */}
          <div className="relative flex items-center w-full md:max-w-xs">
            <Search size={14} className="absolute left-3.5 text-neutral-500" />
            <input 
              type="text"
              placeholder="Buscar por termo ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-950/60 border border-neutral-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-950/50 w-full transition-all duration-300 font-mono"
            />
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE 3D PRODUCT GRID ================= */}
      <main className="max-w-[1300px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          
          <AnimatePresence mode="popLayout">
            {filteredSofas.map((sofa) => (
              <motion.div
                layout
                key={sofa.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <TiltingCard
                  sofa={sofa}
                  isSelected={selectedSofa.id === sofa.id}
                  onSelect={() => {
                    setSelectedSofa(sofa);
                    setIsDetailOpen(true);
                  }}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              </motion.div>
            ))}
          </AnimatePresence>

        </div>
      </main>

      {/* ================= HIGH-TECH DETAILS SLIDE-OVER DRAWER ================= */}
      <AnimatePresence>
        {isDetailOpen && (
          <>
            {/* Dark glassmorphic backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-[480px] bg-[#09090c] border-l border-neutral-900 z-50 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              {/* Dynamic decorative red accent glow on drawer top */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
              
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-neutral-950 flex items-center justify-between bg-black/40 font-mono text-[9px]">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-red-950/40 border border-red-900/50 text-red-500 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    CONCEITO_NEXUS
                  </span>
                </div>
                
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-900 border border-neutral-900 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Scroll Body */}
              <div className="flex-1 p-6 space-y-6">
                
                {/* Product Titles */}
                <div>
                  <span className="text-[8px] text-red-500 font-mono tracking-widest block uppercase mb-1">
                    //ESTOFADO_SOB_MEDIDA_RECIFE
                  </span>
                  <h3 className="text-2xl font-extrabold tracking-tight text-white">
                    {selectedSofa.name}
                  </h3>
                </div>

                {/* Big Image Render with Red Backlight */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/50 border border-neutral-900 relative p-1">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0%,transparent_60%)] blur-md pointer-events-none" />
                  
                  {/* Design crosshairs inside drawer image */}
                  <span className="absolute top-2 left-2 text-[8px] text-neutral-800 font-mono">+</span>
                  <span className="absolute top-2 right-2 text-[8px] text-neutral-800 font-mono">+</span>
                  <span className="absolute bottom-2 left-2 text-[8px] text-neutral-800 font-mono">+</span>
                  <span className="absolute bottom-2 right-2 text-[8px] text-neutral-800 font-mono">+</span>

                  <img 
                    src={selectedSofa.images[0]} 
                    alt={selectedSofa.name} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                {/* Custom Console Tabs (/design vs /specs) */}
                <div className="flex border-b border-neutral-950 font-mono text-[9px]">
                  <button 
                    onClick={() => setActiveTab("design")}
                    className={`pb-2 pr-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "design" 
                        ? "text-red-500 border-b-2 border-red-500 font-bold" 
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    //CONCEITO
                  </button>
                  <button 
                    onClick={() => setActiveTab("especificacoes")}
                    className={`pb-2 px-4 uppercase tracking-widest transition-all duration-300 ${
                      activeTab === "especificacoes" 
                        ? "text-red-500 border-b-2 border-red-500 font-bold" 
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    //FICHA_TECNICA
                  </button>
                </div>

                {/* Tab content panel */}
                <div className="min-h-[140px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "design" ? (
                      <motion.div
                        key="concept-panel"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <p className="text-xs text-neutral-400 leading-relaxed italic">
                          "{DESIGNER_NOTES[selectedSofa.id] || selectedSofa.description}"
                        </p>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">Concepção Estética</p>
                          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                            Proporção balanceada desenhada pelo departamento de engenharia autoral da Valleri. Estruturas pensadas para aliar ergonomia de contato com estabilidade mecânica.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="specs-panel"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4 text-xs font-mono"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-neutral-500 uppercase tracking-wider text-[8px]">//MEDIDAS_PADRAO</p>
                            <p className="font-bold text-neutral-200 mt-1">{selectedSofa.dimensions}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500 uppercase tracking-wider text-[8px]">//ESTRUTURA_INTERNA</p>
                            <p className="text-neutral-200 mt-1">Eucalipto Imunizado</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-neutral-500 uppercase tracking-wider text-[8px] mb-2">//COMPONENTES_E_CONFORTO</p>
                          <ul className="space-y-1.5">
                            {selectedSofa.details.map((detail, idx) => (
                              <li key={idx} className="text-neutral-400 flex items-start gap-2 text-[10px]">
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

                {/* Fabric Selector Swatches */}
                <div className="pt-4 border-t border-neutral-950">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">//SELEÇÃO_DE_TECIDO</p>
                    <span className="text-[9px] text-red-400 bg-red-950/20 border border-red-900/30 px-2.5 py-0.5 rounded font-mono">
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
                              ? "border-red-500 ring-2 ring-red-900 ring-offset-2 ring-offset-[#09090c] scale-110 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
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
              <div className="p-5 border-t border-neutral-950 bg-black/30">
                <button 
                  onClick={() => handleWhatsAppQuote(selectedSofa)}
                  className="w-full bg-red-600 text-white hover:bg-red-500 text-xs uppercase tracking-widest font-mono font-bold py-4 px-4 rounded-xl flex items-center justify-between transition-all duration-300 group shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={14} className="fill-white text-white animate-pulse" />
                    //GERAR_ORÇAMENTO
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-100 font-bold">R$ {selectedSofa.price.toLocaleString("pt-BR")}</span>
                    <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-black/40 border-t border-neutral-950 py-12 text-center text-xs text-neutral-500 font-mono relative mt-auto">
        <span className="absolute top-2 left-6 text-[8px] text-neutral-800 pointer-events-none">+</span>
        <span className="absolute top-2 right-6 text-[8px] text-neutral-800 pointer-events-none">+</span>
        <p className="text-neutral-400">VALLERI ATELIÊ // NEXUS SERIES 2026 // RECIFE-PE</p>
        <p className="text-[10px] text-neutral-600 mt-2">© Todos os direitos reservados. Engenharia do conforto sob medida.</p>
      </footer>

    </div>
  );
}

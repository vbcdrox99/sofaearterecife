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
  Sparkles
} from "lucide-react";
import { SOFAS, CATEGORIES, Sofa } from "../data/sofas";

export default function Catalogo() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedSofa, setSelectedSofa] = useState<Sofa>(SOFAS[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFabric, setSelectedFabric] = useState(selectedSofa.fabrics[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    <div className="min-h-screen bg-[#060608] text-white font-sans antialiased overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Background ambient lights (Crimson/Red & Silver) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.06)_0%,transparent_60%)] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_50%)] rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
        
        {/* ================= LEFT COLUMN: STICKY DETAIL VIEW ================= */}
        <div className={`${
          isDetailOpen ? "fixed inset-0 z-50 flex" : "hidden lg:flex"
        } lg:col-span-5 col-span-1 lg:h-screen lg:sticky lg:top-0 flex-col justify-start lg:justify-between border-r border-neutral-900/60 overflow-y-auto bg-[#09090b] p-5 sm:p-6 lg:p-8`}>
          
          {/* Header Controls */}
          <div className="flex items-center justify-between z-10 w-full mb-6 lg:mb-4 flex-none">
            {/* Desktop link (always visible on desktop, goes to dashboard) */}
            <Link 
              to="/dashboard" 
              className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-300 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar</span>
            </Link>
            {/* Mobile close button (only visible in mobile detail overlay) */}
            <button 
              onClick={() => setIsDetailOpen(false)} 
              className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-300 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => toggleFavorite(selectedSofa.id, e)}
                className="p-2 rounded-full border border-neutral-900 bg-neutral-950/40 hover:border-red-950/60 hover:bg-red-950/10 transition-colors"
              >
                <Heart 
                  size={15} 
                  className={favorites.includes(selectedSofa.id) ? "fill-red-600 text-red-600" : "text-neutral-400 hover:text-white"} 
                />
              </button>
            </div>
          </div>

          {/* Sofa Image and Branding Area */}
          <div className="relative flex-none lg:flex-1 flex flex-col justify-center items-center py-6 min-h-[300px] lg:min-h-0 shrink-0">
            {/* Ambient Red Glow behind active sofa image */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.06)_0%,transparent_60%)] blur-2xl pointer-events-none" />

            {/* Branding Text Over Image */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 0.8 }}
              className="absolute top-6 text-center select-none pointer-events-none"
            >
              <h2 className="text-6xl sm:text-7xl font-extrabold tracking-[0.25em] text-white">VALLERI</h2>
              <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 mt-1">Estofados sob medida</p>
            </motion.div>

            {/* Main Sofa Image Render */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSofa.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden relative group border border-neutral-900 bg-black/40"
              >
                <img 
                  src={selectedSofa.images[0]} 
                  alt={selectedSofa.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Glassmorphic Card Overlay (Curved Bottom Sheet Style) */}
          <motion.div 
            layout
            className="bg-[#111113]/90 backdrop-blur-md text-white rounded-3xl p-5 sm:p-6 border border-neutral-800 shadow-2xl relative w-full overflow-hidden mt-4 lg:mt-0 flex-none shrink-0"
          >
            {/* Top border ambient light (Crimson Red) */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] bg-red-950/30 border border-red-900/50 text-red-400 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  Ateliê • Sob Medida
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

              {/* Designer Signature Info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-950/20 border border-red-900/40 flex items-center justify-center font-bold text-[11px] text-red-400">
                  VL
                </div>
                <div className="text-[10px] leading-tight hidden sm:block">
                  <p className="font-semibold text-neutral-200">Design Valleri</p>
                  <p className="text-neutral-500">Exclusivo</p>
                </div>
              </div>
            </div>

            {/* Details and Specs list */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Dimensões Padrão</p>
                <p className="text-xs font-semibold text-neutral-300">{selectedSofa.dimensions}</p>
              </div>

              {/* Fabric selection slider chips */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Escolha o Tecido</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSofa.fabrics.map((fabric) => (
                    <button
                      key={fabric}
                      onClick={() => setSelectedFabric(fabric)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        selectedFabric === fabric 
                          ? "bg-red-600 text-white border-red-600 font-semibold shadow-[0_0_10px_rgba(220,38,38,0.25)]" 
                          : "bg-neutral-900/70 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      {fabric}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specifications List */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Especificações do Modelo</p>
                <ul className="space-y-1">
                  {selectedSofa.details.map((detail, idx) => (
                    <li key={idx} className="text-[10px] text-neutral-400 flex items-start gap-1.5">
                      <Check size={10} className="text-red-500 mt-0.5 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Call to Action WhatsApp Button */}
            <button 
              onClick={() => handleWhatsAppQuote(selectedSofa)}
              className="w-full bg-white text-black hover:bg-neutral-200 text-xs uppercase tracking-widest font-bold py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 group"
            >
              <span className="flex items-center gap-1.5">
                <MessageCircle size={14} className="fill-black text-black" />
                Orçar no WhatsApp
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-700 font-medium">A partir de R$ {selectedSofa.price.toLocaleString("pt-BR")}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            <p className="text-[9px] text-center text-neutral-500 mt-3">
              *Desenvolvemos sob medida para sua sala de estar. Preço varia por tamanho e tecido.
            </p>
          </motion.div>

        </div>

        {/* ================= RIGHT COLUMN: EXPLORER AND PRODUCTS GRID ================= */}
        <div className="lg:col-span-7 col-span-1 p-6 sm:p-8 lg:p-12 flex flex-col justify-between min-h-screen">
          
          {/* Header Title and Search Bar */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold block mb-1">
                  Coleção Exclusiva
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
                  className="bg-[#121214]/60 border border-neutral-900 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-900/50 w-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Custom Modern Tag Pills Filter */}
            <div className="flex flex-wrap gap-2 mt-8">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-xs uppercase tracking-widest px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 ${
                    selectedCategory === category 
                      ? "bg-white text-black border-white font-bold" 
                      : "bg-[#111113] text-neutral-400 border-neutral-900 hover:border-neutral-800 hover:text-white"
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
                  className={`group rounded-2xl overflow-hidden cursor-pointer border p-3 flex flex-col justify-between transition-all duration-300 relative ${
                    selectedSofa.id === sofa.id 
                      ? "bg-[#121215] border-red-950/40 shadow-[0_0_15px_rgba(220,38,38,0.05)]" 
                      : "bg-[#0E0E10]/80 backdrop-blur-sm border-neutral-900 hover:border-neutral-800 hover:shadow-[0_0_20px_rgba(255,255,255,0.015)]"
                  }`}
                >
                  {/* Heart / Favorite Button */}
                  <button 
                    onClick={(e) => toggleFavorite(sofa.id, e)}
                    className="absolute top-5 right-5 p-2 rounded-full bg-black/60 backdrop-blur-md border border-neutral-800/50 hover:bg-black transition-colors duration-300 z-10"
                  >
                    <Heart 
                      size={13} 
                      className={favorites.includes(sofa.id) ? "fill-red-600 text-red-600" : "text-neutral-400 hover:text-white"} 
                    />
                  </button>

                  {/* Sofa Preview Image */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-neutral-900 relative border border-neutral-900">
                    <img 
                      src={sofa.images[0]} 
                      alt={sofa.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Info Row */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
                        {sofa.name}
                      </h4>
                      <span className="text-xs font-semibold text-neutral-400 group-hover:text-red-400 transition-colors shrink-0">
                        R$ {sofa.price.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {sofa.description}
                    </p>
                  </div>

                  {/* Custom Minimalist Action Indicator */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-900/60">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-red-500 transition-colors flex items-center gap-1">
                      <Sparkles size={11} className="text-neutral-500 group-hover:text-red-500" />
                      Ver Detalhes
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
          <div className="bg-gradient-to-r from-[#0E0E10] to-[#121215] border border-neutral-900 rounded-2xl p-4 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Sliders size={13} className="text-neutral-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Garantia & Entrega</p>
                <p className="text-xs text-neutral-500">Fabricação em Recife • Até 5 anos de garantia estrutural</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="font-semibold text-white">{filteredSofas.length}</span>
              <span>Modelos</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

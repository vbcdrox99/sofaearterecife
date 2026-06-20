import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { 
  Menu, 
  Search, 
  Home, 
  Sofa, 
  Phone, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
  Heart,
  X,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { SOFAS_VALLERI, CATEGORIAS_VALLERI, SERVICOS_VALLERI, SofaValleri } from "../data/mockValleri";

const ParallaxHeroBg = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], ["0%", "40%"]);
  
  return (
    <motion.div style={{ y }} className="absolute inset-0 w-full h-full pointer-events-none">
      <motion.img 
        initial={{ scale: 1.15, filter: "brightness(0.7)" }}
        animate={{ scale: 1, filter: "brightness(1)" }}
        transition={{ duration: 2, ease: "easeOut" }}
        src="/hero-bg.png" 
        alt="Interior de luxo" 
        className="w-full h-[120%] object-cover -top-[10%] relative"
      />
    </motion.div>
  );
};

export default function Catalogo2() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // For bottom nav
  const [selectedSofa, setSelectedSofa] = useState<SofaValleri | null>(null);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const filteredSofas = activeCategory === "Todos" 
    ? SOFAS_VALLERI 
    : SOFAS_VALLERI.filter(s => s.description.toLowerCase().includes(activeCategory.toLowerCase()) || s.name.toLowerCase().includes(activeCategory.toLowerCase()));

  // Google Fonts are imported directly in the inline style for encapsulation as requested.
  return (
    <div className="bg-[#18181B] text-[#F5F5F5] min-h-screen font-sans selection:bg-[#991B1B] selection:text-white pb-24 md:pb-0 relative"
      style={{
        fontFamily: "'Inter', sans-serif"
      }}>
      
      {/* Import Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Cinzel', serif; }
        .glass-panel {
          background: rgba(20, 20, 20, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ================= HEADER (Web + Mobile Hybrid) ================= */}
      <header className={`absolute md:fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'md:glass-panel py-4 md:py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col relative z-20">
            <span className="font-serif text-2xl tracking-[0.2em] font-bold text-white uppercase drop-shadow-md">Valleri</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#B0B8C1] font-semibold">Sob Medida</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => toast("Coleções: Em breve")} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Coleções</button>
            <button onClick={() => toast("Nossa Essência: Em breve")} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Nossa Essência</button>
            <button onClick={() => toast("Serviços: Em breve")} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Serviços</button>
            <button onClick={() => toast("Busca: Em breve")} className="text-sm font-medium text-white flex items-center gap-2">
              <Search size={16} />
              Buscar
            </button>
          </nav>

          {/* Mobile Menu Icon */}
          <button onClick={() => toast("Menu: Em breve")} className="md:hidden text-white">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[85vh] md:h-screen w-full flex items-center justify-center overflow-hidden bg-[#18181B]">
        {/* Background Image & Effects */}
        <div className="absolute inset-0 z-0">
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#18181B]/90 via-[#18181B]/70 to-[#18181B] z-10" />
          
          {/* Tech/Modern Glow Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#991B1B] blur-[120px] rounded-full z-10 mix-blend-screen"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-[#B0B8C1] blur-[150px] rounded-full z-10 mix-blend-screen"
          />

          {/* Subtle Grid Overlay for Tech Vibe */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] z-10 opacity-60 pointer-events-none" />

          <ParallaxHeroBg />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            {/* Elegant Subtitle */}
            <motion.div 
              className="flex items-center justify-center gap-4 mb-8"
            >
              <div className="h-px w-8 bg-[#B0B8C1]/50" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#B0B8C1] font-light">
                Nova Coleção 2026
              </span>
              <div className="h-px w-8 bg-[#B0B8C1]/50" />
            </motion.div>

            {/* Gradient Text */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-tight mb-6 drop-shadow-2xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
                O Coração da
              </span>
              <br/>
              <span className="italic font-light bg-clip-text text-transparent bg-gradient-to-r from-[#B0B8C1] to-[#E2E8F0]">
                Sua Casa.
              </span>
            </h1>
            
            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-light px-2 drop-shadow-lg border-l-2 border-[#B0B8C1]/30 pl-4 text-left md:text-center md:border-l-0 md:pl-0">
              Acreditamos que o sofá é onde as melhores histórias acontecem. Criamos peças sob medida que unem a elegância que você deseja com o aconchego irresistível para juntar todo mundo na sala.
            </p>
            
            {/* Minimalist Glass Button */}
            <button 
              onClick={() => {
                document.getElementById('catalogo-grid')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="relative w-full sm:w-auto px-10 py-4 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-white overflow-hidden group border border-[#B0B8C1]/30 rounded-full bg-black/20 backdrop-blur-md transition-colors duration-500 hover:border-[#B0B8C1] flex items-center justify-center mx-auto"
            >
              <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#B0B8C1]/30 to-transparent transition-all duration-700 ease-out group-hover:w-full" />
              <span className="relative z-10 flex items-center gap-4">
                Descubra o Catálogo 
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================= CATEGORY TABS (Mobile App feel) ================= */}
      <section className="w-full py-4 md:py-6 sticky top-0 md:top-20 z-30 bg-[#18181B]/95 backdrop-blur-md border-b border-white/5 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-6 md:gap-8 overflow-x-auto hide-scrollbar">
          {CATEGORIAS_VALLERI.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap pb-3 border-b-2 text-sm tracking-wide transition-all ${
                activeCategory === cat 
                  ? 'border-[#991B1B] text-white font-medium' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
          </div>
        </div>
      </section>

      {/* ================= CATALOG GRID ================= */}
      <section id="catalogo-grid" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-16">
          <AnimatePresence mode="popLayout">
            {filteredSofas.map((sofa, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: (idx % 2) * 0.15 }}
                key={sofa.id}
                className="group relative"
              >
                {/* Image Card */}
                <div 
                  onClick={() => setSelectedSofa(sofa)}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-[#111] cursor-pointer group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-500"
                >
                  <motion.img 
                    initial={{ scale: 1.3 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: (idx % 2) * 0.15 }}
                    src={sofa.images[0]} 
                    alt={sofa.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  {/* Luxury Curtain Reveal */}
                  <motion.div 
                    initial={{ height: "100%" }}
                    whileInView={{ height: "0%" }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: (idx % 2) * 0.15 }}
                    className="absolute top-0 left-0 w-full bg-[#18181B] z-10"
                  />
                  {sofa.isNew && (
                    <span className="absolute top-4 left-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                      Lançamento
                    </span>
                  )}
                  {/* Heart / Favorite (Mobile App Pattern) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toast("Adicionado aos favoritos!"); }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-[#991B1B] hover:bg-white transition-all z-10"
                  >
                    <Heart size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row justify-between items-start md:gap-4">
                  <div className="w-full">
                    <h3 
                      onClick={() => setSelectedSofa(sofa)}
                      className="font-serif text-2xl text-white mb-2 cursor-pointer hover:text-[#B0B8C1] transition-colors inline-block"
                    >
                      {sofa.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-light mb-4 line-clamp-2 pr-4">{sofa.longDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {sofa.materials.slice(0, 2).map((mat, i) => (
                        <span key={i} className="text-[10px] border border-gray-800 text-gray-400 px-2 py-1 rounded-sm uppercase tracking-wider">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left mt-2 md:text-right md:mt-0 shrink-0">
                    <span className="block text-xl md:text-lg text-white font-medium">R$ {sofa.price.toLocaleString('pt-BR')}</span>
                    <span className="block text-xs text-gray-500 mt-1">Sob Medida</span>
                  </div>
                </div>

                {/* App-like Action Button */}
                <button 
                  onClick={() => setSelectedSofa(sofa)}
                  className="w-full mt-4 glass-panel py-4 rounded-xl text-xs uppercase tracking-widest font-bold text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 group/btn border border-white/10"
                >
                  Configurar Modelo
                  <ChevronRight size={16} className="text-gray-400 group-hover/btn:text-black transition-colors" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <section className="w-full bg-[#111111] py-16 md:py-24 border-t border-white/5 pb-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-4">A Experiência Valleri</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-light">
              Não vendemos apenas móveis. Entregamos um serviço completo de curadoria e confecção em alta alfaiataria para o seu lar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICOS_VALLERI.map((svc, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-500 border border-white/5">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center mb-6 text-[#991B1B]">
                  {i === 0 ? <MapPin size={24} /> : i === 1 ? <ShieldCheck size={24} /> : <Star size={24} />}
                </div>
                <h4 className="text-white text-lg font-medium mb-3">{svc.title}</h4>
                <p className="text-gray-400 text-sm font-light leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BOTTOM NAVIGATION (Mobile App Pattern) ================= */}
      <div className="md:hidden fixed bottom-0 left-0 w-full glass-panel border-t border-white/10 z-40 pb-safe">
        <div className="flex justify-around items-center p-4">
          <button onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-[#991B1B]' : 'text-gray-500'}`}>
            <Home size={20} />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          <button onClick={() => { setActiveTab('catalog'); document.getElementById('catalogo-grid')?.scrollIntoView({ behavior: 'smooth' }); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'catalog' ? 'text-[#991B1B]' : 'text-gray-500'}`}>
            <Sofa size={20} />
            <span className="text-[10px] font-medium">Catálogo</span>
          </button>
          <button onClick={() => { setActiveTab('contact'); toast("Iniciando chat..."); }} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'contact' ? 'text-[#991B1B]' : 'text-gray-500'}`}>
            <Phone size={20} />
            <span className="text-[10px] font-medium">Consultoria</span>
          </button>
        </div>
      </div>

      {/* ================= DETAILED SOFA MODAL ================= */}
      <AnimatePresence>
        {selectedSofa && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSofa(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            
            {/* Modal / Slide-over */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 w-full h-[90vh] md:top-0 md:left-auto md:right-0 md:w-[600px] md:h-full bg-[#111] border-t md:border-t-0 md:border-l border-white/10 z-50 overflow-y-auto rounded-t-3xl md:rounded-none flex flex-col hide-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Drag Handle for Mobile */}
              <div className="w-full flex justify-center pt-3 pb-2 md:hidden bg-[#111] absolute top-0 left-0 z-20 rounded-t-3xl">
                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
              </div>

              {/* Image Header */}
              <motion.div 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="relative w-full aspect-square md:aspect-[4/3] bg-black shrink-0 overflow-hidden"
              >
                <img 
                  src={selectedSofa.images[0]} 
                  alt={selectedSofa.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                
                <button 
                  onClick={() => setSelectedSofa(null)}
                  className="absolute top-10 md:top-6 right-6 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-30"
                >
                  <X size={20} />
                </button>
              </motion.div>

              {/* Content */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="p-6 md:p-8 flex-1 flex flex-col relative z-10 bg-[#111] -mt-10 rounded-t-3xl md:mt-0 md:rounded-none"
              >
                <span className="text-[#991B1B] text-xs font-bold tracking-widest uppercase mb-2">Coleção 2026</span>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">{selectedSofa.name}</h2>
                <p className="text-gray-400 font-light leading-relaxed mb-8">
                  {selectedSofa.longDescription}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Dimensões Padrão</span>
                    <span className="block text-sm text-white font-medium">{selectedSofa.dimensions}</span>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Investimento Inicial</span>
                    <span className="block text-sm text-white font-medium">R$ {selectedSofa.price.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-xs text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Materiais Premium</h4>
                  <ul className="space-y-3">
                    {selectedSofa.materials.map((mat, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-400 text-sm font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B]" />
                        {mat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer CTA */}
                <div className="mt-auto pt-8">
                  <button 
                    onClick={() => {
                      toast("Redirecionando para o WhatsApp...");
                      setTimeout(() => window.open(`https://wa.me/5581999999999?text=Olá, me interessei pelo sofá ${selectedSofa.name}!`), 1000);
                    }}
                    className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl text-sm uppercase tracking-widest font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Consultoria no WhatsApp
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState } from "react";
import { 
  MessageCircle, 
  Instagram, 
  MapPin, 
  Compass, 
  Share2, 
  ExternalLink,
  ChevronRight,
  Wrench,
  Check,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// URL de vídeo stock padrão de uma sala de estar com sofá moderno (Mixkit)
const DEFAULT_VIDEO_URL = "/Sofá_elegantemente_desmontando_p…_2026071108383.mp4";

export default function LinkBio() {
  const [isCopied, setIsCopied] = useState(false);

  // Copiar link da página
  const handleShare = async () => {
    const shareData = {
      title: "Válleri | Estofados Sob Medida",
      text: "Confira os contatos e catálogo da Válleri.",
      url: window.location.origin + "/link"
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setIsCopied(true);
        toast.success("Link copiado para a área de transferência!");
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareData.url);
      setIsCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-black text-white relative flex items-center justify-center p-4 overflow-y-auto"
      style={{
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Importar Google Fonts e estilos CSS customizados */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Cinzel:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-brand { font-family: 'Cinzel', serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .glass-card {
          background: rgba(10, 10, 10, 0.65);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .glass-btn {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-btn:hover {
          background: rgba(229, 28, 36, 0.08);
          border-color: rgba(229, 28, 36, 0.4);
          box-shadow: 0 0 20px rgba(229, 28, 36, 0.25);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ================= BACKGROUND VIDEO ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-75 scale-105"
        >
          <source src={DEFAULT_VIDEO_URL} type="video/mp4" />
        </video>
        {/* Camada escura de degradê para legibilidade das informações do cartão */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75" />
      </div>

      {/* ================= CARTÃO DE LINKS GLASSMÓRFICO (CENTRALIZADO) ================= */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-[2.5rem] px-6 py-8 flex flex-col items-center shadow-2xl my-6">
        
        {/* CABEÇALHO DO CARTÃO (SHARE E INFO) */}
        <div className="w-full flex justify-between items-center mb-6">
          <Link to="/catalogo2" className="text-xs uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <Compass size={14} />
            Catálogo
          </Link>
          <button 
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-white/20 transition-all active:scale-95"
            title="Compartilhar link"
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </div>

        {/* PERFIL / LOGO / APRESENTAÇÃO */}
        <div className="flex flex-col items-center text-center w-full mb-8">
          <div className="relative mb-4 group">
            {/* Efeito Glow Vermelho atrás do Avatar */}
            <div className="absolute inset-0 rounded-full bg-[#E51C24]/30 blur-md group-hover:bg-[#E51C24]/50 transition-all duration-500" />
            
            {/* Container do Avatar com borda vermelha e preenchimento escuro */}
            <div className="relative w-24 h-24 rounded-full border-[3px] border-[#E51C24] p-[3px] bg-black overflow-hidden flex items-center justify-center">
              <img 
                src="/vallerilogo.png" 
                alt="Válleri Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-xl font-bold font-brand tracking-widest text-white">Válleri</h1>
            {/* Selo verificado */}
            <span className="text-blue-500" title="Verificado Oficial">
              <CheckCircle2 size={16} fill="currentColor" className="text-blue-500 stroke-black stroke-2" />
            </span>
          </div>
          <span className="text-xs font-semibold text-[#E51C24] tracking-widest uppercase mb-3">@sofaearterecife</span>
          
          <p className="text-sm font-light text-gray-300 max-w-sm leading-relaxed">
            Fabricação e reforma de estofados sob medida e móveis planejados. Alta alfaiataria para o seu lar.
          </p>
        </div>

        {/* CONTAINER DE LINKS (BOTÕES E AÇÕES) */}
        <div className="w-full flex flex-col gap-4 mb-8">
          
          {/* LINK 1: WhatsApp Sofia */}
          <a 
            href="https://wa.me/5581982226725"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Sofia (Consultoria)</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Falar com a consultora Sofia no WhatsApp</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          {/* LINK 2: WhatsApp Liliane */}
          <a 
            href="https://wa.me/message/CGFFXHBWP72CK1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Liliane (Vendas)</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Falar com a consultora Liliane no WhatsApp</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          {/* LINK 3: Instagram */}
          <a 
            href="https://www.instagram.com/sofaearterecife/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <Instagram size={18} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Siga-nos no Instagram</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Confira nossas novidades e inspirações diárias</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          {/* LINK 3: Catálogo de Estofados */}
          <Link 
            to="/catalogo2"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <Compass size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Catálogo Exclusivo 2026</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Explore nossos modelos, dimensões e acabamentos</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>

          {/* LINK 4: Solicitar Orçamento */}
          <a 
            href={`https://wa.me/5581982226725?text=Ol%C3%A1%2C+vi+o+seu+link-in-bio+e+gostaria+de+solicitar+um+or%C3%A7amento+personalizado+de+estofado.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group border-l-[3px] border-l-[#E51C24]"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-[#E51C24] group-hover:text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <Wrench size={18} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Solicitar Orçamento</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Envie fotos e medidas para fabricação ou reforma</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          {/* LINK 5: Localização Fábrica */}
          <a 
            href="https://maps.google.com/?q=Sof%C3%A1+e+Arte+Recife"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <MapPin size={18} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Nossos Showrooms & Fábrica</h3>
              <p className="text-[11px] text-gray-400 font-light mt-0.5">Planeje sua rota e visite-nos em Recife</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

        </div>

        {/* RODAPÉ E REDES SOCIAIS ADICIONAIS */}
        <div className="w-full flex flex-col items-center gap-4 mt-4">
          <span className="text-[9px] uppercase tracking-widest text-neutral-600">
            Válleri Sob Medida © 2026
          </span>
        </div>

      </div>
    </div>
  );
}

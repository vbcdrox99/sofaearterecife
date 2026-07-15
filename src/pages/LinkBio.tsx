import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// URL de vídeo stock padrão de uma sala de estar com sofá moderno (Mixkit)
const DEFAULT_VIDEO_URL = "/0712(1).mp4";

export default function LinkBio() {
  const [isCopied, setIsCopied] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Definir cor da barra de navegação do celular para preto
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#000000';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Configurar velocidade de reprodução do vídeo para 0.75x (mais lento)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
    }
  }, []);

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
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translate3d(0, 0, 0); /* Aceleração de hardware */
          will-change: transform;
        }
        .glass-btn {
          background: rgba(20, 20, 20, 0.6);
          /* Removido o backdrop-filter para evitar double-blur que sobrecarrega a GPU no mobile */
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translate3d(0, 0, 0); /* Aceleração de hardware */
          will-change: transform, border-color, background-color;
        }
        .glass-btn:hover {
          background: rgba(229, 28, 36, 0.08);
          border-color: rgba(229, 28, 36, 0.4);
          transform: translate3d(0, -2px, 0);
        }
      `}</style>

      {/* ================= BACKGROUND VIDEO ================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = 0.75;
          }}
          className="w-full h-full object-cover opacity-75 scale-105 transform translate-z-0 will-change-transform"
        >
          <source src={DEFAULT_VIDEO_URL} type="video/mp4" />
        </video>
        {/* Camada escura de degradê para legibilidade das informações do cartão */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75" />
      </div>

      {/* ================= CARTÃO DE LINKS GLASSMÓRFICO (CENTRALIZADO) ================= */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-[2.5rem] px-4 py-4 md:px-6 md:py-8 flex flex-col items-center shadow-2xl my-2 md:my-6">
        
        {/* CABEÇALHO DO CARTÃO (SHARE E INFO) */}
        <div className="w-full flex justify-end items-center mb-6">
          <button 
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-white/20 transition-all active:scale-95"
            title="Compartilhar link"
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </div>

        {/* PERFIL / LOGO / APRESENTAÇÃO */}
        <div className="flex flex-col items-center text-center w-full mb-5 md:mb-8">
          <div className="relative mb-3 md:mb-4">
            {/* Container do Avatar com borda vermelha e preenchimento escuro */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-[#E51C24] p-[3px] bg-black overflow-hidden flex items-center justify-center">
              <img 
                src="/vallerilogo.png" 
                alt="Válleri Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-2 md:mb-3">
            <h1 className="text-xl font-bold font-brand tracking-widest text-white">Válleri</h1>
            {/* Selo verificado */}
            <span className="text-blue-500" title="Verificado Oficial">
              <CheckCircle2 size={16} fill="currentColor" className="text-blue-500 stroke-black stroke-2" />
            </span>
          </div>
          
          <p className="text-xs md:text-sm font-light text-gray-300 max-w-sm leading-relaxed px-2">
            Fabricação e reforma de estofados sob medida e móveis planejados. Alta alfaiataria para o seu lar.
          </p>
        </div>

        {/* CONTAINER DE LINKS (BOTÕES E AÇÕES) */}
        <div className="w-full flex flex-col gap-2.5 md:gap-4 mb-6 md:mb-8">

          {/* BOTÃO EM DESTAQUE: Demonstração */}
          <button 
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full flex items-center p-3 md:p-3.5 rounded-2xl bg-[#E51C24] text-white hover:bg-[#E51C24]/90 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98] group"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 flex items-center justify-center text-white mr-3 md:mr-4 shrink-0">
              <Play size={18} fill="currentColor" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xs md:text-sm font-bold tracking-wide">Vídeo de Demonstração</h3>
              <p className="text-[10px] md:text-[11px] text-white/70 font-light mt-0.5">Assista e confira o design, abertura e conforto do sofá cama</p>
            </div>
            <ChevronRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
          
          {/* LINK 1: WhatsApp Sofia */}
          <a 
            href="https://wa.me/5581982226725"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3 md:p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-3 md:mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xs md:text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Quero saber mais informações.</h3>
              <p className="text-[10px] md:text-[11px] text-gray-400 font-light mt-0.5">Falar com a nossa consultora no WhatsApp</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </a>

          {/* LINK 2: Instagram */}
          <a 
            href="https://www.instagram.com/sofaearterecife/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center p-3 md:p-3.5 rounded-2xl glass-btn group"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white mr-3 md:mr-4 shrink-0 transition-all group-hover:bg-[#E51C24]">
              <Instagram size={18} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xs md:text-sm font-bold tracking-wide text-white group-hover:text-white transition-colors">Siga-nos no Instagram</h3>
              <p className="text-[10px] md:text-[11px] text-gray-400 font-light mt-0.5">Confira nossas novidades e inspirações diárias</p>
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

      {/* MODAL DE VÍDEO DEMONSTRATIVO */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 md:p-4 md:backdrop-blur-md transition-opacity duration-300">
          <div className="relative w-full h-full md:h-auto md:max-w-md bg-black md:bg-neutral-950 md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 md:border-none shrink-0">
              <h3 className="text-sm font-bold text-white tracking-wide font-outfit">Vídeo de Demonstração</h3>
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 text-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Container do Vídeo Vertical */}
            <div className="flex-1 md:flex-none relative flex items-center justify-center bg-black overflow-hidden">
              <video 
                src={DEFAULT_VIDEO_URL} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full max-h-[75vh] md:max-h-[60vh] object-contain"
              />
            </div>
            
            {/* Rodapé / Instrução */}
            <div className="px-5 py-4 border-t border-white/5 md:border-none text-center shrink-0">
              <p className="text-[11px] text-gray-400 font-light font-outfit">
                Toque no player para assistir ou controlar o volume.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

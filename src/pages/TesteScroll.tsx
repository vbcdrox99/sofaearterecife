import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Video, Settings, Info, RefreshCw } from "lucide-react";

export default function TesteScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Variáveis para interpolação suave (lerp)
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // URL do vídeo usado no teste
  const videoUrl = "/Sofá_desmontando_mostrando_partes_20260711084224.mp4";

  // Ao obter as metadados do vídeo, define a duração
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      
      // Distância que o contêiner rolou em relação ao topo da tela
      const scrolled = -rect.top;
      
      // Fração de progresso da rolagem (0 a 1)
      let progress = scrolled / totalHeight;
      progress = Math.max(0, Math.min(1, progress)); // Trava entre 0 e 1
      
      setScrollProgress(progress);

      // Calcula o tempo alvo correspondente no vídeo
      if (videoDuration > 0) {
        targetTimeRef.current = progress * videoDuration;
      }
    };

    // Escuta o scroll global
    window.addEventListener("scroll", handleScroll);
    // Dispara uma vez na montagem
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [videoDuration]);

  // Loop do requestAnimationFrame para fazer interpolação suave (lerp)
  useEffect(() => {
    const updateVideoTime = () => {
      if (videoRef.current) {
        // Interpolação Linear (Lerp): suaviza a transição do tempo atual para o tempo alvo
        // 0.08 significa que ele avança 8% da distância por frame (gera um efeito de inércia suave)
        const lerpFactor = 0.08;
        const diff = targetTimeRef.current - currentTimeRef.current;

        // Se a diferença for muito pequena, fixa no alvo para evitar micro-oscilações
        if (Math.abs(diff) < 0.001) {
          currentTimeRef.current = targetTimeRef.current;
        } else {
          currentTimeRef.current += diff * lerpFactor;
        }

        // Define a propriedade currentTime do player de vídeo
        videoRef.current.currentTime = currentTimeRef.current;
        setCurrentTime(currentTimeRef.current);
      }
      
      // Continua o loop de animação
      animationFrameRef.current = requestAnimationFrame(updateVideoTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateVideoTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-neutral-950 text-white min-h-screen relative font-sans selection:bg-[#E51C24] selection:text-white">
      {/* Barra de progresso superior */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#E51C24] z-50 transition-all duration-100" 
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Botão Flutuante de Voltar */}
      <div className="fixed top-6 left-6 z-40">
        <Link 
          to="/link" 
          className="flex items-center gap-2 bg-black/60 border border-white/10 hover:border-white/30 backdrop-blur-md px-4 py-2.5 rounded-full text-sm font-medium text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <ArrowLeft size={16} />
          Voltar para Bio
        </Link>
      </div>

      {/* Painel de Telemetria / Status do Scroll */}
      <div className="fixed bottom-6 right-6 z-40 bg-black/85 border border-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl max-w-xs font-mono text-[11px] leading-relaxed text-gray-300 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-bold text-[#E51C24] mb-1">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
          TELEMETRIA DE ROLAGEM
        </div>
        <div>
          <span className="text-gray-500">Progresso Scroll:</span> {(scrollProgress * 100).toFixed(1)}%
        </div>
        <div>
          <span className="text-gray-500">Duração Vídeo:</span> {videoDuration.toFixed(2)}s
        </div>
        <div>
          <span className="text-gray-500">Tempo Corrente:</span> {currentTime.toFixed(2)}s
        </div>
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-emerald-500 rounded-full" 
            style={{ width: `${(currentTime / (videoDuration || 1)) * 100}%` }}
          />
        </div>
        <p className="text-[9px] text-neutral-500 leading-tight mt-1 text-center font-sans">
          Interpolação ativa: Lerp 8% p/ frame.
        </p>
      </div>

      {/* ================= CONTÊINER DE ROLAGEM GERAL ================= */}
      {/* Ajuste o h-[Xvh] para determinar o quão "longo" ou "curto" é o scroll para rodar o vídeo */}
      <div ref={containerRef} className="relative h-[350vh] w-full">
        
        {/* CONTAINER STICKY DO VÍDEO (FICA FIXO ENQUANTO ROLA) */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          
          {/* O Vídeo de Fundo */}
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{
              // Força renderização acelerada por GPU
              transform: "translate3d(0, 0, 0)",
              backfaceVisibility: "hidden"
            }}
          />

          {/* Camada escura de degradê para legibilidade dos textos e overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-neutral-950/20 to-black/85 pointer-events-none" />

          {/* OVERLAYS TEXTUAIS BASEADOS ON SCROLL */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-24 text-center px-4 pointer-events-none select-none">
            
            {/* Título inicial (Fica transparente à medida que rola) */}
            <div 
              className="transition-all duration-300 transform"
              style={{
                opacity: Math.max(0, 1 - scrollProgress * 3.5),
                transform: `translateY(-${scrollProgress * 50}px)`
              }}
            >
              <div className="inline-flex items-center gap-2 bg-[#E51C24] text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
                <Video size={12} />
                Scroll-telling Teste
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-brand tracking-wider leading-tight max-w-2xl text-white">
                Role para abrir o Sofá Cama
              </h1>
              <p className="text-sm md:text-base text-gray-300 font-light max-w-md mx-auto mt-4 leading-relaxed">
                Role a página para baixo para fazer o vídeo avançar, e para cima para fazê-lo voltar.
              </p>
              <div className="mt-8 flex justify-center">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                </div>
              </div>
            </div>

            {/* Texto intermediário (Aparece no meio do scroll) */}
            <div 
              className="transition-all duration-300 transform max-w-xl mx-auto absolute top-1/2 -translate-y-1/2"
              style={{
                opacity: Math.max(0, 1 - Math.abs(scrollProgress - 0.5) * 5),
                transform: `translateY(calc(-50% + ${(scrollProgress - 0.5) * -100}px))`
              }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Transformação em Tempo Real
              </h2>
              <p className="text-sm text-gray-300 font-light leading-relaxed">
                Repare como o estofado desdobra suas partes. Em um vídeo otimizado (GOP=1), esta transição ocorre de forma ultra-suave sem engasgos nos navegadores.
              </p>
            </div>

            {/* Texto final (Aparece no fim do scroll) */}
            <div 
              className="transition-all duration-300 transform"
              style={{
                opacity: Math.max(0, (scrollProgress - 0.7) * 3.5),
                transform: `translateY(${(1 - scrollProgress) * 50}px)`
              }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Sofá Cama Pronto!
              </h2>
              <p className="text-sm md:text-base text-gray-300 font-light max-w-md mx-auto leading-relaxed">
                Demonstração completa concluída. Role para cima para fechar o sofá novamente.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ================= SEÇÃO EXPLICATIVA DOS FORMATOS (RODAPÉ) ================= */}
      <div className="relative z-20 bg-neutral-900 border-t border-white/10 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-2 text-[#E51C24] font-bold text-xl mb-6">
            <Settings size={22} />
            <h2>Guia Técnico: Como preparar o seu vídeo para Scroll</h2>
          </div>

          <div className="space-y-6 text-sm text-gray-300 leading-relaxed font-light">
            <p>
              Por padrão, arquivos de vídeo comuns comprimem dados agrupando quadros em intervalos (GOP de 60 a 150 quadros). Isso significa que apenas 1 quadro a cada 2 ou 5 segundos é uma foto real completa. O restante são dados de "vetores de movimento".
            </p>
            <p>
              Ao arrastar o vídeo pelo scroll (especialmente para trás), o navegador é forçado a recalcular todos esses vetores, causando <strong>travamentos severos e congelamentos</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
                  <Info size={16} className="text-blue-400" />
                  Passo 1: Formato do Vídeo
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400">
                  <li>Formato final: <strong className="text-white">MP4 (H.264)</strong>.</li>
                  <li>Resolução ideal: <strong className="text-white">1280x720 (720p)</strong>.</li>
                  <li>Taxa de bits (Bitrate): <strong className="text-white">1.5 a 3.0 Mbps</strong>.</li>
                  <li>Áudio: <strong className="text-white">Remover faixa de som</strong>.</li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
                  <Settings size={16} className="text-emerald-400" />
                  Passo 2: Codificação
                </div>
                <p className="text-xs text-gray-400">
                  Defina o <strong>Intervalo de Quadros-Chave (Keyframe Distance) para 1</strong> (também conhecido como All-Intra ou GOP = 1).
                </p>
                <p className="text-xs text-gray-400">
                  Isso força que cada frame seja uma imagem completa, permitindo o scrub suave instantâneo para frente e para trás.
                </p>
              </div>
            </div>

            <div className="bg-black/80 border border-white/10 rounded-2xl p-6 mt-8">
              <h4 className="font-bold text-white text-xs tracking-wider uppercase mb-3 text-neutral-400">
                Comando FFmpeg recomendado para converter seu vídeo:
              </h4>
              <pre className="bg-neutral-950 p-4 rounded-xl border border-white/5 font-mono text-xs overflow-x-auto text-[#E51C24]">
                ffmpeg -i video_original.mp4 -vcodec libx264 -g 1 -coder 0 -bf 0 -profile:v baseline -level 3.0 -pix_fmt yuv420p -an video_final_scroll.mp4
              </pre>
              <p className="text-[10px] text-neutral-500 mt-2 italic text-center">
                Nota: O parâmetro "-g 1" é o responsável por tornar todo frame um keyframe (GOP=1).
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useRef } from 'react';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export const useImageOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const optimizeImage = useCallback(async (
    file: File, 
    options: ImageOptimizationOptions = {}
  ): Promise<File> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    setIsOptimizing(true);

    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Criar canvas se não existir
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
          }
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Não foi possível obter contexto do canvas'));
            return;
          }

          // Calcular novas dimensões mantendo proporção
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Configurar canvas
          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem otimizada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: `image/${format}`,
                  lastModified: Date.now(),
                });
                resolve(optimizedFile);
              } else {
                reject(new Error('Falha ao otimizar imagem'));
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = URL.createObjectURL(file);
      });
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const createThumbnail = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Criar thumbnail 150x150
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Calcular crop para manter proporção
        const { width, height } = img;
        const aspectRatio = width / height;
        
        let sourceX = 0, sourceY = 0, sourceWidth = width, sourceHeight = height;
        
        if (aspectRatio > 1) {
          // Imagem mais larga que alta
          sourceWidth = height;
          sourceX = (width - height) / 2;
        } else {
          // Imagem mais alta que larga
          sourceHeight = width;
          sourceY = (height - width) / 2;
        }

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, size, size
        );

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => reject(new Error('Falha ao criar thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const validateImageFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Verificar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo não suportado' };
    }

    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande (máximo 10MB)' };
    }

    return { isValid: true };
  }, []);

  return {
    optimizeImage,
    createThumbnail,
    validateImageFile,
    isOptimizing
  };
};
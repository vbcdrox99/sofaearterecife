import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageOptimization } from '../hooks/useImageOptimization';

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  label: string;
  description?: string;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
}

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  url?: string;
  name: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 5,
  label,
  description,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 5
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { optimizeImage, isOptimizing } = useImageOptimization();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + images.length > maxImages) {
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    const validFiles = files.filter(file => {
      // Verificar tipo de arquivo
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`);
        return false;
      }

      // Verificar tamanho do arquivo
      if (file.size > maxSizeInMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande: ${file.name}. Máximo ${maxSizeInMB}MB`);
        return false;
      }

      return true;
    });

    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      name: file.name
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => {
      if (img.id === imageId) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const uploadToSupabase = async (image: UploadedImage): Promise<string | null> => {
    try {
      // Otimizar a imagem antes do upload
      const optimizedFile = await optimizeImage(image.file);
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pedido-imagens')
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('pedido-imagens')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const uploadAllImages = async (): Promise<UploadedImage[]> => {
    setUploading(true);
    const uploadPromises = images.map(async (image) => {
      if (image.uploaded) return image;

      const url = await uploadToSupabase(image);
      if (url) {
        return { ...image, uploaded: true, url };
      }
      return image;
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      setImages(uploadedImages);
      onImagesChange(uploadedImages);
      setUploading(false);
      return uploadedImages;
    } catch (error) {
      console.error('Erro no upload das imagens:', error);
      setUploading(false);
      return images;
    }
  };

  const openPreview = (image: UploadedImage) => {
    window.open(image.preview, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Área de upload */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <div className="p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= maxImages || uploading}
              >
                Selecionar Imagens
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ')} até {maxSizeInMB}MB
            </p>
            <p className="text-xs text-gray-500">
              {images.length}/{maxImages} imagens
            </p>
          </div>
        </div>
      </Card>

      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openPreview(image)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Indicador de status */}
                <div className="absolute top-2 right-2">
                  {image.uploaded ? (
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white rounded-full p-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate" title={image.name}>
                  {image.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Botão de upload */}
      {images.length > 0 && !images.every(img => img.uploaded) && (
        <Button
          onClick={uploadAllImages}
          disabled={uploading || isOptimizing}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fazendo upload...
            </>
          ) : isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Otimizando imagens...
            </>
          ) : (
            'Fazer Upload das Imagens'
          )}
        </Button>
      )}
    </div>
  );
};

export default ImageUpload;
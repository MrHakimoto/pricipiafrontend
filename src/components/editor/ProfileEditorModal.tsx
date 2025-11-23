// components/editor/ProfileEditorModal.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, X, ZoomIn, ZoomOut, Circle } from "lucide-react";

const canvasToFile = (
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string = "image/png",
  quality: number = 0.95
): Promise<File> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File(
        [blob],
        filename.replace(/\.[^.]+$/, "") + (mimeType === "image/png" ? ".png" : ".jpg"),
        { type: mimeType }
      );
      resolve(file);
    }, mimeType, quality);
  });

interface ImageEditorModalProps {
  image: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (file: File) => void;
}

interface OriginalSize {
  width: number;
  height: number;
}

interface FlipState {
  h: boolean;
  v: boolean;
}

export default function ProfileEditorModal({
  image,
  open,
  onOpenChange,
  onConfirm,
}: ImageEditorModalProps) {
  const cropperRef = useRef<CropperRef>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [outputMime, setOutputMime] = useState<string>("image/png");
  const [rotationAccum, setRotationAccum] = useState<number>(0);
  const [flipState, setFlipState] = useState<FlipState>({ h: false, v: false });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<OriginalSize>({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Tamanhos pré-definidos para o avatar (em pixels)
  const avatarSizes = [
    { size: 64, label: "Pequeno (64px)" },
    { size: 128, label: "Médio (128px)" },
    { size: 256, label: "Grande (256px)" },
  ];
  const [selectedSize, setSelectedSize] = useState<number>(128);

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      setOriginalSize({ width: 0, height: 0 });
      return;
    }
    const url = URL.createObjectURL(image);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => setOriginalSize({ width: img.width, height: img.height });
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [image]);

  const rotate = (angle: number) => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    
    cropper.rotateImage(angle);
    setRotationAccum((r) => (r + angle) % 360);
  };

  const flip = (horizontal: boolean, vertical: boolean) => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    
    cropper.flipImage(horizontal, vertical);
    setFlipState((f) => ({
      h: horizontal ? !f.h : f.h,
      v: vertical ? !f.v : f.v,
    }));
  };

  const zoomTo = (value: number) => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    
    cropper.zoomImage(value);
    setZoom(value);
  };

  const handleZoomIn = () => {
    zoomTo(Math.min(zoom + 0.25, 4));
  };

  const handleZoomOut = () => {
    zoomTo(Math.max(zoom - 0.25, 0.1));
  };

  const handleConfirm = async () => {
    const cropper = cropperRef.current;
    if (!cropper || !imageUrl || !image) return;

    setIsLoading(true);
    
    try {
      const coordinates = cropper.getCoordinates();
      if (!coordinates) return;

      // Criar canvas para o recorte circular
      const circleCanvas = document.createElement("canvas");
      circleCanvas.width = selectedSize;
      circleCanvas.height = selectedSize;
      const ctx = circleCanvas.getContext("2d");

      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Configurar o contexto para recorte circular
      ctx.beginPath();
      ctx.arc(selectedSize / 2, selectedSize / 2, selectedSize / 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      // Calcular dimensões para manter a proporção e preencher o círculo
      const scale = Math.max(
        selectedSize / coordinates.width,
        selectedSize / coordinates.height
      );

      const scaledWidth = coordinates.width * scale;
      const scaledHeight = coordinates.height * scale;

      const x = (selectedSize - scaledWidth) / 2;
      const y = (selectedSize - scaledHeight) / 2;

      // Aplicar transformações (rotação e flip)
      ctx.save();
      ctx.translate(selectedSize / 2, selectedSize / 2);

      const rotNorm = ((rotationAccum % 360) + 360) % 360;
      const rad = (rotNorm * Math.PI) / 180;
      if (rotNorm !== 0) ctx.rotate(rad);

      const scaleX = flipState.h ? -1 : 1;
      const scaleY = flipState.v ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      ctx.translate(-selectedSize / 2, -selectedSize / 2);

      // Desenhar a imagem recortada
      ctx.drawImage(
        img,
        coordinates.left,
        coordinates.top,
        coordinates.width,
        coordinates.height,
        x,
        y,
        scaledWidth,
        scaledHeight
      );

      ctx.restore();

      const file = await canvasToFile(circleCanvas, image.name, outputMime);
      onConfirm?.(file);
      onOpenChange(false);

    } catch (error) {
      console.error("Erro ao processar imagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos CSS personalizados para o cropper circular
  const cropperStyles = `
    .advanced-cropper .cropper-wrapper {
      border-radius: 12px;
      overflow: hidden;
    }
    
    .advanced-cropper .cropper-stencil {
      border-radius: 50% !important;
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7);
    }
    
    .advanced-cropper .cropper-background {
      border-radius: 12px;
    }
    
    .advanced-cropper .cropper-handler {
      background: #3b82f6;
      border: 2px solid white;
      width: 12px;
      height: 12px;
    }
    
    .advanced-cropper .cropper-line {
      background: rgba(59, 130, 246, 0.5);
    }
    
    .preview-container {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 12px;
      padding: 16px;
      backdrop-filter: blur(10px);
    }
    
    .preview-avatar {
      border-radius: 50%;
      border: 2px solid #3b82f6;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  `;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <style>{cropperStyles}</style>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#111013] text-white">
          <Dialog.Title className="sr-only">Editar Avatar</Dialog.Title>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Editar Avatar</h2>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Área Principal */}
          <div className="flex-1 flex relative overflow-hidden">
            {/* Preview ao lado (apenas em telas grandes) */}
            <div className="hidden lg:block preview-container">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
              <div 
                className="preview-avatar bg-gray-700"
                style={{ 
                  width: `${selectedSize}px`, 
                  height: `${selectedSize}px`,
                  backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                {selectedSize}×{selectedSize}px
              </p>
            </div>

            {/* Área do Cropper */}
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-900 relative">
              {imageUrl ? (
                <div className="relative max-w-4xl max-h-[70vh] w-full h-full">
                  <Cropper
                    ref={cropperRef}
                    src={imageUrl}
                    className="advanced-cropper w-full h-full rounded-lg"
                    stencilProps={{
                      aspectRatio: 1, // Força formato quadrado para o círculo
                      handlers: true,
                      movable: true,
                      resizable: true,
                      lines: false,
                      className: "cropper-stencil"
                    }}
                    backgroundProps={{
                      className: "cropper-background"
                    }}
                    defaultCoordinates={{
                      width: 200,
                      height: 200
                    }}
                  />
                </div>
              ) : (
                <div className="text-gray-400 p-6 text-center">
                  <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma imagem selecionada</p>
                </div>
              )}
            </div>
          </div>

          {/* Painel de Controles */}
          <div className="border-t border-gray-800 bg-[#1a1a1a]">
            <div className="p-4 space-y-4">
              {/* Controles Principais */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Grupo de Transformação */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 mr-2">Transformar:</span>
                  <button 
                    onClick={() => rotate(-90)} 
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Girar 90° anti-horário"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button 
                    onClick={() => rotate(90)} 
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Girar 90° horário"
                  >
                    <RotateCw size={18} />
                  </button>
                  <button 
                    onClick={() => flip(true, false)} 
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Espelhar horizontalmente"
                  >
                    <FlipHorizontal size={18} />
                  </button>
                  <button 
                    onClick={() => flip(false, true)} 
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Espelhar verticalmente"
                  >
                    <FlipVertical size={18} />
                  </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.1}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <ZoomOut size={18} />
                  </button>
                  
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <label className="text-sm text-gray-400">Zoom</label>
                    <input
                      type="range"
                      min="0.1"
                      max="4"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => zoomTo(parseFloat(e.target.value))}
                      className="w-20 accent-blue-500"
                    />
                    <span className="text-sm text-gray-300 w-12">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <button 
                    onClick={handleZoomIn}
                    disabled={zoom >= 4}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>

              {/* Configurações de Saída */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-4">
                  {/* Tamanho do Avatar */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Tamanho:</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(Number(e.target.value))}
                      className="bg-gray-800 px-3 py-2 rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                      {avatarSizes.map((size) => (
                        <option key={size.size} value={size.size}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Formato */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Formato:</label>
                    <select
                      value={outputMime}
                      onChange={(e) => setOutputMime(e.target.value)}
                      className="bg-gray-800 px-3 py-2 rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="image/png">PNG (Melhor qualidade)</option>
                      <option value="image/jpeg">JPEG (Menor tamanho)</option>
                    </select>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleConfirm}
                    disabled={!image || isLoading}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Salvar Avatar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
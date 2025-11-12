"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, X } from "lucide-react";

/**
 * ImageEditorModal.jsx
 *
 * Props:
 *  - image: File (blob) da imagem
 *  - open: boolean
 *  - onOpenChange: (boolean) => void
 *  - onConfirm: (file) => void    // recebe o File final quando clicar em Salvar
 */

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

export default function ImageEditorModal({ image, open, onOpenChange, onConfirm }) {
  const cropperRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [resizePercent, setResizePercent] = useState(100);
  const [outputMime, setOutputMime] = useState("image/png"); // "image/png" or "image/jpeg"
  const [aspectRatio, setAspectRatio] = useState(null);
  const [rotationAccum, setRotationAccum] = useState(0);
  const [flipState, setFlipState] = useState({ h: false, v: false });

  const [imageUrl, setImageUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const [currentSelection, setCurrentSelection] = useState(null);

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

  const updateSelection = useCallback(() => {
    if (!cropperRef.current) return;
    const coords = cropperRef.current.getCoordinates();
    if (!coords) return;
    const selW = Math.round(coords.width * (resizePercent / 100));
    const selH = Math.round(coords.height * (resizePercent / 100));
    const percentOfOriginal = originalSize.width
      ? Math.round((selW / originalSize.width) * 100)
      : 0;
    setCurrentSelection({ selW, selH, percentOfOriginal });
  }, [resizePercent, originalSize]);

  const rotate = (angle) => {
    if (!cropperRef.current) return;
    cropperRef.current.rotateImage(angle);
    setRotationAccum((r) => (r + angle) % 360);
    updateSelection();
  };

  const flip = (horizontal, vertical) => {
    if (!cropperRef.current) return;
    cropperRef.current.flipImage(horizontal, vertical);
    setFlipState((f) => ({
      h: horizontal ? !f.h : f.h,
      v: vertical ? !f.v : f.v,
    }));
    updateSelection();
  };

  const zoomTo = (value) => {
    if (!cropperRef.current) return;
    cropperRef.current.zoomImage(value);
    setZoom(value);
    updateSelection();
  };

  const handleConfirm = async () => {
    if (!cropperRef.current || !imageUrl) return;
    const coords = cropperRef.current.getCoordinates();
    if (!coords) return;

    const scale = resizePercent / 100;
    const rawW = Math.round(coords.width * scale);
    const rawH = Math.round(coords.height * scale);

    const rotNorm = ((rotationAccum % 360) + 360) % 360;
    const swapDims = rotNorm === 90 || rotNorm === 270;

    const outW = swapDims ? rawH : rawW;
    const outH = swapDims ? rawW : rawH;

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = outW || 1;
    finalCanvas.height = outH || 1;
    const ctx = finalCanvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    await new Promise((res) => (img.onload = res));

    ctx.save();
    ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);

    const rad = (rotNorm * Math.PI) / 180;
    if (rotNorm !== 0) ctx.rotate(rad);

    const scaleX = flipState.h ? -1 : 1;
    const scaleY = flipState.v ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    ctx.drawImage(
      img,
      coords.left,
      coords.top,
      coords.width,
      coords.height,
      -finalCanvas.width / 2,
      -finalCanvas.height / 2,
      finalCanvas.width,
      finalCanvas.height
    );

    ctx.restore();

    const file = await canvasToFile(finalCanvas, image.name, outputMime);
    onConfirm && onConfirm(file);

    onOpenChange(false);
  };

  const quickOptions = useMemo(() => {
    const oW = originalSize.width || 0;
    const oH = originalSize.height || 0;
    return [
      { pct: 32, label: `32% (${Math.round(oW * 0.32)} x ${Math.round(oH * 0.32)})` },
      { pct: 90, label: `90% (${Math.round(oW * 0.9)} x ${Math.round(oH * 0.9)})` },
      { pct: 100, label: `100% (${oW} x ${oH})` },
    ];
  }, [originalSize]);

  useEffect(() => {
    updateSelection();
  }, [resizePercent, zoom, rotationAccum, flipState, updateSelection]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#111013] text-white">
          <Dialog.Title className="sr-only">Editar Imagem</Dialog.Title>

          <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden bg-gray-900">
            {imageUrl ? (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                className="advanced-cropper max-h-full max-w-full"
                stencilProps={{
                  aspectRatio: aspectRatio || undefined,
                  handlers: true,
                  movable: true,
                  resizable: true,
                }}
                onChange={updateSelection}
              />
            ) : (
              <div className="text-gray-400 p-6">Nenhuma imagem selecionada</div>
            )}
          </div>

          <div className="py-3 px-4 flex flex-col lg:flex-row gap-4 lg:items-center bg-gray-900/60 border-t border-gray-800">
            <div className="flex gap-2">
              <button onClick={() => rotate(-90)} className="p-2 bg-gray-700 rounded hover:bg-gray-600" title="Girar -90">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => rotate(90)} className="p-2 bg-gray-700 rounded hover:bg-gray-600" title="Girar +90">
                <RotateCw size={16} />
              </button>
              <button onClick={() => flip(true, false)} className="p-2 bg-gray-700 rounded hover:bg-gray-600" title="Flip Horizontal">
                <FlipHorizontal size={16} />
              </button>
              <button onClick={() => flip(false, true)} className="p-2 bg-gray-700 rounded hover:bg-gray-600" title="Flip Vertical">
                <FlipVertical size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300">Zoom</label>
              <input
                type="range"
                min="0.1"
                max="4"
                step="0.01"
                value={zoom}
                onChange={(e) => zoomTo(parseFloat(e.target.value))}
                className="w-36"
              />
            </div>

            <div className="flex flex-col text-sm">
              <label className="text-xs text-gray-300">Redimensionar</label>
              <div className="flex gap-2 items-center">
                <select
                  value={resizePercent}
                  onChange={(e) => setResizePercent(parseInt(e.target.value))}
                  className="bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  <option value={25}>25%</option>
                  <option value={50}>50%</option>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                </select>

                <div className="flex gap-2">
                  {quickOptions.map((o) => (
                    <button
                      key={o.pct}
                      onClick={() => setResizePercent(o.pct)}
                      className="px-2 py-1 bg-gray-700 rounded text-xs"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {currentSelection && (
                <span className="text-xs text-gray-300 mt-1">
                  {currentSelection.percentOfOriginal}% ({currentSelection.selW} x {currentSelection.selH}px)
                </span>
              )}
            </div>

            <div className="flex flex-col text-sm">
              <label className="text-xs text-gray-300">Proporção</label>
              <select
                value={aspectRatio || "free"}
                onChange={(e) =>
                  setAspectRatio(e.target.value === "free" ? null : Number(e.target.value))
                }
                className="bg-gray-700 px-2 py-1 rounded text-sm"
              >
                <option value="free">Livre</option>
                <option value={1}>1:1</option>
                <option value={4 / 3}>4:3</option>
                <option value={16 / 9}>16:9</option>
              </select>
            </div>

            <div className="flex flex-col text-sm">
              <label className="text-xs text-gray-300">Formato</label>
              <select
                value={outputMime}
                onChange={(e) => setOutputMime(e.target.value)}
                className="bg-gray-700 px-2 py-1 rounded text-sm"
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </div>

            <div className="flex gap-2 ml-auto">
              <Dialog.Close asChild>
                <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-semibold"
              >
                Salvar
              </button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <X />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

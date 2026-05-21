import { useEffect, useRef, useState } from "react";
import type { BBox } from "../types";

const BBOX_COLORS = [
  "#00ff9f", // neon green
  "#00d4ff", // cyan
  "#ffd166", // amber
  "#ff6b9d", // pink
  "#c77dff", // purple
  "#ff9a3c", // orange
];

interface Props {
  imageUrl: string;
  bboxes: BBox[];
  onDrop: (file: File) => void;
  isLoading: boolean;
}

export function ImageCanvas({ imageUrl, bboxes, onDrop, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [isDragOver, setIsDragOver] = useState(false);

  // Recompute rendered dimensions and draw bboxes
  const drawBoxes = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!canvas || !container || !img) return;

    const cW = container.clientWidth;
    const cH = container.clientHeight;
    canvas.width = cW;
    canvas.height = cH;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cW, cH);

    if (!imageUrl || bboxes.length === 0) return;

    // Compute letterboxed render rect
    const imgAspect = imgNatural.w / imgNatural.h;
    const conAspect = cW / cH;
    let rW: number, rH: number, oX: number, oY: number;
    if (imgAspect > conAspect) {
      rW = cW;
      rH = cW / imgAspect;
      oX = 0;
      oY = (cH - rH) / 2;
    } else {
      rH = cH;
      rW = cH * imgAspect;
      oX = (cW - rW) / 2;
      oY = 0;
    }

    bboxes.forEach((box, i) => {
      const color = BBOX_COLORS[i % BBOX_COLORS.length];
      const [x1n, y1n, x2n, y2n] = box.bbox;
      const x = oX + (x1n / 1000) * rW;
      const y = oY + (y1n / 1000) * rH;
      const w = ((x2n - x1n) / 1000) * rW;
      const h = ((y2n - y1n) / 1000) * rH;

      const isHovered = hoveredBox === i;

      // Filled region
      ctx.fillStyle = color + (isHovered ? "30" : "18");
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.setLineDash(isHovered ? [] : []);
      ctx.strokeRect(x, y, w, h);

      // Corner accents
      const corner = Math.min(12, w * 0.15, h * 0.15);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      // TL
      ctx.beginPath();
      ctx.moveTo(x, y + corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + corner, y);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(x + w - corner, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + corner);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(x, y + h - corner);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + corner, y + h);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(x + w - corner, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - corner);
      ctx.stroke();

      // Label pill
      const label = `${box.label} ${Math.round(box.confidence * 100)}%`;
      ctx.font = "11px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(label).width;
      const lx = x;
      const ly = y > 20 ? y - 20 : y + h + 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(lx, ly, tw + 12, 18, 3);
      ctx.fill();
      ctx.fillStyle = "#08090e";
      ctx.fillText(label, lx + 6, ly + 13);
    });
  };

  useEffect(() => {
    drawBoxes();
  }, [bboxes, hoveredBox, imgNatural]);

  useEffect(() => {
    const obs = new ResizeObserver(drawBoxes);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [bboxes, imgNatural]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || bboxes.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const imgAspect = imgNatural.w / imgNatural.h;
    const conAspect = cW / cH;
    let rW: number, rH: number, oX: number, oY: number;
    if (imgAspect > conAspect) {
      rW = cW;
      rH = cW / imgAspect;
      oX = 0;
      oY = (cH - rH) / 2;
    } else {
      rH = cH;
      rW = cH * imgAspect;
      oX = (cW - rW) / 2;
      oY = 0;
    }

    let found: number | null = null;
    bboxes.forEach((box, i) => {
      const [x1n, y1n, x2n, y2n] = box.bbox;
      const x = oX + (x1n / 1000) * rW;
      const y = oY + (y1n / 1000) * rH;
      const w = ((x2n - x1n) / 1000) * rW;
      const h = ((y2n - y1n) / 1000) * rH;
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) found = i;
    });
    setHoveredBox(found);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onDrop(file);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <>
          <img
            ref={imgRef}
            src={imageUrl}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: hoveredBox !== null ? "crosshair" : "default" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredBox(null)}
          />

          {/* Loading pulse overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-jarvis-bg/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-jarvis-neon border-t-transparent rounded-full animate-spin" />
                <span className="text-jarvis-neon text-xs tracking-widest">
                  ANALYZING...
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        // Drop zone when no image
        <div
          className={`flex flex-col items-center justify-center gap-4 w-full h-full transition-colors ${
            isDragOver
              ? "bg-jarvis-neon/5 border-jarvis-neon"
              : "border-jarvis-border"
          } border-2 border-dashed rounded-lg`}
        >
          <div className="text-5xl opacity-30">⌖</div>
          <p className="text-jarvis-muted text-sm tracking-wider text-center">
            DROP IMAGE HERE
            <br />
            <span className="text-xs">or click the camera button to capture your desktop</span>
          </p>
        </div>
      )}

      {isDragOver && imageUrl && (
        <div className="absolute inset-0 bg-jarvis-neon/10 border-2 border-jarvis-neon border-dashed rounded-lg flex items-center justify-center">
          <span className="text-jarvis-neon text-sm tracking-widest">
            DROP TO REPLACE
          </span>
        </div>
      )}
    </div>
  );
}

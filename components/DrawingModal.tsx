import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Download, Trash2, Undo } from 'lucide-react';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImageUrl: string | null;
}

const COLORS = [
  '#FF0000', '#FF7F00', '#FFD700', '#00FF00', '#0000FF', '#4B0082', '#9400D3', // Rainbow
  '#000000', '#8B4513', '#FF69B4', '#00FFFF', '#808080' // Extras
];

const BRUSH_SIZES = [5, 10, 20, 30];

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, backgroundImageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(10);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  
  // To handle resizing and redrawing background
  useEffect(() => {
    if (isOpen && backgroundImageUrl && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const container = containerRef.current;

      if (!ctx) return;

      // Set canvas size to match container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Load and draw background image
      const img = new Image();
      img.src = backgroundImageUrl;
      img.onload = () => {
        // Calculate aspect ratio to fit image centered
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
    }
  }, [isOpen, backgroundImageUrl]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (backgroundImageUrl && canvasRef.current) {
        // Trigger re-run of the useEffect to reload image
        // A simple way is to manually call the logic inside useEffect
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.src = backgroundImageUrl;
        img.onload = () => {
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'boyama-sayfasi.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Left Toolbar (Colors & Tools) */}
        <div className="w-full md:w-24 bg-stone-100 p-4 flex md:flex-col items-center gap-4 border-b md:border-r border-stone-200 overflow-x-auto md:overflow-y-auto no-scrollbar">
          
          <div className="flex md:flex-col gap-2">
             <button 
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                title="Kapat"
             >
                <X size={24} />
             </button>
             <div className="w-px h-8 md:w-8 md:h-px bg-stone-300 mx-auto" />
          </div>

          <div className="flex md:flex-col gap-2">
             {COLORS.map(c => (
               <button
                 key={c}
                 onClick={() => { setColor(c); setTool('brush'); }}
                 className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'brush' ? 'border-stone-800 scale-110 shadow-md' : 'border-transparent'}`}
                 style={{ backgroundColor: c }}
               />
             ))}
          </div>

          <div className="w-px h-8 md:w-8 md:h-px bg-stone-300 mx-auto" />

          <button 
             onClick={() => setTool('eraser')}
             className={`p-3 rounded-xl flex flex-col items-center gap-1 ${tool === 'eraser' ? 'bg-orange-200 text-orange-800' : 'bg-white text-stone-600'}`}
          >
             <Eraser size={20} />
             <span className="text-[10px] font-bold">Silgi</span>
          </button>

        </div>

        {/* Canvas Area */}
        <div className="flex-grow bg-stone-200 relative p-4" ref={containerRef}>
           <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden relative cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="touch-none w-full h-full"
              />
           </div>
        </div>

        {/* Bottom/Right Toolbar (Actions) */}
        <div className="w-full md:w-24 bg-stone-100 p-4 flex md:flex-col items-center justify-between border-t md:border-l border-stone-200">
           
           <div className="flex md:flex-col gap-4 items-center">
              {/* Brush Sizes */}
              <div className="flex md:flex-col gap-2 items-center">
                 {BRUSH_SIZES.map(size => (
                   <button
                     key={size}
                     onClick={() => setBrushSize(size)}
                     className={`rounded-full bg-stone-800 transition-all ${brushSize === size ? 'opacity-100 ring-2 ring-orange-400' : 'opacity-30 hover:opacity-50'}`}
                     style={{ width: size, height: size, minWidth: size, minHeight: size }}
                   />
                 ))}
              </div>
           </div>

           <div className="flex md:flex-col gap-4 mt-4 md:mt-auto">
              <button 
                onClick={clearCanvas}
                className="p-3 bg-white hover:bg-red-50 text-red-500 rounded-xl shadow-sm border border-stone-200"
                title="Temizle"
              >
                <Trash2 size={24} />
              </button>
              
              <button 
                onClick={downloadCanvas}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all"
                title="İndir"
              >
                <Download size={24} />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
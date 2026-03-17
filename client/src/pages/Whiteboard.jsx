import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Download, Trash2 } from 'lucide-react';

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(3);
  const [mode, setMode] = useState('draw'); // 'draw' | 'erase'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set actual size in memory (scaled to account for extra pixel density)
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height - 100; // Account for toolbar
      
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Blank white background for saving
    }
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;
    ctx.lineWidth = mode === 'erase' ? brushSize * 10 : brushSize;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `TaskHive-Whiteboard-${new Date().getTime()}.png`;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[calc(100vh-120px)] w-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
    >
      {/* Toolbar */}
      <div className="h-16 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setMode('draw')}
              className={`p-2 rounded-md transition-colors ${mode === 'draw' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Pen Tool"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setMode('erase')}
              className={`p-2 rounded-md transition-colors ${mode === 'erase' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300 mx-2" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#1F2937'].map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setMode('draw'); }}
                className={`w-6 h-6 rounded-full transition-transform ${color === c && mode === 'draw' ? 'scale-125 shadow-md ring-2 ring-blue-400 ring-offset-1' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          
          <div className="h-8 w-px bg-gray-300 mx-2" />
          
          {/* Brush Size */}
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={clearCanvas}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button 
            onClick={downloadCanvas}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
          >
            <Download size={16} />
            Save Img
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full relative cursor-crosshair bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 block touch-none"
        />
      </div>
    </motion.div>
  );
}

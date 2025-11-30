import React, { useState, useEffect } from 'react';
import { SelectedContext, GenerationState } from '../types';
import { Loader2, Image as ImageIcon, AlertCircle, RefreshCw, Clock, Star } from 'lucide-react';

interface DisplayAreaProps {
  selectedContext: SelectedContext | null;
  state: GenerationState;
  onRegenerate: () => void;
  cooldown: number;
}

export const DisplayArea: React.FC<DisplayAreaProps> = ({ selectedContext, state, onRegenerate, cooldown }) => {
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (state.status === 'success' && state.imageUrl) {
      setIsImageLoading(true);
    }
  }, [state.imageUrl, state.status]);

  if (!selectedContext) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-400 p-8 text-center bg-white rounded-3xl shadow-sm border-2 border-stone-100">
        <ImageIcon size={64} className="mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-stone-300">Harf Seçin</h2>
        <p className="text-stone-300">Bir harfe tıklayın ve sihri görün!</p>
      </div>
    );
  }

  const isGenerating = state.status === 'loading';
  const hasImage = state.status === 'success' && state.imageUrl;
  const isCooldown = cooldown > 0;

  // Show loading if we are generating OR if the image is still fetching
  const showLoading = isGenerating || (hasImage && isImageLoading);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-orange-100 relative group">
      {/* Header with Letter and Word */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-white/95 to-transparent z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-8xl font-black text-orange-500 drop-shadow-md leading-none">
            {selectedContext.letter}
          </span>
          <span className="text-3xl font-bold text-stone-700 mt-2 capitalize">
            {selectedContext.word}
          </span>
        </div>
      </div>

      {/* Image Area */}
      <div className="flex-grow bg-stone-50 relative flex items-center justify-center overflow-hidden">
        {showLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
            <div className="relative">
              <Star className="w-24 h-24 text-yellow-400 animate-spin-slow drop-shadow-lg" fill="currentColor" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
            </div>
            <p className="text-orange-500 font-bold text-xl mt-6 animate-bounce">Resim Geliyor...</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center text-red-400 p-8 text-center max-w-md mx-auto">
            <AlertCircle size={48} className="mb-4 text-red-300" />
            <p className="font-bold text-lg mb-2 text-red-500">Hay aksi!</p>
            <p className="text-stone-500">{state.error || "Bir hata oluştu. Lütfen tekrar deneyin."}</p>
          </div>
        )}

        {hasImage && (
          <img
            src={state.imageUrl}
            alt={`${selectedContext.letter} harfi ${selectedContext.word} şeklinde`}
            className={`w-full h-full object-contain p-2 md:p-8 transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100 animate-in fade-in zoom-in'}`}
            onLoad={() => setIsImageLoading(false)}
          />
        )}

        {state.status === 'idle' && !state.imageUrl && (
          <div className="flex flex-col items-center justify-center text-stone-300">
            <p>Resim bekleniyor...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col sm:flex-row gap-3">
        {/* Regenerate Button */}
        <button
          onClick={onRegenerate}
          disabled={showLoading || isCooldown}
          className="bg-white hover:bg-orange-50 text-orange-500 border-2 border-orange-200 hover:border-orange-400 font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isCooldown ? <Clock size={20} className="animate-pulse" /> : <RefreshCw size={20} className={`${showLoading ? 'animate-spin' : ''}`} />}
          <span>{isCooldown ? `Bekle (${cooldown})` : 'Farklı Bir Şey Çiz'}</span>
        </button>
      </div>
    </div>
  );
};
import React, { useState, useCallback, useEffect } from 'react';
import { TURKISH_ALPHABET } from './constants';
import { AlphabetItem, GenerationState, SelectedContext } from './types';
import { generateLetterImage, generateColoringPage } from './services/gemini';
import { DisplayArea } from './components/DisplayArea';
import { LetterGrid } from './components/LetterGrid';
import { DrawingModal } from './components/DrawingModal';
import { Sparkles, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [selectedContext, setSelectedContext] = useState<SelectedContext | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);

  // Coloring Page State
  const [isColoringModalOpen, setIsColoringModalOpen] = useState(false);
  const [coloringImageUrl, setColoringImageUrl] = useState<string | null>(null);
  const [isGeneratingColoring, setIsGeneratingColoring] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const generateImageForContext = async (context: SelectedContext) => {
    const cacheKey = `${context.letter}-${context.word}`;

    setGenerationState({ status: 'loading' });

    if (imageCache[cacheKey]) {
      setGenerationState({
        status: 'success',
        imageUrl: imageCache[cacheKey]
      });
      // Small cooldown even for cached items to prevent flickering/spam
      setCooldown(2);
      return;
    }

    try {
      const imageUrl = await generateLetterImage(context);
      setImageCache(prev => ({ ...prev, [cacheKey]: imageUrl }));
      setGenerationState({
        status: 'success',
        imageUrl
      });
      // 5 seconds cooldown after expensive API call
      setCooldown(5);
    } catch (error: any) {
      let errorMessage = "Resim oluşturulamadı. Lütfen tekrar deneyin.";
      if (error.message === "QUOTA_EXCEEDED") {
          errorMessage = "Şu an çok yoğunuz! Lütfen 1 dakika bekleyip tekrar deneyin. (API Kotası Doldu)";
      } else if (error.message === "DAILY_LIMIT_EXCEEDED") {
          errorMessage = "Bugünlük resim hakkımız doldu! Yarın tekrar gelip yeni resimler çizebilirsin. (Günlük Limit: 100)";
      }
      setGenerationState({
        status: 'error',
        error: errorMessage
      });
      setCooldown(5); // Cooldown on error too
    }
  };

  const handleLetterSelect = useCallback((item: AlphabetItem) => {
    if (cooldown > 0) return;

    const randomIndex = Math.floor(Math.random() * item.examples.length);
    const randomExample = item.examples[randomIndex];

    const newContext: SelectedContext = {
      letter: item.letter,
      word: randomExample.word,
      englishTranslation: randomExample.englishTranslation
    };

    setSelectedContext(newContext);
    generateImageForContext(newContext);
  }, [imageCache, cooldown]);

  const handleRegenerate = useCallback(() => {
    if (!selectedContext || cooldown > 0) return;

    const item = TURKISH_ALPHABET.find(i => i.letter === selectedContext.letter);
    if (!item) return;

    let nextExample = item.examples[0];
    if (item.examples.length > 1) {
       const otherExamples = item.examples.filter(e => e.word !== selectedContext.word);
       if (otherExamples.length > 0) {
         const randomIndex = Math.floor(Math.random() * otherExamples.length);
         nextExample = otherExamples[randomIndex];
       } else {
         const randomIndex = Math.floor(Math.random() * item.examples.length);
         nextExample = item.examples[randomIndex];
       }
    }

    const newContext: SelectedContext = {
      letter: item.letter,
      word: nextExample.word,
      englishTranslation: nextExample.englishTranslation
    };

    setSelectedContext(newContext);
    generateImageForContext(newContext);

  }, [selectedContext, imageCache, cooldown]);

  const handleOpenColoring = async () => {
    if (!selectedContext || cooldown > 0) return;
    
    setIsGeneratingColoring(true);
    try {
      const url = await generateColoringPage(selectedContext);
      setColoringImageUrl(url);
      setIsColoringModalOpen(true);
      // Long cooldown after generating coloring page
      setCooldown(5);
    } catch (error: any) {
      let msg = "Boyama sayfası oluşturulamadı.";
      if (error.message === "DAILY_LIMIT_EXCEEDED") {
        msg = "Bugünlük limitimiz doldu. Yarın tekrar dene!";
      }
      alert(msg);
      setCooldown(3);
    } finally {
      setIsGeneratingColoring(false);
    }
  };

  const isBusy = generationState.status === 'loading' || isGeneratingColoring || cooldown > 0;

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-stone-800 flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 pb-0 flex items-center justify-center text-orange-500">
         <Sparkles className="mr-2" />
         <h1 className="text-xl font-black tracking-tight text-stone-700">İnci Harf Öğreniyor</h1>
      </div>

      {/* Left Panel (Image Display) */}
      <main className="w-full md:w-1/2 lg:w-3/5 h-[50vh] md:h-screen p-4 md:p-8 flex flex-col justify-center relative">
         <DisplayArea 
           selectedContext={selectedContext} 
           state={generationState} 
           onRegenerate={handleRegenerate}
           onOpenColoring={handleOpenColoring}
           cooldown={cooldown}
         />

         {/* Coloring Loading Overlay */}
         {isGeneratingColoring && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
             <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center animate-in zoom-in">
               <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-3" />
               <p className="text-purple-600 font-bold">Boyama Sayfası Hazırlanıyor...</p>
             </div>
           </div>
         )}
      </main>

      {/* Right Panel (Keyboard) */}
      <aside className="w-full md:w-1/2 lg:w-2/5 h-[50vh] md:h-screen bg-orange-100/50 md:bg-transparent flex flex-col">
        <div className="hidden md:flex p-8 pb-4 items-center text-orange-500">
           <div className="bg-white p-3 rounded-full shadow-sm">
             <Sparkles size={24} />
           </div>
           <h1 className="ml-4 text-3xl font-black tracking-tight text-stone-700">İnci Harf Öğreniyor</h1>
        </div>

        <div className="flex-grow p-2 md:p-4 overflow-hidden">
          <div className="h-full bg-white/50 backdrop-blur-sm rounded-t-3xl md:rounded-3xl border border-white/60 shadow-inner p-2">
            <LetterGrid 
              onSelect={handleLetterSelect} 
              selectedLetter={selectedContext?.letter || null}
              disabled={isBusy}
            />
          </div>
        </div>
      </aside>

      {/* Drawing Modal */}
      <DrawingModal 
        isOpen={isColoringModalOpen} 
        onClose={() => setIsColoringModalOpen(false)}
        backgroundImageUrl={coloringImageUrl}
      />

    </div>
  );
};

export default App;
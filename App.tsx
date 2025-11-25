import React, { useState, useCallback } from 'react';
import { TURKISH_ALPHABET } from './constants';
import { AlphabetItem, GenerationState, SelectedContext } from './types';
import { generateLetterImage } from './services/gemini';
import { DisplayArea } from './components/DisplayArea';
import { LetterGrid } from './components/LetterGrid';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [selectedContext, setSelectedContext] = useState<SelectedContext | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });

  // Cache to store generated images: key is "Letter-Word" (e.g., "A-Araba")
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  const generateImageForContext = async (context: SelectedContext) => {
    const cacheKey = `${context.letter}-${context.word}`;

    setGenerationState({ status: 'loading' });

    // Check cache
    if (imageCache[cacheKey]) {
      setGenerationState({
        status: 'success',
        imageUrl: imageCache[cacheKey]
      });
      return;
    }

    try {
      const imageUrl = await generateLetterImage(context);
      setImageCache(prev => ({ ...prev, [cacheKey]: imageUrl }));
      setGenerationState({
        status: 'success',
        imageUrl
      });
    } catch (error) {
      setGenerationState({
        status: 'error',
        error: "Failed to generate image"
      });
    }
  };

  const handleLetterSelect = useCallback((item: AlphabetItem) => {
    // Pick a random example for this letter
    const randomIndex = Math.floor(Math.random() * item.examples.length);
    const randomExample = item.examples[randomIndex];

    const newContext: SelectedContext = {
      letter: item.letter,
      word: randomExample.word,
      englishTranslation: randomExample.englishTranslation
    };

    setSelectedContext(newContext);
    generateImageForContext(newContext);
  }, [imageCache]);

  const handleRegenerate = useCallback(() => {
    if (!selectedContext) return;

    // Find the alphabet item for current letter
    const item = TURKISH_ALPHABET.find(i => i.letter === selectedContext.letter);
    if (!item) return;

    // Try to pick a different example if possible
    let nextExample = item.examples[0];
    if (item.examples.length > 1) {
       // Filter out the current word to avoid immediate repeat if possible, unless it's the only one
       const otherExamples = item.examples.filter(e => e.word !== selectedContext.word);
       if (otherExamples.length > 0) {
         const randomIndex = Math.floor(Math.random() * otherExamples.length);
         nextExample = otherExamples[randomIndex];
       } else {
         // Fallback just in case logic fails or only 1 item exists
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

  }, [selectedContext, imageCache]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-stone-800 flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 pb-0 flex items-center justify-center text-orange-500">
         <Sparkles className="mr-2" />
         <h1 className="text-xl font-black tracking-tight text-stone-700">Harf Dünyası</h1>
      </div>

      {/* Left Panel (Image Display) - Top on Mobile, Left on Desktop */}
      <main className="w-full md:w-1/2 lg:w-3/5 h-[50vh] md:h-screen p-4 md:p-8 flex flex-col justify-center">
         <DisplayArea 
           selectedContext={selectedContext} 
           state={generationState} 
           onRegenerate={handleRegenerate}
         />
      </main>

      {/* Right Panel (Keyboard) - Bottom on Mobile, Right on Desktop */}
      <aside className="w-full md:w-1/2 lg:w-2/5 h-[50vh] md:h-screen bg-orange-100/50 md:bg-transparent flex flex-col">
        
        {/* Desktop Header */}
        <div className="hidden md:flex p-8 pb-4 items-center text-orange-500">
           <div className="bg-white p-3 rounded-full shadow-sm">
             <Sparkles size={24} />
           </div>
           <h1 className="ml-4 text-3xl font-black tracking-tight text-stone-700">Harf Dünyası</h1>
        </div>

        <div className="flex-grow p-2 md:p-4 overflow-hidden">
          <div className="h-full bg-white/50 backdrop-blur-sm rounded-t-3xl md:rounded-3xl border border-white/60 shadow-inner p-2">
            <LetterGrid 
              onSelect={handleLetterSelect} 
              selectedLetter={selectedContext?.letter || null}
              disabled={generationState.status === 'loading'}
            />
          </div>
        </div>
      </aside>

    </div>
  );
};

export default App;
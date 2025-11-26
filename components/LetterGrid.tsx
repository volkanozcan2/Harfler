import React from 'react';
import { TURKISH_ALPHABET } from '../constants';
import { AlphabetItem } from '../types';

interface LetterGridProps {
  onSelect: (item: AlphabetItem) => void;
  selectedLetter: string | null;
  disabled: boolean;
}

export const LetterGrid: React.FC<LetterGridProps> = ({ onSelect, selectedLetter, disabled }) => {
  return (
    <div className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-4 pb-24 md:pb-4 overflow-y-auto max-h-full no-scrollbar transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {TURKISH_ALPHABET.map((item) => {
        const isSelected = selectedLetter === item.letter;
        return (
          <button
            key={item.letter}
            onClick={() => onSelect(item)}
            disabled={disabled}
            className={`
              aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md transition-all duration-200 transform
              ${isSelected 
                ? 'bg-orange-500 text-white scale-105 ring-4 ring-orange-200 shadow-xl z-10' 
                : 'bg-white text-stone-600 hover:bg-orange-50 hover:text-orange-500 hover:scale-105 active:scale-95'
              }
              ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer'}
            `}
          >
            {item.letter}
          </button>
        );
      })}
    </div>
  );
};
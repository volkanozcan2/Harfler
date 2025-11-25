export interface WordExample {
  word: string;
  englishTranslation: string;
}

export interface AlphabetItem {
  letter: string;
  examples: WordExample[];
}

export interface SelectedContext {
  letter: string;
  word: string;
  englishTranslation: string;
}

export interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  error?: string;
}
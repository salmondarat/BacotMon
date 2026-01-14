export enum Tone {
  SALMON = 'Salmon',
  CASUAL = 'Casual',
  FORMAL = 'Formal',
  PROFESSIONAL = 'Professional',
  ACADEMIC = 'Academic',
  CREATIVE = 'Creative',
}

export interface Language {
  code: string;
  name: string;
  rtl?: boolean;
}

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export type TranslateMode = 'TEXT' | 'DOCUMENT';

export interface TranslationState {
  sourceText: string;
  translatedText: string;
  sourceLang: string; // 'auto' or code
  targetLang: string;
  isTranslating: boolean;
  isGettingPhonetics: boolean;
  tone: Tone;
  error: string | null;
  detectedLang: DetectedLanguage | null;
  phoneticText: string | null;
  uploadedFile: FileMetadata | null;
}
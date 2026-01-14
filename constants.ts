import { Language, Tone } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Detect Language', rtl: false },
  { code: 'en', name: 'English', rtl: false },
  { code: 'id', name: 'Indonesian', rtl: false },
  { code: 'jv', name: 'Javanese', rtl: false },
  { code: 'es', name: 'Spanish', rtl: false },
  { code: 'fr', name: 'French', rtl: false },
  { code: 'de', name: 'German', rtl: false },
  { code: 'it', name: 'Italian', rtl: false },
  { code: 'pt', name: 'Portuguese', rtl: false },
  { code: 'nl', name: 'Dutch', rtl: false },
  { code: 'ru', name: 'Russian', rtl: false },
  { code: 'zh', name: 'Chinese (Simplified)', rtl: false },
  { code: 'ja', name: 'Japanese', rtl: false },
  { code: 'ko', name: 'Korean', rtl: false },
  { code: 'ar', name: 'Arabic', rtl: true },
  { code: 'hi', name: 'Hindi', rtl: false },
  { code: 'tr', name: 'Turkish', rtl: false },
  { code: 'pl', name: 'Polish', rtl: false },
  { code: 'vi', name: 'Vietnamese', rtl: false },
  { code: 'th', name: 'Thai', rtl: false },
  { code: 'he', name: 'Hebrew', rtl: true },
  { code: 'fa', name: 'Persian', rtl: true },
  { code: 'ur', name: 'Urdu', rtl: true },
];

export interface ToneOption {
  value: Tone;
  label: string;
  description: string;
  instruction: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    value: Tone.CASUAL,
    label: 'Casual',
    description: 'Relaxed, friendly, and informal. Good for chat and social media.',
    instruction: 'Translate with a casual, everyday tone. Use natural phrasing, contractions, and appropriate slang. The vibe should be friendly and approachable.'
  },
  {
    value: Tone.SALMON,
    label: 'Salmon',
    description: 'Condescending, snarky, and brutally honest. A mix of arrogance and blunt truth.',
    instruction: `Adopt the 'Salmon' persona. This is a mix of 'Sengak' (condescending/snarky) and 'Blak-blakan' (blunt/straightforward).
    
    KEY ATTITUDES:
    1. "Sengak" (Condescending):
       - Message: "I am smarter than you."
       - Diction: Use belittling adverbs (e.g., "Obviously...", "Clearly...", "Actually...").
       - Style: Rhetorical questions implying the reader is slow (e.g., "Do I need to explain this?").
       - Nicknames: Patronizing terms like "Honey," "Sweetie," or "Buddy" if the context allows.
       - Vibe: Slow down, stretched intonation implied by text structure.
       
    2. "Blak-blakan" (Blunt):
       - Message: "Here is the raw truth, deal with it."
       - Diction: No sugar-coating. Avoid "maybe" or "I feel".
       - Openers: "Look,", "Let's be real,", "To be honest,".
       - Verbs: Active, harsh, and final.
       
    OVERALL GOAL: Translate the text accurately but wrap it in a voice that sounds superior, slightly annoyed by the existence of the reader, and mercilessly direct.`
  },
  {
    value: Tone.FORMAL,
    label: 'Formal',
    description: 'Respectful and standard. Suitable for general business or polite interaction.',
    instruction: 'Translate with a formal and respectful tone. Use standard grammar, complete sentences, and polite phrasing. Avoid slang.'
  },
  {
    value: Tone.PROFESSIONAL,
    label: 'Professional',
    description: 'Objective, clear, and business-appropriate. For reports and emails.',
    instruction: 'Translate with a professional tone. Focus on clarity, objectivity, and business-appropriate vocabulary. Efficient and polished.'
  },
  {
    value: Tone.ACADEMIC,
    label: 'Academic',
    description: 'Scholarly, complex, and precise. For research and study.',
    instruction: 'Translate with an academic tone. Use sophisticated vocabulary, complex sentence structures where necessary, and high precision. Suitable for research or scholarly contexts.'
  },
  {
    value: Tone.CREATIVE,
    label: 'Creative',
    description: 'Expressive and imaginative. For stories and literature.',
    instruction: 'Translate with a creative tone. Focus on flow, imagery, and emotional resonance. Feel free to use more descriptive or poetic language to capture the essence.'
  }
];

// For backward compatibility if needed, though we should prefer TONE_OPTIONS
export const TONES: Tone[] = TONE_OPTIONS.map(o => o.value);
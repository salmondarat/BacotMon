import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Tone } from '../types';
import { TONE_OPTIONS } from '../constants';

interface ToneSelectorProps {
  value: Tone;
  onChange: (value: Tone) => void;
}

const ToneSelector: React.FC<ToneSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = TONE_OPTIONS.find(opt => opt.value === value) || TONE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full md:w-64" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-sm font-medium hover:bg-slate-100 transition-colors"
      >
        <div className="flex flex-col items-start truncate">
          <span>{selectedOption.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[400px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 origin-top-left ring-1 ring-black ring-opacity-5">
          <div className="p-1 space-y-1">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-start gap-3 group ${
                  value === option.value 
                    ? 'bg-blue-50' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    value === option.value ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}>
                    {value === option.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${value === option.value ? 'text-blue-700' : 'text-slate-700'}`}>
                    {option.label}
                  </div>
                  <div className={`text-xs mt-0.5 leading-relaxed ${value === option.value ? 'text-blue-600/80' : 'text-slate-500'}`}>
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToneSelector;
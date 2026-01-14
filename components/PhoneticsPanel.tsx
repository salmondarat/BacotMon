import React from 'react';
import { X, Loader2, Ear, BookOpen } from 'lucide-react';

interface PhoneticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  text: string | null;
}

const PhoneticsPanel: React.FC<PhoneticsPanelProps> = ({
  isOpen,
  onClose,
  isLoading,
  text
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Panel Container */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-2xl border-t border-slate-200 flex flex-col
        lg:static lg:w-80 lg:shadow-none lg:rounded-2xl lg:border lg:h-auto lg:bg-slate-50/50
        transition-all duration-300 ease-in-out
        max-h-[80vh] lg:max-h-none
        animate-in slide-in-from-bottom-10 lg:animate-in lg:slide-in-from-right-10
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Ear className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm uppercase tracking-wide">Pronunciation</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-sm">Analyzing phonetics...</p>
            </div>
          ) : text ? (
            <div className="space-y-4">
               <div className="prose prose-slate prose-sm max-w-none">
                 <p className="text-lg text-slate-700 font-medium leading-relaxed italic">
                   {text}
                 </p>
               </div>
               
               <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 flex gap-2">
                 <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                 <p className="text-xs text-blue-600/80 leading-relaxed">
                   Use this guide to practice your pronunciation. The transcription approximates the sounds of the target language.
                 </p>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2 opacity-60">
               <Ear className="w-8 h-8 mb-2" />
               <p className="text-sm text-center">Select text or click the ear icon to see pronunciation.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PhoneticsPanel;
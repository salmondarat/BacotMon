import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowRightLeft, Copy, Check, Sparkles, Upload, Download, Globe, X, FileText, Loader2, Volume2, Ear, Trash2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

import { SUPPORTED_LANGUAGES } from './constants';
import { Tone, TranslationState } from './types';
import { translateTextStream, polishTextStream, getPhonetics } from './services/geminiService';
import { useDebounce } from './hooks/useDebounce';
import Button from './components/Button';
import LanguageSelector from './components/LanguageSelector';
import ToneSelector from './components/ToneSelector';
import PhoneticsPanel from './components/PhoneticsPanel';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

function App() {
  const [state, setState] = useState<TranslationState>({
    sourceText: '',
    translatedText: '',
    sourceLang: 'auto',
    targetLang: 'en',
    isTranslating: false,
    isGettingPhonetics: false,
    tone: Tone.CASUAL,
    error: null,
    detectedLang: null,
    phoneticText: null,
    uploadedFile: null,
  });

  const [showPhonetics, setShowPhonetics] = useState(false);
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  
  const debouncedSourceText = useDebounce(state.sourceText, 800);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetTextRef = useRef<HTMLTextAreaElement>(null);

  const isRTL = (langCode: string) => SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.rtl || false;
  const getLanguageName = (code: string) => SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;

  const handleTranslate = useCallback(async (text: string, source: string, target: string, tone: Tone) => {
    if (!text.trim()) {
      setState(prev => ({ ...prev, translatedText: '', detectedLang: null, phoneticText: null }));
      return;
    }

    setState(prev => ({ 
      ...prev, isTranslating: true, error: null, translatedText: '', 
      detectedLang: source === 'auto' ? null : prev.detectedLang,
      phoneticText: null 
    }));

    try {
      let accumulatedText = '';
      await translateTextStream(
        text, source, target, tone,
        (chunk) => {
          accumulatedText += chunk;
          setState(prev => ({ ...prev, translatedText: accumulatedText }));
        },
        (meta) => {
           if (source === 'auto') {
             setState(prev => ({
                ...prev, detectedLang: { code: meta.code, name: getLanguageName(meta.code), confidence: meta.confidence }
             }));
           }
        }
      );
    } catch (err) {
      setState(prev => ({ ...prev, error: "Translation failed." }));
    } finally {
      setState(prev => ({ ...prev, isTranslating: false }));
    }
  }, []);

  const handlePolish = async () => {
    if (!state.sourceText.trim()) return;
    setState(prev => ({ ...prev, isTranslating: true, error: null, translatedText: '', phoneticText: null }));

    try {
      let accumulatedText = '';
      await polishTextStream(state.sourceText, state.tone, (chunk) => {
        accumulatedText += chunk;
        setState(prev => ({ ...prev, translatedText: accumulatedText }));
      });
    } catch (err) {
      setState(prev => ({ ...prev, error: "Polishing failed." }));
    } finally {
      setState(prev => ({ ...prev, isTranslating: false }));
    }
  };

  const handleManualPhonetics = async () => {
      if (!state.translatedText) return;
      
      setShowPhonetics(true);
      setState(prev => ({ ...prev, isGettingPhonetics: true, phoneticText: null }));
      
      try {
          // Check for selection in the target textarea
          let textToProcess = state.translatedText;
          if (targetTextRef.current) {
              const start = targetTextRef.current.selectionStart;
              const end = targetTextRef.current.selectionEnd;
              if (start !== end) {
                  const selectedText = state.translatedText.substring(start, end);
                  if (selectedText.trim()) {
                      textToProcess = selectedText;
                  }
              }
          }

          const phonetic = await getPhonetics(textToProcess, state.targetLang);
          setState(prev => ({ ...prev, phoneticText: phonetic }));
      } catch (err) {
          console.error(err);
      } finally {
          setState(prev => ({ ...prev, isGettingPhonetics: false }));
      }
  };

  // Auto-translate effect
  useEffect(() => {
    if (debouncedSourceText) {
      handleTranslate(debouncedSourceText, state.sourceLang, state.targetLang, state.tone);
    } else {
        setState(prev => ({...prev, translatedText: '', detectedLang: null, phoneticText: null}));
    }
  }, [debouncedSourceText, state.sourceLang, state.targetLang, state.tone, handleTranslate]);

  const handleSwapLanguages = () => {
    if (state.sourceLang === 'auto' && !state.detectedLang) return;
    const newTarget = state.sourceLang === 'auto' && state.detectedLang ? state.detectedLang.code : state.sourceLang;
    setState(prev => ({
      ...prev, sourceLang: state.targetLang, targetLang: newTarget,
      sourceText: prev.translatedText, translatedText: prev.sourceText,
      detectedLang: null, phoneticText: null
    }));
  };

  const handleCopy = async (text: string, isSource: boolean) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    if (isSource) { setCopiedSource(true); setTimeout(() => setCopiedSource(false), 2000); } 
    else { setCopiedTarget(true); setTimeout(() => setCopiedTarget(false), 2000); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += `--- Page ${i} ---\n\n` + content.items.map((item: any) => item.str).join(' ') + '\n\n';
            }
            setState(prev => ({ ...prev, sourceText: fullText, uploadedFile: { name: file.name, size: file.size, type: file.type } }));
        } catch (error) {
            setState(prev => ({ ...prev, error: "Failed to parse PDF." }));
        }
    } else {
        const reader = new FileReader();
        reader.onload = (ev) => setState(prev => ({ 
            ...prev, sourceText: ev.target?.result as string, 
            uploadedFile: { name: file.name, size: file.size, type: file.type } 
        }));
        reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setState(prev => ({ 
        ...prev, 
        sourceText: '', 
        uploadedFile: null,
        translatedText: '', 
        detectedLang: null,
        phoneticText: null
    }));
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!state.translatedText) return;
    const url = URL.createObjectURL(new Blob([state.translatedText], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `translation-${state.targetLang}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const speakText = (text: string, lang: string) => {
      const u = new SpeechSynthesisUtterance(text);
      if (lang !== 'auto') u.lang = lang;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Globe className="w-6 h-6" /></div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">BacotMon</h1>
          </div>
          <div className="hidden md:flex gap-4">
             <Button variant="outline" size="sm" icon={<Sparkles className="w-4 h-4" />} onClick={handlePolish} disabled={state.isTranslating || !state.sourceText} className="text-purple-700 border-purple-200 hover:bg-purple-50">Grammar Polish</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-40">
           <div className="flex flex-1 flex-col md:flex-row w-full gap-3 items-center">
              <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                 <LanguageSelector value={state.sourceLang} onChange={(val) => setState(prev => ({ ...prev, sourceLang: val }))} />
                 <button onClick={handleSwapLanguages} disabled={state.sourceLang === 'auto' && !state.detectedLang} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowRightLeft className="w-5 h-5" /></button>
                 <LanguageSelector value={state.targetLang} onChange={(val) => setState(prev => ({ ...prev, targetLang: val }))} excludeAuto />
              </div>
              <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>
              <div className="w-full md:w-auto"><ToneSelector value={state.tone} onChange={(val) => setState(prev => ({ ...prev, tone: val }))} /></div>
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv,.js,.ts,.html,.pdf"/>
              <Button variant="ghost" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>Upload</Button>
              <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleDownload} disabled={!state.translatedText}>Download</Button>
           </div>
        </div>

        {/* Translation Area with Side Panel Support */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[500px]">
           {/* Source Pane */}
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">Source</span>
                    {state.sourceLang === 'auto' && state.detectedLang && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full border border-blue-100"><span className="text-xs font-semibold text-blue-700">{state.detectedLang.name}</span></div>
                    )}
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => speakText(state.sourceText, state.sourceLang)} className="p-2 hover:bg-slate-200 rounded-md text-slate-400"><Volume2 className="w-4 h-4" /></button>
                    <button onClick={() => handleCopy(state.sourceText, true)} className="p-2 hover:bg-slate-200 rounded-md text-slate-400">{copiedSource ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                    {state.sourceText && <button onClick={() => setState(prev => ({...prev, sourceText: '', translatedText: '', uploadedFile: null}))} className="p-2 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                 </div>
              </div>
              {state.uploadedFile && (
                  <div className="mx-3 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between shadow-sm">
                      <div className="flex gap-3 items-center"><FileText className="w-5 h-5 text-blue-600" /><span className="text-sm font-semibold truncate max-w-[150px]">{state.uploadedFile.name}</span></div>
                      <button onClick={handleRemoveFile} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
              )}
              {/* Removed h-full, added text-slate-800 and placeholder-slate-400 */}
              <textarea 
                className={`flex-1 w-full p-5 resize-none focus:outline-none bg-transparent text-lg text-slate-800 placeholder:text-slate-400 min-h-0 appearance-none ${isRTL(state.sourceLang) ? 'text-right' : 'text-left'}`} 
                placeholder="Type or upload..." 
                value={state.sourceText} 
                onChange={(e) => setState(prev => ({ ...prev, sourceText: e.target.value }))} 
                spellCheck="false" 
              />
              <div className="p-3 text-right text-xs text-slate-400 border-t border-slate-50">{state.sourceText.length} chars</div>
           </div>

           {/* Target Pane */}
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden bg-slate-50/30">
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                 <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider pl-2 flex gap-2">Translation {state.isTranslating && <Loader2 className="w-3 h-3 animate-spin" />}</span>
                 <div className="flex gap-1">
                    <button onClick={() => speakText(state.translatedText, state.targetLang)} className="p-2 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600" title="Listen"><Volume2 className="w-4 h-4" /></button>
                    <button 
                        onClick={handleManualPhonetics}
                        className={`p-2 rounded-md transition-all ${showPhonetics ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
                        title="Pronunciation (Select text for specific)"
                        disabled={!state.translatedText}
                    >
                         <Ear className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCopy(state.translatedText, false)} className="p-2 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600">{copiedTarget ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                 </div>
              </div>
              <div className="relative flex-1 flex flex-col min-h-0">
                  {/* Removed h-full, added text-slate-800 */}
                  <textarea
                     ref={targetTextRef}
                     readOnly
                     className={`flex-1 w-full p-5 resize-none focus:outline-none bg-transparent text-lg text-slate-800 placeholder:text-slate-400 min-h-0 appearance-none ${isRTL(state.targetLang) ? 'text-right' : 'text-left'}`}
                     placeholder={state.isTranslating ? "Translating..." : "Translation will appear here"}
                     value={state.translatedText}
                  />
                  {!state.sourceText && <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none"><FileText className="w-16 h-16 mb-4 opacity-20" /><p className="text-sm font-medium">Ready to translate</p></div>}
              </div>
              <div className="p-3 text-right text-xs text-slate-400 border-t border-slate-50">{state.translatedText.length} chars</div>
           </div>

           {/* Phonetics Panel */}
           <PhoneticsPanel 
              isOpen={showPhonetics} 
              onClose={() => setShowPhonetics(false)} 
              isLoading={state.isGettingPhonetics}
              text={state.phoneticText}
           />
        </div>

        {state.error && <div className="fixed bottom-6 right-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex gap-3"><span className="font-medium">Error</span><span className="text-sm">{state.error}</span><button onClick={() => setState(prev => ({...prev, error: null}))}><X className="w-4 h-4" /></button></div>}
      </main>
    </div>
  );
}

export default App;
import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

type GlossaryToastProps = {
  term: string;
  desc: string;
  onClose: () => void;
};

export default function GlossaryToast({
  term,
  desc,
  onClose,
}: GlossaryToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#1a1512]/95 backdrop-blur-sm p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-amber-900/50 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#8c7a6b] hover:text-[#f4ebd8] transition-colors p-1"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="pr-4">
            <h4 className="font-bold font-serif text-amber-500 text-sm mb-1.5 tracking-wider">
              {term}
            </h4>
            <p className="text-xs font-serif text-[#d8c8b8] leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
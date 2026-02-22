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
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-slate-700 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <Info className="text-amber-500 shrink-0 mt-1" size={18} />
          <div>
            <h4 className="font-bold text-amber-500 text-sm mb-1 tracking-wider">
              {term}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログの記録（本番環境の監視ツール等への送信を想定）
    console.error('Application Error Detected:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] supports-[min-height:100svh]:min-h-[100svh] w-full bg-[#1a0f0f] flex flex-col items-center justify-center p-6 text-center font-mono">
      {/* グリッチ風の背景ノイズ */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.05)_2px,rgba(225,29,72,0.05)_4px)] pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full bg-[#2a0f15]/80 p-6 sm:p-8 rounded-2xl border-2 border-rose-900 shadow-[0_0_30px_rgba(225,29,72,0.2)] backdrop-blur-sm animate-in zoom-in-95 duration-500">
        <AlertTriangle className="mx-auto mb-6 text-rose-500 animate-[pulse_2s_infinite]" size={48} />
        
        <h1 className="text-xl sm:text-2xl font-black text-rose-500 mb-2 tracking-widest">FATAL LOGIC ERROR</h1>
        <p className="text-rose-300/80 text-xs sm:text-sm mb-8 tracking-wider">
          予期せぬノイズにより、思考スレッドが強制終了しました。
        </p>

        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-100 py-3.5 rounded-lg flex items-center justify-center gap-2 font-bold tracking-widest transition-all active:scale-95 shadow-md text-sm"
          >
            <RefreshCcw size={18} />
            REBOOT SEQUENCE (再試行)
          </button>
          
          <Link 
            href="/"
            className="w-full bg-[#1a1512] hover:bg-[#2a2420] border border-[#8c7a6b]/50 text-[#d8c8b8] py-3.5 rounded-lg flex items-center justify-center gap-2 font-bold tracking-widest transition-all active:scale-95 shadow-md text-sm"
          >
            <Home size={18} />
            RETURN TO ARCHIVE (初期化)
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-rose-900/50">
          <p className="text-[10px] text-rose-500/50 break-all text-left bg-black/40 p-3 rounded-lg font-mono overflow-y-auto max-h-24 custom-scrollbar">
            ERR_DETAILS: {error.message || 'Unknown processing failure.'}
            {error.digest && <><br/>DIGEST: {error.digest}</>}
          </p>
        </div>
      </div>
    </div>
  );
}
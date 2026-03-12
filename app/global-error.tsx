'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-[100dvh] supports-[min-height:100svh]:min-h-[100svh] w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md w-full bg-[#1a1a1a] p-8 rounded-2xl border-2 border-red-900 shadow-2xl">
            <AlertTriangle className="mx-auto mb-6 text-red-600 animate-pulse" size={48} />
            <h1 className="text-2xl font-black text-red-500 mb-2 tracking-widest">SYSTEM CRASH</h1>
            <p className="text-red-400 text-sm mb-8">深刻なエラーが発生しました。<br/>ブラウザをリロードしてください。</p>
            <button
              onClick={() => reset()}
              className="w-full bg-red-950 hover:bg-red-900 border border-red-700 text-white py-4 rounded-lg font-bold tracking-widest transition-all active:scale-95"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
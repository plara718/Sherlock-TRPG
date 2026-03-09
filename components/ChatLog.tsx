import React, { memo } from 'react';
import Image from 'next/image';

type ChatLogProps = {
  speaker: string;
  text: React.ReactNode;
  feedback?: { type: 'success' | 'fail' | 'penalty'; msg: string } | null;
  isMetaNotice?: boolean;
};

const getIconPath = (speakerName: string) => {
  switch (speakerName) {
    case 'Holmes': return '/images/icon_holmes.png';
    case 'Watson': return '/images/icon_watson.png';
    case 'Irene': return '/images/icon_irene.png';
    default: return null;
  }
};

// ▼ 修正点1: memo() でラップして、プロパティが変化しない過去のログの無駄な再描画を防ぐ
const ChatLog = memo(function ChatLog({ speaker, text, feedback, isMetaNotice }: ChatLogProps) {
  const isSystem = speaker === 'System';
  const iconPath = getIconPath(speaker);

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {isMetaNotice ? (
        // システム通知用の専用UI
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/50 bg-[#1a1512] shadow-[0_0_15px_rgba(245,158,11,0.15)] text-center animate-in zoom-in-95 duration-500 relative overflow-hidden mx-auto w-full max-w-[90%]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
          <p className="font-mono text-[10px] text-amber-500 mb-2 tracking-[0.3em] uppercase animate-pulse">System Notice</p>
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans font-bold text-amber-50 tracking-wider">
            {text}
          </div>
        </div>
      ) : isSystem ? (
        // 通常の地の文のレイアウト
        <div className="p-4 sm:p-5 rounded-xl border transition-all bg-[#e6d5c3]/40 border-[#8c7a6b]/30 shadow-inner">
          <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#5c4d43] italic">
            {text}
          </div>
        </div>
      ) : (
        // キャラクターのレイアウト
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-1">
            {iconPath ? (
              <Image 
                src={iconPath} 
                alt={speaker} 
                width={48} 
                height={48} 
                // ▼ 修正点2: priority を付与して、アイコンの遅延読み込み（チラつき）を防ぐ
                priority={true}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b] shadow-md object-cover bg-[#1a1512]" 
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b]/50 bg-[#e6d5c3] flex items-center justify-center shadow-inner">
                <span className="font-bold font-mono text-[#8c7a6b] text-lg">{speaker.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 sm:p-5 rounded-xl border transition-all bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm relative">
            <div className="absolute top-4 -left-2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#8c7a6b]/40">
              <div className="absolute -top-2 -left-[7px] w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#fffcf7]" />
            </div>
            <div className="font-bold text-xs font-mono text-[#8c7a6b] mb-1.5 uppercase tracking-widest">{speaker}</div>
            <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#3a2f29]">{text}</div>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`p-3 sm:p-4 rounded-lg border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${feedback.type === 'success' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 border-y-emerald-200 border-r-emerald-200' : 'border-rose-600 bg-rose-50 text-rose-900 border-y-rose-200 border-r-rose-200'}`}>
          <p className="font-bold font-mono text-xs sm:text-sm tracking-widest mb-1">{feedback.type === 'success' ? 'INTERRUPT SUCCESS' : feedback.type === 'penalty' ? 'INVALID INTERRUPT' : 'INTERRUPT MISSED'}</p>
          <p className="text-sm sm:text-base italic font-serif leading-relaxed">{feedback.msg}</p>
        </div>
      )}
    </div>
  );
});

export default ChatLog;
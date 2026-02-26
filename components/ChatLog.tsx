import React from 'react';

type ChatLogProps = {
  speaker: string;
  text: React.ReactNode;
  feedback?: { type: 'success' | 'fail' | 'penalty'; msg: string } | null;
};

// スピーカー名から対応するアイコン画像のパスを取得する関数
const getIconPath = (speakerName: string) => {
  switch (speakerName) {
    case 'Holmes':
      return '/images/icon_holmes.png';
    case 'Watson':
      return '/images/icon_watson.png';
    case 'Irene':
      return '/images/icon_irene.png';
    default:
      return null; // アイコンがない場合はnull
  }
};

export default function ChatLog({ speaker, text, feedback }: ChatLogProps) {
  const isSystem = speaker === 'System';
  const iconPath = getIconPath(speaker);

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {isSystem ? (
        // System（地の文）のレイアウト：アイコンなしで全体表示
        <div className="p-4 sm:p-5 rounded-xl border transition-all bg-[#e6d5c3]/40 border-[#8c7a6b]/30 shadow-inner">
          <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#5c4d43] italic">
            {text}
          </div>
        </div>
      ) : (
        // キャラクターのレイアウト：アイコンと吹き出しを横並び
        <div className="flex items-start gap-3 sm:gap-4">
          
          {/* アイコン表示エリア */}
          <div className="shrink-0 mt-1">
            {iconPath ? (
              <img 
                src={iconPath} 
                alt={speaker} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b] shadow-md object-cover bg-[#1a1512]"
              />
            ) : (
              // アイコン未設定キャラ用のイニシャルプレースホルダー
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b]/50 bg-[#e6d5c3] flex items-center justify-center shadow-inner">
                <span className="font-bold font-mono text-[#8c7a6b] text-lg">
                  {speaker.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* 吹き出しエリア */}
          <div className="flex-1 p-4 sm:p-5 rounded-xl border transition-all bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm relative">
             {/* 吹き出しのしっぽ（左向きの三角形） */}
            <div className="absolute top-4 -left-2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#8c7a6b]/40">
              <div className="absolute -top-2 -left-[7px] w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#fffcf7]" />
            </div>

            <div className="font-bold text-xs font-mono text-[#8c7a6b] mb-1.5 uppercase tracking-widest">
              {speaker}
            </div>
            <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#3a2f29]">
              {text}
            </div>
          </div>
        </div>
      )}

      {/* フィードバック表示エリア（変更なし） */}
      {feedback && (
        <div
          className={`p-3 sm:p-4 rounded-lg border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${
            feedback.type === 'success'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 border-y-emerald-200 border-r-emerald-200'
              : 'border-rose-600 bg-rose-50 text-rose-900 border-y-rose-200 border-r-rose-200'
          }`}
        >
          <p className="font-bold font-mono text-xs sm:text-sm tracking-widest mb-1">
            {feedback.type === 'success'
              ? 'INTERRUPT SUCCESS'
              : feedback.type === 'penalty'
              ? 'INVALID INTERRUPT'
              : 'INTERRUPT MISSED'}
          </p>
          <p className="text-sm sm:text-base italic font-serif leading-relaxed">
            {feedback.msg}
          </p>
        </div>
      )}
    </div>
  );
}
// check_glossary.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const GLOSSARY_PATH = path.join(DATA_DIR, 'glossary.json');

// 大索引データの読み込み
const glossaryRaw = fs.readFileSync(GLOSSARY_PATH, 'utf-8');
const glossaryData = JSON.parse(glossaryRaw);

// シナリオの全テキストを抽出
let allScenarioText = '';
const files = fs.readdirSync(DATA_DIR);

files.forEach(file => {
  // episode_, interlude_, spider_web_ から始まるJSONファイルを対象とする
  if (file.startsWith('episode_') || file.startsWith('interlude_') || file.startsWith('spider_web_')) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // beats配列内のtextをすべて結合
      if (fileData.beats && Array.isArray(fileData.beats)) {
        fileData.beats.forEach(beat => {
          if (beat.text) allScenarioText += beat.text + '\n';
        });
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
    }
  }
});

console.log('=========================================');
console.log('🔍 未使用トリガーワード 検出レポート (general 除外)');
console.log('=========================================\n');

let unusedCount = 0;

// glossaryData が配列かオブジェクトかで分岐
const terms = Array.isArray(glossaryData) ? glossaryData : (glossaryData.terms || []);

terms.forEach(term => {
  // ★ "general" の項目は想定内のためチェックから除外
  if (term.appearance === 'general') {
    return;
  }

  let isUsed = false;
  let words = [];
  if (term.trigger_words && Array.isArray(term.trigger_words)) {
    words = term.trigger_words;
  } else if (term.trigger_word) {
    words = [term.trigger_word];
  } else if (term.ja) {
    words = [term.ja]; 
  }

  const unusedWordsForThisTerm = [];
  words.forEach(word => {
    if (allScenarioText.includes(word)) {
      isUsed = true;
    } else {
      unusedWordsForThisTerm.push(word);
    }
  });

  // その項目のトリガーワードが「一つも」シナリオに登場しない場合、警告を出す
  if (!isUsed && words.length > 0) {
    console.log(`[${term.id}] ${term.ja} (指定エピソード: ${term.appearance})`);
    console.log(`   ❌ 以下のワードはシナリオ内で一度も使われていません:`);
    console.log(`      ${unusedWordsForThisTerm.join(', ')}\n`);
    unusedCount++;
  }
});

console.log('-----------------------------------------');
if (unusedCount === 0) {
  console.log('✨ 完璧です！ 出現指定のある大索引項目はすべてシナリオ内で機能しています。');
} else {
  console.log(`⚠️ 合計 ${unusedCount} 個の「シナリオ登場必須」の項目がアンロックされない状態です。`);
  console.log('💡 対策1: そのエピソードがまだ未執筆（モック状態）であれば無視してOKです。');
  console.log('💡 対策2: 既に書いたエピソードの項目であれば、シナリオの表記揺れかトリガーワードの不足です。修正してください。');
}
console.log('=========================================');
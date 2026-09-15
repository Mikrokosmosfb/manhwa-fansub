const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsSection.tsx', 'utf8');

const target = `          {/* Quick Tag Bar & Chibi Emoji Picker Toggle */}
          <div className="flex items-center justify-between gap-2 mt-1.5 px-1 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-medium mr-1">Hızlı İfade:</span>
              {['Efsane!', 'Çok İyi', 'Teşekkürler', 'Harika Bölüm', 'Tavsiye Ederim'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCommentText(prev => (prev ? prev + ' ' + tag : tag))}
                  className="bg-gray-800/80 hover:bg-purple-900/60 border border-purple-500/20 text-xs px-2 py-0.5 rounded-lg text-purple-200 transition font-medium whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={\`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap \${
                showEmojiPicker
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900'
              }\`}
            >
              <Smile size={14} /> Chibi Emojiler {showEmojiPicker ? '▲' : '▼'}
            </button>
          </div>`;

const replacement = `          {/* Quick Tag Bar & Chibi Emoji Picker Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 w-full mask-fade-right pr-4">
              <span className="text-[11px] text-gray-500 font-medium mr-1 shrink-0">Hızlı İfade:</span>
              {['Efsane!', 'Çok İyi', 'Teşekkürler', 'Harika Bölüm', 'Tavsiye Ederim'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCommentText(prev => (prev ? prev + ' ' + tag : tag))}
                  className="bg-gray-800/80 hover:bg-purple-900/60 border border-purple-500/20 text-[11px] px-2 py-1 rounded-lg text-purple-200 transition font-medium whitespace-nowrap shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={\`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap shrink-0 w-full sm:w-auto \${
                showEmojiPicker
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900'
              }\`}
            >
              <Smile size={14} /> Chibi Emojiler {showEmojiPicker ? '▲' : '▼'}
            </button>
          </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/CommentsSection.tsx', code);
  console.log("Patched layout for Chibi Emojiler button.");
} else {
  console.log("Target block not found.");
}

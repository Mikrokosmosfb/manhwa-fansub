const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsSection.tsx', 'utf8');

const target = `    if (res.success) {
      showToast?.({
        title: '🎉 Emoji Paketi Açıldı!',
        message: \`"\${pack.name}" artık kullanımınıza hazır! Keyifli yorumlar.\`,
        type: 'success'
      });
    } else {
      showToast?.({
        title: 'Bakiye Yetersiz 🪙',
        message: res.message,
        type: 'error'
      });
    }`;

const replacement = `    if (res.success) {
      showToast?.({
        title: '🎉 Emoji Paketi Açıldı!',
        message: \`"\${pack.name}" artık kullanımınıza hazır! Keyifli yorumlar.\`,
        type: 'success'
      });
    } else {
      showToast?.({
        title: res.message === 'Ürün bulunamadı.' ? 'Hata ❌' : 'Bakiye Yetersiz 🪙',
        message: res.message,
        type: 'error'
      });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CommentsSection.tsx', code);
console.log("Patched CommentsSection toast");

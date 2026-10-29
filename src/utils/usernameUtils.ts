// Emojileri temizleyen ve kanonik eşleşme sağlayan yardımcı fonksiyon
export const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{FE00}-\u{FE0F}\u{200D}]/gu;

/**
 * Kullanıcı adını kanonik (sadeleştirilmiş) formata çevirir:
 * - Başındaki @ işaretini kaldırır
 * - Tüm emojileri siler ("Anonim🥰" -> "anonim", "Anonim" -> "anonim")
 * - Küçük harfe çevirir ve boşlukları kırpar
 * - Böylece "Anonim" ile "Anonim🥰" aynı isim sayılır!
 * - Ancak "Anonim1" veya "Anonim_x" gibi karakterler farklı kabul edilir.
 */
export function toCanonicalUsername(raw: string | undefined | null): string {
  if (!raw) return '';
  let str = String(raw).trim();
  if (str.startsWith('@')) {
    str = str.substring(1);
  }
  // Remove emojis
  str = str.replace(EMOJI_REGEX, '');
  // Trim and lowercase
  return str.trim().toLowerCase();
}

/**
 * Kullanıcı adını standart "@kullanici" formatına getirir
 */
export function formatUserHandle(raw: string | undefined | null): string {
  if (!raw) return '';
  const clean = String(raw).trim().replace(/^@+/, '').replace(EMOJI_REGEX, '').trim();
  return clean ? `@${clean}` : '';
}

/**
 * Kullanıcı adının 30 gün içinde değiştirilip değiştirilemeyeceğini kontrol eder
 */
export function canChangeUsername(lastChangedAt?: number): { allowed: boolean; remainingDays: number } {
  if (!lastChangedAt) return { allowed: true, remainingDays: 0 };
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - lastChangedAt;
  if (elapsed >= ONE_MONTH_MS) {
    return { allowed: true, remainingDays: 0 };
  }
  const remainingMs = ONE_MONTH_MS - elapsed;
  const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return { allowed: false, remainingDays };
}

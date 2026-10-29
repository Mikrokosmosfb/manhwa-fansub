import { ShopItem } from '../data/shopData';
import { User } from '../types';

export const SHOP_ITEM_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 1 Ay (30 Gün)
export const EXP_PREFIX = '__exp__:';

export const isPermanentInventoryEntry = (id: string): boolean => {
  return id.startsWith('promo_') || id.startsWith('ach_') || id.startsWith('b-');
};

export interface NormalizedShopInventory {
  activeInventory: string[];
  expiresAtMap: Record<string, number>;
  serializedForCloud: string[];
  hasExpiredChanges: boolean;
}

/**
 * Parses one or more raw inventory arrays (which may contain item IDs and "__exp__:<itemId>:<timestamp>" tokens)
 * along with an optional expiresAtMap, strips any expired items (where expiresAt <= now),
 * assigns a 30-day expiration to legacy items without a timestamp, and produces a clean activeInventory.
 */
export function normalizeShopInventory(
  rawArrays: Array<string[] | undefined | null>,
  existingExpiresAt?: Record<string, number> | null,
  now: number = Date.now()
): NormalizedShopInventory {
  const expiresAtMap: Record<string, number> = {};

  if (existingExpiresAt && typeof existingExpiresAt === 'object') {
    for (const [k, v] of Object.entries(existingExpiresAt)) {
      if (k && typeof v === 'number' && !isNaN(v) && v > 0) {
        expiresAtMap[k] = Math.max(expiresAtMap[k] || 0, v);
      }
    }
  }

  const rawItemIds = new Set<string>();

  for (const arr of rawArrays) {
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      if (typeof entry !== 'string' || !entry.trim()) continue;
      const trimmed = entry.trim();
      if (trimmed.startsWith(EXP_PREFIX)) {
        const rest = trimmed.slice(EXP_PREFIX.length);
        const lastColon = rest.lastIndexOf(':');
        if (lastColon > 0) {
          const itemId = rest.slice(0, lastColon);
          const expTs = Number(rest.slice(lastColon + 1));
          if (itemId && !isNaN(expTs) && expTs > 0) {
            expiresAtMap[itemId] = Math.max(expiresAtMap[itemId] || 0, expTs);
          }
        }
      } else {
        rawItemIds.add(trimmed);
      }
    }
  }

  const activeSet = new Set<string>();
  let hasExpiredChanges = false;

  // Handle permanent entries (promo codes, achievement keys) and legacy items without an expiration timestamp
  for (const itemId of rawItemIds) {
    if (isPermanentInventoryEntry(itemId)) {
      activeSet.add(itemId);
      continue;
    }
    if (expiresAtMap[itemId] === undefined) {
      // Legacy purchase without timestamp -> start 30-day timer from now
      expiresAtMap[itemId] = now + SHOP_ITEM_DURATION_MS;
      hasExpiredChanges = true;
    }
  }

  // Evaluate all timed items in expiresAtMap
  for (const [itemId, expTs] of Object.entries(expiresAtMap)) {
    if (isPermanentInventoryEntry(itemId)) {
      activeSet.add(itemId);
      delete expiresAtMap[itemId];
      continue;
    }
    if (expTs > now) {
      activeSet.add(itemId);
    } else {
      if (rawItemIds.has(itemId)) {
        hasExpiredChanges = true;
      }
    }
  }

  const activeInventory = Array.from(activeSet);
  const serializedForCloud = [
    ...activeInventory,
    ...Object.entries(expiresAtMap).map(([id, ts]) => `${EXP_PREFIX}${id}:${ts}`)
  ];

  return {
    activeInventory,
    expiresAtMap,
    serializedForCloud,
    hasExpiredChanges
  };
}

/**
 * Formats remaining time for a purchased shop item (e.g. "29 Gün Kaldı", "14 Saat Kaldı")
 */
export function formatRemainingDuration(expiresAt?: number | null, now: number = Date.now()): string | null {
  if (!expiresAt || isNaN(expiresAt)) return '30 Gün Kaldı';
  const diffMs = expiresAt - now;
  if (diffMs <= 0) return 'Süresi Doldu';
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days > 1) return `${days} Gün Kaldı`;
  const hours = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
  return `${hours} Saat Kaldı`;
}

/**
 * Unequips any theme, frame, or VIP badge whose 1-month duration has expired.
 */
export function stripExpiredEquippedFromUser(
  user: User,
  activeInventory: string[],
  shopItems: ShopItem[]
): {
  equippedTheme: string | null;
  equippedFrame: string | null;
  equippedBadge: string | null;
  equippedBadges: string[];
  didUnequip: boolean;
} {
  let didUnequip = false;

  let equippedTheme = user.equippedTheme || null;
  if (equippedTheme && !activeInventory.includes(equippedTheme)) {
    equippedTheme = null;
    didUnequip = true;
  }

  let equippedFrame = user.equippedFrame || null;
  if (equippedFrame && !activeInventory.includes(equippedFrame)) {
    equippedFrame = null;
    didUnequip = true;
  }

  const rawBadges =
    user.equippedBadges && user.equippedBadges.length > 0
      ? [...user.equippedBadges]
      : user.equippedBadge
      ? [user.equippedBadge]
      : [];

  const validBadges = rawBadges.filter(badgeText => {
    const matchingShopBadges = shopItems.filter(
      i => i.category === 'badge' && (i.badgeText === badgeText || i.name === badgeText)
    );
    if (matchingShopBadges.length === 0) {
      // Not a shop badge (e.g. reading achievement badge) -> keep
      return true;
    }
    const ownsAnyMatching = matchingShopBadges.some(b => activeInventory.includes(b.id));
    if (!ownsAnyMatching) {
      didUnequip = true;
    }
    return ownsAnyMatching;
  });

  const equippedBadge = validBadges[0] || null;
  if ((user.equippedBadge || null) !== equippedBadge) {
    didUnequip = true;
  }

  return {
    equippedTheme,
    equippedFrame,
    equippedBadge,
    equippedBadges: validBadges,
    didUnequip
  };
}

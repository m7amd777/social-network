import { useState, useCallback, useRef } from 'react';

export type EmojiEntry = {
  name: string;
  htmlCode: string[];
  unicode: string[];
};

const BASE_URL = 'https://emojihub.yurace.pro/api/all/category';

export const EMOJI_CATEGORIES = [
  { id: 'smileys-and-people', label: '😀' },
  { id: 'animals-and-nature',  label: '🐻' },
  { id: 'food-and-drink',      label: '🍕' },
  // { id: 'travel-and-places',   label: '✈️' },
  // { id: 'activities',          label: '⚽' },
  // { id: 'objects',             label: '💡' },
  // { id: 'symbols',             label: '❤️' },
  // { id: 'flags',               label: '🏳️' },
] as const;

export type EmojiCategoryId = typeof EMOJI_CATEGORIES[number]['id'];

// Convert unicode array like ["U+1F600"] to the actual character.
export function emojiToChar(unicode: string[]): string {
  try {
    return String.fromCodePoint(...unicode.map(u => parseInt(u.replace('U+', ''), 16)));
  } catch {
    return '';
  }
}

export function useEmojis() {
  const cache = useRef<Partial<Record<EmojiCategoryId, EmojiEntry[]>>>({});
  const [emojis, setEmojis] = useState<EmojiEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchCategory = useCallback(async (category: EmojiCategoryId) => {
    if (cache.current[category]) {
      setEmojis(cache.current[category]!);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res = await fetch(`${BASE_URL}/${category}`);
      if (!res.ok) throw new Error('fetch failed');
      const data: EmojiEntry[] = await res.json();
      cache.current[category] = data;
      setEmojis(data);
    } catch {
      setError(true);
      setEmojis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { emojis, loading, error, fetchCategory };
}

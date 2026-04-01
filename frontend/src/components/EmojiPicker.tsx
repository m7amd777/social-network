import { useEffect, useRef, useState } from 'react';
import { EMOJI_CATEGORIES, emojiToChar, useEmojis, type EmojiCategoryId } from '../hooks/useEmojis';

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategoryId>('smileys-and-people');
  const { emojis, loading, error, fetchCategory } = useEmojis();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch on mount and on category change
  useEffect(() => {
    fetchCategory(activeCategory);
  }, [activeCategory, fetchCategory]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={containerRef} className="emoji-picker">
      {/* Category tabs */}
      <div className="emoji-categories">
        {EMOJI_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`emoji-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            title={cat.id.replace(/-/g, ' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="emoji-grid">
        {loading && (
          <div className="emoji-grid-status">Loading...</div>
        )}
        {error && (
          <div className="emoji-grid-status">Failed to load. Check connection.</div>
        )}
        {!loading && !error && emojis.map((emoji, i) => {
          const char = emojiToChar(emoji.unicode);
          if (!char) return null;
          return (
            <button
              key={i}
              className="emoji-btn"
              title={emoji.name}
              onClick={() => onSelect(char)}
            >
              {char}
            </button>
          );
        })}
      </div>
    </div>
  );
}

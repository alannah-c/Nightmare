import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardData = JSON.parse(readFileSync(join(__dirname, 'cards.json'), 'utf-8'));

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class CardDeck {
  constructor(type) {
    this.type = type;
    this.cards = shuffle(cardData[type].map((c) => ({ ...c })));
    this.drawIndex = 0;
  }

  draw() {
    if (this.drawIndex >= this.cards.length) {
      return null; // deck exhausted
    }
    return this.cards[this.drawIndex++];
  }

  returnToBack(card) {
    this.cards.push(card);
  }

  peek() {
    if (this.drawIndex >= this.cards.length) return null;
    return this.cards[this.drawIndex];
  }

  get remaining() {
    return this.cards.length - this.drawIndex;
  }

  toJSON() {
    return {
      type: this.type,
      remaining: this.remaining,
    };
  }
}

/**
 * Check if a Time card is currently valid based on the video timestamp.
 * - 'At MM:SS' cards: only valid if video time matches (within a window).
 * - 'From MM:SS' cards: valid if video time >= activation time.
 * - 'ANYTIME' cards: always valid.
 * Returns true if the card should be kept, false if it should be returned.
 */
export function isTimeCardActive(card, currentVideoSeconds) {
  if (card.activationAny) return true;
  if (card.activationFrom) return currentVideoSeconds >= (card.activationTime || 0);
  if (card.activationTime !== null) {
    // 'At' cards: valid only if current time hasn't passed the activation time
    return currentVideoSeconds <= card.activationTime;
  }
  return true;
}

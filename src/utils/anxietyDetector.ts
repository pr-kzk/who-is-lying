import { anxietyWords } from "../data/anxietyWords";

/**
 * Checks whether the given text contains any anxiety/hesitation phrases.
 * Used to trigger visual feedback (e.g. shake animation) when a suspect
 * shows signs of nervousness.
 */
export function detectAnxiety(text: string): boolean {
  return anxietyWords.some((word) => text.includes(word));
}

import { Verse } from '../types/database';

export type PracticeMode = 'recall' | 'fill-in-blanks' | 'multiple-choice';

export interface BlankWord {
  index: number;
  correctWord: string;
  options: string[];
  userAnswer: string | null;
}

export interface BlankQuestion {
  verseId: string;
  verseText: string;
  blanks: BlankWord[];
  displayText: string; // Text with blanks replaced by _____
}

export interface MultipleChoiceQuestion {
  verseId: string;
  verseReference: string;
  startingText: string;
  options: string[];
  correctIndex: number;
}

class PracticeService {
  /**
   * Select a practice mode based on user level
   * Beginners get more guided modes (multiple choice, fill-in-blanks)
   * Advanced users get more recall
   */
  selectModeForUser(userLevel: number): PracticeMode {
    const rand = Math.random();

    if (userLevel <= 3) {
      // Beginners: 40% multiple choice, 40% fill-blanks, 20% recall
      if (rand < 0.4) return 'multiple-choice';
      if (rand < 0.8) return 'fill-in-blanks';
      return 'recall';
    } else if (userLevel <= 10) {
      // Intermediate: 33% each
      if (rand < 0.33) return 'multiple-choice';
      if (rand < 0.66) return 'fill-in-blanks';
      return 'recall';
    } else {
      // Advanced: 20% multiple choice, 20% fill-blanks, 60% recall
      if (rand < 0.2) return 'multiple-choice';
      if (rand < 0.4) return 'fill-in-blanks';
      return 'recall';
    }
  }

  /**
   * Generate fill-in-the-blanks question from a verse
   * Blanks out 20-40% of important words (verbs, nouns, theological terms)
   */
  generateBlanks(verse: Verse, otherVerses: Verse[] = []): BlankQuestion {
    const words = verse.text.split(/\s+/);
    const totalWords = words.length;

    // Calculate number of blanks (20-40% of verse)
    const minBlanks = Math.max(2, Math.floor(totalWords * 0.2));
    const maxBlanks = Math.min(10, Math.floor(totalWords * 0.4));
    const numBlanks = Math.floor(Math.random() * (maxBlanks - minBlanks + 1)) + minBlanks;

    // Select important words to blank out
    const blankIndices = this.selectImportantWords(words, numBlanks);

    // Create blank objects with options
    const blanks: BlankWord[] = blankIndices.map(index => {
      const correctWord = this.cleanWord(words[index]);
      const options = this.generateWordOptions(correctWord, words, otherVerses);

      return {
        index,
        correctWord,
        options,
        userAnswer: null,
      };
    });

    // Generate display text with blanks
    const displayWords = words.map((word, index) => {
      if (blankIndices.includes(index)) {
        return '_____';
      }
      return word;
    });

    return {
      verseId: verse.id,
      verseText: verse.text,
      blanks,
      displayText: displayWords.join(' '),
    };
  }

  /**
   * Select important words to blank out (verbs, nouns, theological terms)
   * Prioritizes longer words and avoids articles/prepositions
   */
  private selectImportantWords(words: string[], count: number): number[] {
    const skipWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
    ]);

    // Score each word by importance
    const scoredWords = words.map((word, index) => {
      const cleaned = this.cleanWord(word).toLowerCase();

      // Skip very short words and common words
      if (cleaned.length < 3 || skipWords.has(cleaned)) {
        return { index, score: 0 };
      }

      // Higher score for longer words
      let score = cleaned.length;

      // Boost theological/important words
      const importantWords = [
        'god', 'lord', 'jesus', 'christ', 'spirit', 'holy', 'father',
        'love', 'faith', 'grace', 'mercy', 'salvation', 'heaven', 'sin',
        'righteous', 'blessed', 'glory', 'kingdom', 'eternal', 'truth',
      ];
      if (importantWords.includes(cleaned)) {
        score += 10;
      }

      // Boost capitalized words (likely nouns/proper names)
      if (word[0] === word[0].toUpperCase()) {
        score += 3;
      }

      return { index, score };
    });

    // Sort by score and take top N
    const sorted = scoredWords
      .filter(w => w.score > 0)
      .sort((a, b) => b.score - a.score);

    // Select top scored words, but add some randomness
    const selected: number[] = [];
    const availableIndices = sorted.map(w => w.index);

    while (selected.length < count && availableIndices.length > 0) {
      // Bias towards higher scored words (top 50%)
      const maxIndex = Math.max(
        0,
        Math.floor(availableIndices.length * 0.5)
      );
      const randomIndex = Math.floor(Math.random() * Math.max(1, maxIndex + 1));
      selected.push(availableIndices[randomIndex]);
      availableIndices.splice(randomIndex, 1);
    }

    return selected.sort((a, b) => a - b); // Sort by position
  }

  /**
   * Generate 2-4 word options for a blank (1 correct + 1-3 wrong)
   */
  private generateWordOptions(
    correctWord: string,
    verseWords: string[],
    otherVerses: Verse[]
  ): string[] {
    const numOptions = Math.floor(Math.random() * 3) + 2; // 2-4 options
    const options: string[] = [correctWord];

    // Get all words from other verses for distractors
    const allWords = otherVerses
      .flatMap(v => v.text.split(/\s+/))
      .map(w => this.cleanWord(w))
      .filter(w => w.length >= 3);

    // Also use words from same verse as distractors
    const sameVerseWords = verseWords
      .map(w => this.cleanWord(w))
      .filter(w => w.length >= 3 && w !== correctWord);

    const candidateWords = [...allWords, ...sameVerseWords];

    // Generate distractors
    while (options.length < numOptions && candidateWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidateWords.length);
      const word = candidateWords[randomIndex];

      // Avoid duplicates and similar words
      if (!options.includes(word) && !this.areTooSimilar(word, correctWord)) {
        options.push(word);
      }

      candidateWords.splice(randomIndex, 1);
    }

    // Shuffle options
    return this.shuffleArray(options);
  }

  /**
   * Generate multiple choice question from a verse
   * Shows the beginning of the verse and asks user to complete it
   */
  generateMultipleChoice(
    verse: Verse,
    otherVerses: Verse[]
  ): MultipleChoiceQuestion {
    const words = verse.text.split(/\s+/);

    // Show first 2-4 words as the prompt
    const numStartWords = Math.min(
      Math.max(2, Math.floor(words.length * 0.2)),
      4
    );
    const startingText = words.slice(0, numStartWords).join(' ');

    // Correct answer is the full verse
    const correctOption = verse.text;

    // Generate 2-3 wrong options
    const wrongOptions = this.generateWrongVerseOptions(
      verse,
      startingText,
      otherVerses
    );

    // Combine and shuffle
    const allOptions = [correctOption, ...wrongOptions];
    const shuffled = this.shuffleArray(allOptions);
    const correctIndex = shuffled.indexOf(correctOption);

    return {
      verseId: verse.id,
      verseReference: `${verse.book} ${verse.chapter}:${verse.verse_number}`,
      startingText,
      options: shuffled,
      correctIndex,
    };
  }

  /**
   * Generate plausible wrong verse continuations
   */
  private generateWrongVerseOptions(
    correctVerse: Verse,
    startingText: string,
    otherVerses: Verse[]
  ): string[] {
    const options: string[] = [];

    // Strategy 1: Use similar verses from same book
    const sameBookVerses = otherVerses.filter(v =>
      v.book === correctVerse.book && v.id !== correctVerse.id
    );

    if (sameBookVerses.length > 0) {
      const randomVerse = sameBookVerses[Math.floor(Math.random() * sameBookVerses.length)];
      options.push(randomVerse.text);
    }

    // Strategy 2: Use verses with similar starting words
    const similarStarts = otherVerses.filter(v => {
      const otherStart = v.text.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      const correctStart = startingText.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      return otherStart !== correctStart && v.id !== correctVerse.id;
    });

    if (similarStarts.length > 0 && options.length < 3) {
      const randomVerse = similarStarts[Math.floor(Math.random() * similarStarts.length)];
      if (!options.includes(randomVerse.text)) {
        options.push(randomVerse.text);
      }
    }

    // Strategy 3: Use random verses as fallback
    while (options.length < 3 && otherVerses.length > 0) {
      const randomVerse = otherVerses[Math.floor(Math.random() * otherVerses.length)];
      if (!options.includes(randomVerse.text) && randomVerse.id !== correctVerse.id) {
        options.push(randomVerse.text);
      }
    }

    return options.slice(0, 3); // Max 3 wrong options
  }

  /**
   * Check if fill-in-blanks answer is correct
   */
  checkBlanksAnswer(blanks: BlankWord[]): {
    isCorrect: boolean;
    accuracy: number;
    correctCount: number;
    totalCount: number;
  } {
    const correctBlanks = blanks.filter(blank => {
      if (!blank.userAnswer) return false;
      return this.normalizeWord(blank.userAnswer) === this.normalizeWord(blank.correctWord);
    });

    const correctCount = correctBlanks.length;
    const totalCount = blanks.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    const isCorrect = accuracy >= 90; // 90% threshold

    return {
      isCorrect,
      accuracy,
      correctCount,
      totalCount,
    };
  }

  /**
   * Calculate XP for practice session based on accuracy
   */
  calculateXP(accuracy: number, mode: PracticeMode): number {
    let baseXP = 0;

    // Different base XP for different modes
    const modeMultiplier = {
      'recall': 1.0,           // Hardest = full XP
      'fill-in-blanks': 0.8,   // Medium = 80% XP
      'multiple-choice': 0.6,  // Easiest = 60% XP
    };

    // Base XP by accuracy
    if (accuracy >= 100) baseXP = 20;
    else if (accuracy >= 80) baseXP = 15;
    else if (accuracy >= 60) baseXP = 10;
    else baseXP = 5;

    return Math.floor(baseXP * modeMultiplier[mode]);
  }

  // Helper methods

  private cleanWord(word: string): string {
    return word.replace(/[^\w]/g, '');
  }

  private normalizeWord(word: string): string {
    return word.toLowerCase().trim().replace(/[^\w]/g, '');
  }

  private areTooSimilar(word1: string, word2: string): boolean {
    const w1 = this.normalizeWord(word1);
    const w2 = this.normalizeWord(word2);

    // Check if one is substring of other
    if (w1.includes(w2) || w2.includes(w1)) return true;

    // Check edit distance (very similar = too similar)
    const distance = this.levenshteinDistance(w1, w2);
    return distance <= 2;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const practiceService = new PracticeService();

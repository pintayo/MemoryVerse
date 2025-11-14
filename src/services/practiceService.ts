import { Verse } from '../types/database';
import { practiceConfig } from '../config/practiceConfig';

export type PracticeMode = 'recall' | 'fill-in-blanks' | 'multiple-choice' | 'write-entire-verse';

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
  displayText: string;
}

export interface MultipleChoiceQuestion {
  verseId: string;
  verseText: string; // Show full verse text
  options: string[]; // Array of verse references (e.g., "John 3:16")
  correctIndex: number;
}

class PracticeService {
  selectModeForUser(userLevel: number): PracticeMode {
    const rand = Math.random();

    if (userLevel <= 3) {
      // Beginner: easier modes
      if (rand < 0.4) return 'multiple-choice';
      if (rand < 0.8) return 'fill-in-blanks';
      return 'recall';
    } else if (userLevel < practiceConfig.advancedLevelThreshold) {
      // Intermediate: balanced mix
      if (rand < 0.33) return 'multiple-choice';
      if (rand < 0.66) return 'fill-in-blanks';
      return 'recall';
    } else {
      // Advanced (level 10+): harder modes including write-entire-verse
      if (rand < 0.15) return 'multiple-choice';
      if (rand < 0.35) return 'fill-in-blanks';
      if (rand < 0.65) return 'recall';
      return 'write-entire-verse';
    }
  }

  // Simple helper methods
  private cleanWord(word: string): string {
    return word.replace(/[^\w]/g, '');
  }

  private normalizeWord(word: string): string {
    return word.toLowerCase().trim().replace(/[^\w]/g, '');
  }

  // Calculate XP based on accuracy and mode
  calculateXP(accuracy: number, mode: PracticeMode): number {
    let baseXP = 0;

    const modeMultiplier: Record<PracticeMode, number> = {
      'write-entire-verse': 1.5, // Hardest mode, highest reward
      'recall': 1.0,
      'fill-in-blanks': 0.8,
      'multiple-choice': 0.6,
    };

    if (accuracy >= 100) baseXP = 20;
    else if (accuracy >= 80) baseXP = 15;
    else if (accuracy >= 60) baseXP = 10;
    else baseXP = 5;

    return Math.floor(baseXP * modeMultiplier[mode]);
  }

  // Check fill-in-blanks answer
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
    const isCorrect = accuracy >= 90;

    return {
      isCorrect,
      accuracy,
      correctCount,
      totalCount,
    };
  }

  // Check write-entire-verse answer
  checkWriteEntireVerseAnswer(userAnswer: string, correctVerse: string): {
    isCorrect: boolean;
    accuracy: number;
  } {
    // Normalize both texts for comparison
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
    };

    const userNormalized = normalizeText(userAnswer);
    const correctNormalized = normalizeText(correctVerse);

    // Split into words for word-by-word comparison
    const userWords = userNormalized.split(' ');
    const correctWords = correctNormalized.split(' ');

    // Calculate accuracy based on matching words
    const maxLength = Math.max(userWords.length, correctWords.length);
    let matchingWords = 0;

    for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
      if (userWords[i] === correctWords[i]) {
        matchingWords++;
      }
    }

    const accuracy = maxLength > 0 ? (matchingWords / maxLength) * 100 : 0;
    const isCorrect = accuracy >= 90; // 90% accuracy required

    return {
      isCorrect,
      accuracy,
    };
  }

  // Shuffle array utility
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate fill-in-the-blanks question
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

  // Generate multiple choice question
  generateMultipleChoice(verse: Verse, otherVerses: Verse[]): MultipleChoiceQuestion {
    // Show full verse text, user picks correct reference
    const correctReference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;

    // Generate 2-3 wrong reference options from other verses
    const wrongReferences = this.generateWrongReferenceOptions(verse, otherVerses);

    // Combine and shuffle
    const allOptions = [correctReference, ...wrongReferences];
    const shuffled = this.shuffleArray(allOptions);
    const correctIndex = shuffled.indexOf(correctReference);

    return {
      verseId: verse.id,
      verseText: verse.text,
      options: shuffled,
      correctIndex,
    };
  }

  // Select important words to blank out (prioritize theological terms, nouns, verbs)
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

  // Generate word options for a blank
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

      // Avoid duplicates
      if (!options.includes(word)) {
        options.push(word);
      }

      candidateWords.splice(randomIndex, 1);
    }

    // Shuffle options
    return this.shuffleArray(options);
  }

  // Generate plausible wrong verse references
  private generateWrongReferenceOptions(
    correctVerse: Verse,
    otherVerses: Verse[]
  ): string[] {
    const options: string[] = [];
    const usedReferences = new Set<string>();

    // Strategy 1: Use verses from same book (different chapter/verse)
    const sameBookVerses = otherVerses.filter(v =>
      v.book === correctVerse.book &&
      v.id !== correctVerse.id &&
      (v.chapter !== correctVerse.chapter || v.verse_number !== correctVerse.verse_number)
    );

    for (const verse of sameBookVerses) {
      const ref = `${verse.book} ${verse.chapter}:${verse.verse_number}`;
      if (!usedReferences.has(ref) && options.length < 3) {
        options.push(ref);
        usedReferences.add(ref);
      }
    }

    // Strategy 2: Use verses from different books to fill remaining slots
    if (options.length < 3) {
      const otherBookVerses = otherVerses.filter(v =>
        v.book !== correctVerse.book && v.id !== correctVerse.id
      );

      for (const verse of otherBookVerses) {
        const ref = `${verse.book} ${verse.chapter}:${verse.verse_number}`;
        if (!usedReferences.has(ref) && options.length < 3) {
          options.push(ref);
          usedReferences.add(ref);
        }
      }
    }

    return options.slice(0, 3); // Max 3 wrong options
  }
}

export const practiceService = new PracticeService();

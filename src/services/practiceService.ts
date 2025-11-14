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
  displayText: string;
}

export interface MultipleChoiceQuestion {
  verseId: string;
  verseReference: string;
  startingText: string;
  options: string[];
  correctIndex: number;
}

class PracticeService {
  selectModeForUser(userLevel: number): PracticeMode {
    const rand = Math.random();

    if (userLevel <= 3) {
      if (rand < 0.4) return 'multiple-choice';
      if (rand < 0.8) return 'fill-in-blanks';
      return 'recall';
    } else if (userLevel <= 10) {
      if (rand < 0.33) return 'multiple-choice';
      if (rand < 0.66) return 'fill-in-blanks';
      return 'recall';
    } else {
      if (rand < 0.2) return 'multiple-choice';
      if (rand < 0.4) return 'fill-in-blanks';
      return 'recall';
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

  // Shuffle array utility
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate multiple choice question
  generateMultipleChoice(verse: Verse, otherVerses: Verse[]): MultipleChoiceQuestion {
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

  // Generate plausible wrong verse continuations
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
}

export const practiceService = new PracticeService();

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
}

export const practiceService = new PracticeService();

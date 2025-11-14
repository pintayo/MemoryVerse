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
}

export const practiceService = new PracticeService();

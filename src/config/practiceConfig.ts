/**
 * Practice Session Configuration
 */

export const practiceConfig = {
  // Number of verses per practice lesson
  versesPerLesson: 5,

  // Level threshold for advanced practice modes
  advancedLevelThreshold: 10,

  // XP rewards
  xp: {
    perfect: 20,    // 100% accuracy
    good: 15,       // 80-99% accuracy
    okay: 10,       // 60-79% accuracy
    poor: 5,        // <60% accuracy
    gaveUp: 0,      // Used "Give Answer"
  },
};

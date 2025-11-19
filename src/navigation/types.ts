export type RootStackParamList = {
  Main: undefined;
  VerseCard: undefined;
  Recall: { verseId: string };
  Practice: { isReviewMode?: boolean } | undefined;
  FillInBlanks: { verseId?: string };
  MultipleChoice: { verseId?: string };
  Pray: { verseId: string };
  Understand: { verseId: string };
  Downloads: undefined;
  NotificationSettings: undefined;
  StreakCalendar: undefined;
  Notes: undefined;
  Review: undefined;
  PremiumUpgrade: undefined;
  Settings: undefined;
  Favorites: undefined;
  ChapterContext: { book: string; chapter: number };
};

export type BottomTabParamList = {
  Home: undefined;
  Bible: undefined;
  Story: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

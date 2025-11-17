/**
 * Enhanced Prayer Coaching Service (Premium Feature - v1.2)
 *
 * Extends the basic AI prayer coaching with:
 * - Conversation history tracking
 * - Sentiment analysis
 * - Prayer insights and trends
 * - Personalized prayer recommendations
 * - Weekly/monthly summaries
 *
 * Feature Flag: enhancedPrayerCoaching
 * Premium: Yes (Standard & Premium tiers)
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  PrayerConversation,
  PrayerMessage,
  PrayerInsight,
} from '../types/database';

// =============================================
// TYPES & INTERFACES
// =============================================

export type PrayerSentiment =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'grateful'
  | 'hopeful'
  | 'worried';

export type InsightType =
  | 'weekly_summary'
  | 'monthly_summary'
  | 'theme'
  | 'growth_area'
  | 'answered_prayer';

export interface ConversationWithMessages extends PrayerConversation {
  messages: PrayerMessage[];
  messageCount: number;
}

export interface PrayerTheme {
  theme: string;
  frequency: number;
  keywords: string[];
  sentiment: PrayerSentiment;
}

export interface PrayerStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  dominantSentiment: PrayerSentiment;
  topThemes: PrayerTheme[];
  prayerFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// =============================================
// CONVERSATION MANAGEMENT
// =============================================

/**
 * Create a new prayer conversation
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<PrayerConversation | null> {
  try {
    const { data, error } = await supabase
      .from('prayer_conversations')
      .insert({
        user_id: userId,
        title: title || 'Prayer Session',
      })
      .select()
      .single();

    if (error) {
      logger.error('[EnhancedPrayer] Error creating conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception creating conversation:', error);
    return null;
  }
}

/**
 * Get user's prayer conversations
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20
): Promise<PrayerConversation[]> {
  try {
    const { data, error } = await supabase
      .from('prayer_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[EnhancedPrayer] Error fetching conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception fetching conversations:', error);
    return [];
  }
}

/**
 * Get a conversation with its messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  try {
    const { data: conversation, error: convError } = await supabase
      .from('prayer_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      logger.error('[EnhancedPrayer] Error fetching conversation:', convError);
      return null;
    }

    const { data: messages, error: msgError } = await supabase
      .from('prayer_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      logger.error('[EnhancedPrayer] Error fetching messages:', msgError);
      return null;
    }

    return {
      ...conversation,
      messages: messages || [],
      messageCount: messages?.length || 0,
    };
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception fetching conversation:', error);
    return null;
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('prayer_conversations')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[EnhancedPrayer] Error updating conversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception updating conversation:', error);
    return false;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('prayer_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[EnhancedPrayer] Error deleting conversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception deleting conversation:', error);
    return false;
  }
}

// =============================================
// MESSAGE MANAGEMENT
// =============================================

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  sentiment?: PrayerSentiment
): Promise<PrayerMessage | null> {
  try {
    const { data, error } = await supabase
      .from('prayer_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        sentiment: sentiment || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('[EnhancedPrayer] Error adding message:', error);
      return null;
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('prayer_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception adding message:', error);
    return null;
  }
}

/**
 * Analyze sentiment from message content
 * This is a simple rule-based approach. In production, you might use an AI service.
 */
export function analyzeSentiment(content: string): PrayerSentiment {
  const lowerContent = content.toLowerCase();

  // Keywords for different sentiments
  const gratefulKeywords = [
    'thank',
    'grateful',
    'blessing',
    'appreciate',
    'grace',
  ];
  const hopefulKeywords = [
    'hope',
    'faith',
    'trust',
    'believe',
    'future',
    'tomorrow',
  ];
  const worriedKeywords = [
    'worry',
    'anxious',
    'fear',
    'scared',
    'uncertain',
    'difficult',
  ];
  const positiveKeywords = [
    'joy',
    'happy',
    'peace',
    'love',
    'good',
    'wonderful',
  ];
  const negativeKeywords = [
    'sad',
    'angry',
    'hurt',
    'pain',
    'struggle',
    'hard',
  ];

  // Count keyword matches
  const gratefulCount = gratefulKeywords.filter((k) =>
    lowerContent.includes(k)
  ).length;
  const hopefulCount = hopefulKeywords.filter((k) =>
    lowerContent.includes(k)
  ).length;
  const worriedCount = worriedKeywords.filter((k) =>
    lowerContent.includes(k)
  ).length;
  const positiveCount = positiveKeywords.filter((k) =>
    lowerContent.includes(k)
  ).length;
  const negativeCount = negativeKeywords.filter((k) =>
    lowerContent.includes(k)
  ).length;

  // Determine dominant sentiment
  const sentiments = [
    { sentiment: 'grateful' as PrayerSentiment, count: gratefulCount },
    { sentiment: 'hopeful' as PrayerSentiment, count: hopefulCount },
    { sentiment: 'worried' as PrayerSentiment, count: worriedCount },
    { sentiment: 'positive' as PrayerSentiment, count: positiveCount },
    { sentiment: 'negative' as PrayerSentiment, count: negativeCount },
  ];

  sentiments.sort((a, b) => b.count - a.count);

  return sentiments[0].count > 0 ? sentiments[0].sentiment : 'neutral';
}

// =============================================
// PRAYER INSIGHTS
// =============================================

/**
 * Generate weekly prayer summary
 */
export async function generateWeeklySummary(userId: string): Promise<boolean> {
  try {
    // Get messages from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: messages, error } = await supabase
      .from('prayer_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', sevenDaysAgo);

    if (error || !messages || messages.length === 0) {
      logger.log('[EnhancedPrayer] No messages for weekly summary');
      return false;
    }

    // Analyze sentiments
    const sentimentCounts: { [key in PrayerSentiment]: number } = {
      positive: 0,
      neutral: 0,
      negative: 0,
      grateful: 0,
      hopeful: 0,
      worried: 0,
    };

    messages.forEach((msg) => {
      if (msg.sentiment) {
        sentimentCounts[msg.sentiment]++;
      }
    });

    const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as PrayerSentiment;

    // Generate summary content
    const content = `This week you had ${messages.length} prayer conversation${messages.length > 1 ? 's' : ''}. Your overall tone was ${dominantSentiment}. Keep connecting with God through prayer!`;

    // Save insight
    await supabase.from('prayer_insights').insert({
      user_id: userId,
      insight_type: 'weekly_summary',
      title: 'Your Prayer Week',
      content,
      metadata: {
        messageCount: messages.length,
        sentimentCounts,
        dominantSentiment,
      },
    });

    return true;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception generating weekly summary:', error);
    return false;
  }
}

/**
 * Detect prayer themes
 */
export async function detectPrayerThemes(
  userId: string,
  days: number = 30
): Promise<PrayerTheme[]> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: messages } = await supabase
      .from('prayer_messages')
      .select('content, sentiment')
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', startDate);

    if (!messages || messages.length === 0) {
      return [];
    }

    // Common prayer themes
    const themeKeywords: { [key: string]: string[] } = {
      Family: ['family', 'parent', 'child', 'husband', 'wife', 'sibling'],
      Health: ['health', 'healing', 'sick', 'doctor', 'medical'],
      Work: ['work', 'job', 'career', 'business', 'coworker'],
      Relationships: ['friend', 'relationship', 'love', 'forgive'],
      Guidance: ['wisdom', 'decision', 'guidance', 'direction', 'choice'],
      Gratitude: ['thank', 'grateful', 'blessing', 'appreciate'],
      Strength: ['strength', 'courage', 'persevere', 'overcome'],
      Peace: ['peace', 'calm', 'anxiety', 'worry', 'rest'],
    };

    const themeCounts: {
      [key: string]: {
        count: number;
        keywords: Set<string>;
        sentiments: PrayerSentiment[];
      };
    } = {};

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        const matchedKeywords = keywords.filter((k) => content.includes(k));
        if (matchedKeywords.length > 0) {
          if (!themeCounts[theme]) {
            themeCounts[theme] = {
              count: 0,
              keywords: new Set(),
              sentiments: [],
            };
          }
          themeCounts[theme].count++;
          matchedKeywords.forEach((k) => themeCounts[theme].keywords.add(k));
          if (msg.sentiment) {
            themeCounts[theme].sentiments.push(msg.sentiment);
          }
        }
      });
    });

    // Convert to array and sort by frequency
    const themes: PrayerTheme[] = Object.entries(themeCounts)
      .map(([theme, data]) => {
        // Get dominant sentiment for this theme
        const sentimentCounts: { [key in PrayerSentiment]: number } = {
          positive: 0,
          neutral: 0,
          negative: 0,
          grateful: 0,
          hopeful: 0,
          worried: 0,
        };
        data.sentiments.forEach((s) => sentimentCounts[s]++);
        const dominantSentiment = Object.entries(sentimentCounts).reduce(
          (a, b) => (a[1] > b[1] ? a : b)
        )[0] as PrayerSentiment;

        return {
          theme,
          frequency: data.count,
          keywords: Array.from(data.keywords),
          sentiment: dominantSentiment,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return themes;
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception detecting themes:', error);
    return [];
  }
}

/**
 * Get prayer insights for user
 */
export async function getPrayerInsights(
  userId: string,
  limit: number = 10
): Promise<PrayerInsight[]> {
  try {
    const { data, error } = await supabase
      .from('prayer_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[EnhancedPrayer] Error fetching insights:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception fetching insights:', error);
    return [];
  }
}

// =============================================
// PRAYER STATISTICS
// =============================================

/**
 * Get comprehensive prayer statistics
 */
export async function getPrayerStats(userId: string): Promise<PrayerStats | null> {
  try {
    // Get all conversations
    const { data: conversations } = await supabase
      .from('prayer_conversations')
      .select('*')
      .eq('user_id', userId);

    if (!conversations || conversations.length === 0) {
      return null;
    }

    // Get all messages
    const { data: messages } = await supabase
      .from('prayer_messages')
      .select('*')
      .eq('user_id', userId);

    if (!messages) {
      return null;
    }

    // Calculate sentiment distribution
    const sentimentCounts: { [key in PrayerSentiment]: number } = {
      positive: 0,
      neutral: 0,
      negative: 0,
      grateful: 0,
      hopeful: 0,
      worried: 0,
    };

    messages.forEach((msg) => {
      if (msg.sentiment) {
        sentimentCounts[msg.sentiment]++;
      }
    });

    const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as PrayerSentiment;

    // Get themes
    const topThemes = await detectPrayerThemes(userId, 30);

    // Calculate frequency (messages per time period)
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const dailyMessages = messages.filter(
      (m) => new Date(m.created_at).getTime() > dayAgo
    ).length;
    const weeklyMessages = messages.filter(
      (m) => new Date(m.created_at).getTime() > weekAgo
    ).length;
    const monthlyMessages = messages.filter(
      (m) => new Date(m.created_at).getTime() > monthAgo
    ).length;

    return {
      totalConversations: conversations.length,
      totalMessages: messages.length,
      averageMessagesPerConversation: messages.length / conversations.length,
      dominantSentiment,
      topThemes,
      prayerFrequency: {
        daily: dailyMessages,
        weekly: weeklyMessages,
        monthly: monthlyMessages,
      },
    };
  } catch (error) {
    logger.error('[EnhancedPrayer] Exception getting stats:', error);
    return null;
  }
}

// =============================================
// EXPORTS
// =============================================

export default {
  createConversation,
  getUserConversations,
  getConversationWithMessages,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  analyzeSentiment,
  generateWeeklySummary,
  detectPrayerThemes,
  getPrayerInsights,
  getPrayerStats,
};

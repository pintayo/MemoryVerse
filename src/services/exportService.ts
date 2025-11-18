/**
 * Export Service (Premium Feature - v1.2)
 *
 * Provides data export functionality:
 * - Export progress reports as PDF/CSV
 * - Export study notes
 * - Export analytics data
 * - Export complete user data
 *
 * Feature Flag: exportProgressReports
 * Premium: Yes (All tiers)
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { ExportLog } from '../types/database';

// =============================================
// TYPES & INTERFACES
// =============================================

export type ExportType = 'pdf' | 'csv' | 'json';
export type ExportScope = 'progress' | 'analytics' | 'notes' | 'full';

export interface ExportOptions {
  type: ExportType;
  scope: ExportScope;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ExportData {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    level: number;
    totalXp: number;
    currentStreak: number;
  };
  progress?: {
    totalVerses: number;
    masteredVerses: number;
    learningVerses: number;
    reviewingVerses: number;
    averageAccuracy: number;
    totalPracticeTime: number;
  };
  analytics?: {
    dailySnapshots: any[];
    weeklyVelocity: any[];
    insights: any;
  };
  notes?: Array<{
    verse: string;
    reference: string;
    note: string;
    createdAt: string;
  }>;
  verses?: Array<{
    reference: string;
    text: string;
    status: string;
    accuracy: number;
    lastPracticed: string;
  }>;
}

// =============================================
// DATA COLLECTION
// =============================================

/**
 * Collect user data for export
 */
async function collectExportData(
  userId: string,
  scope: ExportScope,
  dateRange?: { startDate: string; endDate: string }
): Promise<ExportData | null> {
  try {
    logger.log('[Export] Collecting data for scope:', scope);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('[Export] Error fetching profile:', profileError);
      return null;
    }

    const exportData: ExportData = {
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        level: profile.level,
        totalXp: profile.total_xp,
        currentStreak: profile.current_streak,
      },
    };

    // Progress data
    if (scope === 'progress' || scope === 'full') {
      const { data: verseProgress } = await supabase
        .from('user_verse_progress')
        .select('*')
        .eq('user_id', userId);

      const totalVerses = verseProgress?.length || 0;
      const masteredVerses =
        verseProgress?.filter((v) => v.status === 'mastered').length || 0;
      const learningVerses =
        verseProgress?.filter((v) => v.status === 'learning').length || 0;
      const reviewingVerses =
        verseProgress?.filter((v) => v.status === 'reviewing').length || 0;
      const averageAccuracy =
        verseProgress && verseProgress.length > 0
          ? verseProgress.reduce((sum, v) => sum + v.accuracy_score, 0) /
            verseProgress.length
          : 0;

      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('started_at, completed_at')
        .eq('user_id', userId);

      const totalPracticeTime =
        sessions?.reduce((sum, s) => {
          const start = new Date(s.started_at);
          const end = new Date(s.completed_at);
          return sum + (end.getTime() - start.getTime()) / 1000;
        }, 0) || 0;

      exportData.progress = {
        totalVerses,
        masteredVerses,
        learningVerses,
        reviewingVerses,
        averageAccuracy,
        totalPracticeTime,
      };

      // Get verse details
      if (verseProgress && verseProgress.length > 0) {
        const verseIds = verseProgress.map((v) => v.verse_id);
        const { data: verses } = await supabase
          .from('verses')
          .select('*')
          .in('id', verseIds);

        const versesMap = new Map(verses?.map((v) => [v.id, v]) || []);

        exportData.verses = verseProgress.map((vp) => {
          const verse = versesMap.get(vp.verse_id);
          return {
            reference: verse
              ? `${verse.book} ${verse.chapter}:${verse.verse_number}`
              : 'Unknown',
            text: verse?.text || '',
            status: vp.status,
            accuracy: vp.accuracy_score,
            lastPracticed: vp.last_practiced_at || '',
          };
        });
      }
    }

    // Analytics data
    if (scope === 'analytics' || scope === 'full') {
      const startDate =
        dateRange?.startDate ||
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0];

      const { data: snapshots } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: true });

      const { data: velocity } = await supabase
        .from('learning_velocity')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(12);

      exportData.analytics = {
        dailySnapshots: snapshots || [],
        weeklyVelocity: velocity || [],
        insights: {},
      };
    }

    // Notes data
    if (scope === 'notes' || scope === 'full') {
      const { data: notes } = await supabase
        .from('verse_notes')
        .select(
          `
          *,
          verses (book, chapter, verse_number, text)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      exportData.notes =
        notes?.map((note: any) => ({
          verse: note.verses.text,
          reference: `${note.verses.book} ${note.verses.chapter}:${note.verses.verse_number}`,
          note: note.note_text,
          createdAt: note.created_at,
        })) || [];
    }

    return exportData;
  } catch (error) {
    logger.error('[Export] Exception collecting data:', error);
    return null;
  }
}

// =============================================
// FORMAT CONVERSIONS
// =============================================

/**
 * Convert data to CSV format
 */
function convertToCSV(data: ExportData, scope: ExportScope): string {
  let csv = '';

  // User info
  csv += '# USER INFORMATION\n';
  csv += `Name,${data.user.fullName || 'N/A'}\n`;
  csv += `Email,${data.user.email}\n`;
  csv += `Level,${data.user.level}\n`;
  csv += `Total XP,${data.user.totalXp}\n`;
  csv += `Current Streak,${data.user.currentStreak} days\n`;
  csv += '\n';

  // Progress
  if (data.progress) {
    csv += '# PROGRESS SUMMARY\n';
    csv += `Total Verses,${data.progress.totalVerses}\n`;
    csv += `Mastered Verses,${data.progress.masteredVerses}\n`;
    csv += `Learning Verses,${data.progress.learningVerses}\n`;
    csv += `Reviewing Verses,${data.progress.reviewingVerses}\n`;
    csv += `Average Accuracy,${data.progress.averageAccuracy.toFixed(1)}%\n`;
    csv += `Total Practice Time,${Math.round(data.progress.totalPracticeTime / 60)} minutes\n`;
    csv += '\n';
  }

  // Verses
  if (data.verses && data.verses.length > 0) {
    csv += '# VERSES\n';
    csv += 'Reference,Status,Accuracy,Last Practiced\n';
    data.verses.forEach((verse) => {
      csv += `"${verse.reference}","${verse.status}",${verse.accuracy.toFixed(1)}%,"${verse.lastPracticed}"\n`;
    });
    csv += '\n';
  }

  // Notes
  if (data.notes && data.notes.length > 0) {
    csv += '# STUDY NOTES\n';
    csv += 'Reference,Note,Created At\n';
    data.notes.forEach((note) => {
      const escapedNote = note.note.replace(/"/g, '""');
      csv += `"${note.reference}","${escapedNote}","${note.createdAt}"\n`;
    });
    csv += '\n';
  }

  // Analytics
  if (data.analytics && data.analytics.dailySnapshots.length > 0) {
    csv += '# DAILY ANALYTICS\n';
    csv +=
      'Date,Verses Practiced,Accuracy,Practice Time (min),XP Earned,Streak,Level\n';
    data.analytics.dailySnapshots.forEach((snapshot: any) => {
      csv += `${snapshot.snapshot_date},${snapshot.verses_practiced_today},${snapshot.accuracy_rate.toFixed(1)}%,${Math.round(snapshot.total_practice_time / 60)},${snapshot.xp_earned_today},${snapshot.streak_count},${snapshot.level}\n`;
    });
  }

  return csv;
}

/**
 * Convert data to JSON format
 */
function convertToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Generate PDF-friendly HTML
 */
function convertToPDFHTML(data: ExportData, scope: ExportScope): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MemoryVerse Progress Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #8B7355;
      border-bottom: 3px solid #8B7355;
      padding-bottom: 10px;
    }
    h2 {
      color: #A0826D;
      margin-top: 30px;
      border-bottom: 1px solid #E8DCC8;
      padding-bottom: 5px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #F5F0E8;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #8B7355;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #8B7355;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #8B7355;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #E8DCC8;
    }
    tr:hover {
      background: #F5F0E8;
    }
    .note {
      background: #FFF9E6;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #FFD700;
      border-radius: 4px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>📖 MemoryVerse Progress Report</h1>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Full Name</div>
      <div class="stat-value">${data.user.fullName || 'N/A'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Level</div>
      <div class="stat-value">Level ${data.user.level}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total XP</div>
      <div class="stat-value">${data.user.totalXp.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Streak</div>
      <div class="stat-value">${data.user.currentStreak} days</div>
    </div>
  </div>
`;

  // Progress section
  if (data.progress) {
    html += `
  <h2>Progress Summary</h2>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Total Verses</div>
      <div class="stat-value">${data.progress.totalVerses}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Mastered Verses</div>
      <div class="stat-value">${data.progress.masteredVerses}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average Accuracy</div>
      <div class="stat-value">${data.progress.averageAccuracy.toFixed(1)}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Practice Time</div>
      <div class="stat-value">${Math.round(data.progress.totalPracticeTime / 60)}min</div>
    </div>
  </div>
`;
  }

  // Verses table
  if (data.verses && data.verses.length > 0) {
    html += `
  <h2>Verses in Progress</h2>
  <table>
    <thead>
      <tr>
        <th>Reference</th>
        <th>Status</th>
        <th>Accuracy</th>
        <th>Last Practiced</th>
      </tr>
    </thead>
    <tbody>
`;
    data.verses.slice(0, 50).forEach((verse) => {
      html += `
      <tr>
        <td><strong>${verse.reference}</strong></td>
        <td>${verse.status}</td>
        <td>${verse.accuracy.toFixed(1)}%</td>
        <td>${new Date(verse.lastPracticed).toLocaleDateString()}</td>
      </tr>
`;
    });
    html += `
    </tbody>
  </table>
`;
  }

  // Notes
  if (data.notes && data.notes.length > 0) {
    html += `
  <h2>Study Notes</h2>
`;
    data.notes.slice(0, 20).forEach((note) => {
      html += `
  <div class="note">
    <strong>${note.reference}</strong><br>
    <p>${note.note}</p>
    <small>${new Date(note.createdAt).toLocaleDateString()}</small>
  </div>
`;
    });
  }

  html += `
  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} by MemoryVerse<br>
    This report is for personal use only.
  </div>
</body>
</html>
`;

  return html;
}

// =============================================
// EXPORT FUNCTIONS
// =============================================

/**
 * Export user data
 */
export async function exportUserData(
  userId: string,
  options: ExportOptions
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    logger.log('[Export] Starting export:', options);

    // Create export log
    const { data: logData, error: logError } = await supabase
      .from('export_logs')
      .insert({
        user_id: userId,
        export_type: options.type,
        export_scope: options.scope,
        status: 'processing',
      })
      .select()
      .single();

    if (logError) {
      logger.error('[Export] Error creating log:', logError);
      return { success: false, error: 'Failed to create export log' };
    }

    const exportLogId = logData.id;

    // Collect data
    const exportData = await collectExportData(
      userId,
      options.scope,
      options.dateRange
    );

    if (!exportData) {
      await supabase
        .from('export_logs')
        .update({ status: 'failed', error_message: 'Failed to collect data' })
        .eq('id', exportLogId);
      return { success: false, error: 'Failed to collect export data' };
    }

    // Convert to requested format
    let formattedData: string;
    let fileSizeKb: number;

    switch (options.type) {
      case 'csv':
        formattedData = convertToCSV(exportData, options.scope);
        break;
      case 'json':
        formattedData = convertToJSON(exportData);
        break;
      case 'pdf':
        formattedData = convertToPDFHTML(exportData, options.scope);
        break;
      default:
        formattedData = convertToJSON(exportData);
    }

    fileSizeKb = Math.round(new Blob([formattedData]).size / 1024);

    // Update log
    await supabase
      .from('export_logs')
      .update({
        status: 'completed',
        file_size_kb: fileSizeKb,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportLogId);

    logger.log('[Export] Export completed successfully:', fileSizeKb, 'KB');
    return { success: true, data: formattedData };
  } catch (error) {
    logger.error('[Export] Exception during export:', error);
    return { success: false, error: 'An error occurred during export' };
  }
}

/**
 * Get user's export history
 */
export async function getExportHistory(userId: string): Promise<ExportLog[]> {
  try {
    const { data, error } = await supabase
      .from('export_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('[Export] Error fetching history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[Export] Exception fetching history:', error);
    return [];
  }
}

// =============================================
// EXPORTS
// =============================================

export default {
  exportUserData,
  getExportHistory,
};

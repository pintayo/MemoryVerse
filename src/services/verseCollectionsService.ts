/**
 * Verse Collections Service (Premium Feature - v1.2)
 *
 * Allows users to:
 * - Create custom verse collections
 * - Organize verses by theme, topic, or purpose
 * - Share collections with others
 * - Browse public/featured collections
 *
 * Feature Flag: customVerseCollections
 * Premium: Yes (All tiers)
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  VerseCollection,
  VerseCollectionItem,
  VerseCollectionShare,
  Verse,
} from '../types/database';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface CollectionWithStats extends VerseCollection {
  verse_count: number;
  verses?: Verse[];
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
}

export interface ShareCollectionInput {
  collectionId: string;
  sharedWithUserId?: string;
  accessLevel?: 'view' | 'edit';
  expiresAt?: string;
}

// =============================================
// COLLECTION MANAGEMENT
// =============================================

/**
 * Create a new verse collection
 */
export async function createCollection(
  userId: string,
  input: CreateCollectionInput
): Promise<VerseCollection | null> {
  try {
    logger.log('[VerseCollections] Creating collection:', input.name);

    const { data, error } = await supabase
      .from('verse_collections')
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description || null,
        icon: input.icon || '📖',
        color: input.color || '#8B7355',
        is_public: input.isPublic || false,
      })
      .select()
      .single();

    if (error) {
      logger.error('[VerseCollections] Error creating collection:', error);
      return null;
    }

    logger.log('[VerseCollections] Collection created successfully:', data.id);
    return data;
  } catch (error) {
    logger.error('[VerseCollections] Exception creating collection:', error);
    return null;
  }
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(
  userId: string
): Promise<CollectionWithStats[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_collections_with_stats', {
      p_user_id: userId,
    });

    if (error) {
      logger.error('[VerseCollections] Error fetching collections:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.collection_id,
      user_id: userId,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      is_public: false,
      is_featured: false,
      created_at: row.created_at,
      updated_at: row.created_at,
      verse_count: row.verse_count,
    }));
  } catch (error) {
    logger.error('[VerseCollections] Exception fetching collections:', error);
    return [];
  }
}

/**
 * Get a single collection with its verses
 */
export async function getCollection(
  collectionId: string,
  userId: string
): Promise<CollectionWithStats | null> {
  try {
    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('verse_collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      logger.error('[VerseCollections] Error fetching collection:', collectionError);
      return null;
    }

    // Check if user has access
    if (collection.user_id !== userId && !collection.is_public) {
      logger.warn('[VerseCollections] User does not have access to collection');
      return null;
    }

    // Get collection items with verses
    const { data: items, error: itemsError } = await supabase
      .from('verse_collection_items')
      .select(
        `
        *,
        verses (*)
      `
      )
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      logger.error('[VerseCollections] Error fetching items:', itemsError);
    }

    const verses = items?.map((item: any) => item.verses).filter(Boolean) || [];

    return {
      ...collection,
      verse_count: verses.length,
      verses,
    };
  } catch (error) {
    logger.error('[VerseCollections] Exception fetching collection:', error);
    return null;
  }
}

/**
 * Update collection
 */
export async function updateCollection(
  collectionId: string,
  userId: string,
  updates: Partial<CreateCollectionInput>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('verse_collections')
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
        is_public: updates.isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[VerseCollections] Error updating collection:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception updating collection:', error);
    return false;
  }
}

/**
 * Delete collection
 */
export async function deleteCollection(
  collectionId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('verse_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[VerseCollections] Error deleting collection:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception deleting collection:', error);
    return false;
  }
}

// =============================================
// COLLECTION ITEMS MANAGEMENT
// =============================================

/**
 * Add verse to collection
 */
export async function addVerseToCollection(
  collectionId: string,
  verseId: string,
  userId: string,
  notes?: string
): Promise<boolean> {
  try {
    // Verify user owns collection
    const { data: collection } = await supabase
      .from('verse_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (!collection || collection.user_id !== userId) {
      logger.warn('[VerseCollections] User does not own collection');
      return false;
    }

    // Get max sort order
    const { data: items } = await supabase
      .from('verse_collection_items')
      .select('sort_order')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = items && items.length > 0 ? items[0].sort_order : 0;

    // Add verse
    const { error } = await supabase.from('verse_collection_items').insert({
      collection_id: collectionId,
      verse_id: verseId,
      sort_order: maxSortOrder + 1,
      notes: notes || null,
    });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - verse already in collection
        logger.warn('[VerseCollections] Verse already in collection');
        return false;
      }
      logger.error('[VerseCollections] Error adding verse to collection:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception adding verse:', error);
    return false;
  }
}

/**
 * Remove verse from collection
 */
export async function removeVerseFromCollection(
  collectionId: string,
  verseId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify user owns collection
    const { data: collection } = await supabase
      .from('verse_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (!collection || collection.user_id !== userId) {
      logger.warn('[VerseCollections] User does not own collection');
      return false;
    }

    const { error } = await supabase
      .from('verse_collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('verse_id', verseId);

    if (error) {
      logger.error('[VerseCollections] Error removing verse:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception removing verse:', error);
    return false;
  }
}

/**
 * Update verse notes in collection
 */
export async function updateVerseNotes(
  collectionId: string,
  verseId: string,
  userId: string,
  notes: string
): Promise<boolean> {
  try {
    // Verify user owns collection
    const { data: collection } = await supabase
      .from('verse_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (!collection || collection.user_id !== userId) {
      logger.warn('[VerseCollections] User does not own collection');
      return false;
    }

    const { error } = await supabase
      .from('verse_collection_items')
      .update({ notes })
      .eq('collection_id', collectionId)
      .eq('verse_id', verseId);

    if (error) {
      logger.error('[VerseCollections] Error updating notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception updating notes:', error);
    return false;
  }
}

/**
 * Reorder verses in collection
 */
export async function reorderCollectionVerses(
  collectionId: string,
  userId: string,
  verseOrder: string[] // Array of verse IDs in desired order
): Promise<boolean> {
  try {
    // Verify user owns collection
    const { data: collection } = await supabase
      .from('verse_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (!collection || collection.user_id !== userId) {
      logger.warn('[VerseCollections] User does not own collection');
      return false;
    }

    // Update sort order for each verse
    for (let i = 0; i < verseOrder.length; i++) {
      const { error } = await supabase
        .from('verse_collection_items')
        .update({ sort_order: i })
        .eq('collection_id', collectionId)
        .eq('verse_id', verseOrder[i]);

      if (error) {
        logger.error('[VerseCollections] Error reordering verse:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception reordering verses:', error);
    return false;
  }
}

// =============================================
// PUBLIC & FEATURED COLLECTIONS
// =============================================

/**
 * Get public collections
 */
export async function getPublicCollections(limit: number = 20): Promise<CollectionWithStats[]> {
  try {
    const { data: collections, error } = await supabase
      .from('verse_collections')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[VerseCollections] Error fetching public collections:', error);
      return [];
    }

    // Get verse counts for each collection
    const collectionsWithStats = await Promise.all(
      (collections || []).map(async (collection) => {
        const { count } = await supabase
          .from('verse_collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        return {
          ...collection,
          verse_count: count || 0,
        };
      })
    );

    return collectionsWithStats;
  } catch (error) {
    logger.error('[VerseCollections] Exception fetching public collections:', error);
    return [];
  }
}

/**
 * Get featured collections
 */
export async function getFeaturedCollections(): Promise<CollectionWithStats[]> {
  try {
    const { data: collections, error } = await supabase
      .from('verse_collections')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[VerseCollections] Error fetching featured collections:', error);
      return [];
    }

    // Get verse counts for each collection
    const collectionsWithStats = await Promise.all(
      (collections || []).map(async (collection) => {
        const { count } = await supabase
          .from('verse_collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        return {
          ...collection,
          verse_count: count || 0,
        };
      })
    );

    return collectionsWithStats;
  } catch (error) {
    logger.error('[VerseCollections] Exception fetching featured collections:', error);
    return [];
  }
}

// =============================================
// SHARING
// =============================================

/**
 * Share collection with another user
 */
export async function shareCollection(
  userId: string,
  input: ShareCollectionInput
): Promise<VerseCollectionShare | null> {
  try {
    // Verify user owns collection
    const { data: collection } = await supabase
      .from('verse_collections')
      .select('user_id')
      .eq('id', input.collectionId)
      .single();

    if (!collection || collection.user_id !== userId) {
      logger.warn('[VerseCollections] User does not own collection');
      return null;
    }

    // Generate share link code if sharing publicly
    const shareLinkCode = input.sharedWithUserId
      ? null
      : Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('verse_collection_shares')
      .insert({
        collection_id: input.collectionId,
        shared_by_user_id: userId,
        shared_with_user_id: input.sharedWithUserId || null,
        share_link_code: shareLinkCode,
        access_level: input.accessLevel || 'view',
        expires_at: input.expiresAt || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('[VerseCollections] Error sharing collection:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[VerseCollections] Exception sharing collection:', error);
    return null;
  }
}

/**
 * Get collection by share link code
 */
export async function getCollectionByShareLink(
  shareLinkCode: string
): Promise<CollectionWithStats | null> {
  try {
    const { data: share, error: shareError } = await supabase
      .from('verse_collection_shares')
      .select('collection_id, expires_at')
      .eq('share_link_code', shareLinkCode)
      .single();

    if (shareError || !share) {
      logger.error('[VerseCollections] Invalid share link');
      return null;
    }

    // Check if link is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      logger.warn('[VerseCollections] Share link expired');
      return null;
    }

    // Get collection (using a dummy user ID since it's shared)
    const { data: collection, error: collectionError } = await supabase
      .from('verse_collections')
      .select('*')
      .eq('id', share.collection_id)
      .single();

    if (collectionError || !collection) {
      logger.error('[VerseCollections] Error fetching shared collection:', collectionError);
      return null;
    }

    // Get verses
    const { data: items } = await supabase
      .from('verse_collection_items')
      .select(
        `
        *,
        verses (*)
      `
      )
      .eq('collection_id', share.collection_id)
      .order('sort_order', { ascending: true });

    const verses = items?.map((item: any) => item.verses).filter(Boolean) || [];

    return {
      ...collection,
      verse_count: verses.length,
      verses,
    };
  } catch (error) {
    logger.error('[VerseCollections] Exception fetching shared collection:', error);
    return null;
  }
}

/**
 * Revoke collection share
 */
export async function revokeShare(shareId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('verse_collection_shares')
      .delete()
      .eq('id', shareId)
      .eq('shared_by_user_id', userId);

    if (error) {
      logger.error('[VerseCollections] Error revoking share:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[VerseCollections] Exception revoking share:', error);
    return false;
  }
}

// =============================================
// EXPORTS
// =============================================

export default {
  createCollection,
  getUserCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addVerseToCollection,
  removeVerseFromCollection,
  updateVerseNotes,
  reorderCollectionVerses,
  getPublicCollections,
  getFeaturedCollections,
  shareCollection,
  getCollectionByShareLink,
  revokeShare,
};

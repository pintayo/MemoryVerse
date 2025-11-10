/**
 * Star Button Component
 * Allows users to favorite/star verses
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { favoritesService } from '../services/favoritesService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface StarButtonProps {
  verseId: string;
  size?: number;
  onToggle?: (isFavorited: boolean) => void;
  style?: ViewStyle;
}

export const StarButton: React.FC<StarButtonProps> = ({
  verseId,
  size = 32,
  onToggle,
  style,
}) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if verse is already favorited on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [verseId, user?.id]);

  const checkFavoriteStatus = async () => {
    if (!user?.id) {
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      const favorited = await favoritesService.isFavorited(user.id, verseId);
      setIsFavorited(favorited);
    } catch (error) {
      logger.error('[StarButton] Error checking favorite status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePress = async () => {
    if (!user?.id || isLoading) return;

    try {
      setIsLoading(true);

      const result = await favoritesService.toggleFavorite(user.id, verseId);

      if (result.success) {
        setIsFavorited(result.isFavorited);
        onToggle?.(result.isFavorited);
        logger.log(`[StarButton] Verse ${result.isFavorited ? 'favorited' : 'unfavorited'}`);
      }
    } catch (error) {
      logger.error('[StarButton] Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking initial state
  if (isChecking) {
    return (
      <TouchableOpacity style={[styles.container, style]} disabled>
        <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
      </TouchableOpacity>
    );
  }

  // Show loading spinner while toggling
  if (isLoading) {
    return (
      <TouchableOpacity style={[styles.container, style]} disabled>
        <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!user?.id}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {isFavorited ? (
          // Filled star
          <Path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            fill={theme.colors.secondary.lightGold}
          />
        ) : (
          // Outline star
          <Path
            d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
            fill={theme.colors.text.secondary}
          />
        )}
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

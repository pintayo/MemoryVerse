/**
 * SignUpPrompt Component
 *
 * Beautiful modal that encourages guests to sign up
 * Shows contextual benefits based on what feature they're trying to use
 * Includes "Don't show again" option
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';
import type { PromptTrigger } from '../services/guestModeService';
import {
  getSignUpBenefits,
  getSignUpPromptTitle,
  getSignUpPromptMessage,
  dismissPrompt,
} from '../services/guestModeService';

// =============================================
// TYPES
// =============================================

interface SignUpPromptProps {
  visible: boolean;
  trigger: PromptTrigger;
  onSignUp: () => void;
  onDismiss: () => void;
  onDontShowAgain?: () => void;
}

// =============================================
// COMPONENT
// =============================================

export const SignUpPrompt: React.FC<SignUpPromptProps> = ({
  visible,
  trigger,
  onSignUp,
  onDismiss,
  onDontShowAgain,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const title = getSignUpPromptTitle(trigger);
  const message = getSignUpPromptMessage(trigger);
  const benefits = getSignUpBenefits(trigger);

  const handleDontShowAgain = async () => {
    setIsProcessing(true);
    await dismissPrompt(trigger);
    setIsProcessing(false);

    if (onDontShowAgain) {
      onDontShowAgain();
    } else {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>📖</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Benefits List */}
          <ScrollView
            style={styles.benefitsContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.benefitsTitle}>Sign up and get:</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSignUp}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleDontShowAgain}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              <Text style={styles.tertiaryButtonText}>
                {isProcessing ? 'Processing...' : 'Don\'t Show Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// =============================================
// STYLES
// =============================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: 20,
    padding: 24,
    width: Math.min(width - 40, 400),
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.secondary.softClay,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.scripture.default,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: theme.typography.fonts.ui.default,
  },
  benefitsContainer: {
    maxHeight: 240,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary.softClay,
    marginBottom: 12,
    fontFamily: theme.typography.fonts.ui.default,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  benefitText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontFamily: theme.typography.fonts.ui.default,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.secondary.softClay,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.secondary.softClay,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: theme.colors.primary.parchmentCream,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: theme.typography.fonts.ui.default,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primary.sandyBeige,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.secondary.softClay,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.fonts.ui.default,
  },
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
    fontFamily: theme.typography.fonts.ui.default,
  },
});

export default SignUpPrompt;

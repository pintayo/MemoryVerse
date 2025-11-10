/**
 * Speech Recognition Service
 * Handles speech-to-text conversion for verse recitation
 */

import { logger } from '../utils/logger';

// Try to load Voice module (optional for testing in Expo Go)
let Voice: any = null;
let SpeechResultsEvent: any = null;
let SpeechErrorEvent: any = null;
try {
  const VoiceModule = require('@react-native-voice/voice');
  Voice = VoiceModule.default;
  logger.log('[SpeechRecognition] Voice module loaded');
} catch (error) {
  logger.log('[SpeechRecognition] Voice module not available (testing mode)');
}

export interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;
export type SpeechErrorCallback = (error: string) => void;

class SpeechRecognitionService {
  private isListening: boolean = false;
  private onResultCallback: SpeechRecognitionCallback | null = null;
  private onErrorCallback: SpeechErrorCallback | null = null;

  constructor() {
    // Set up event handlers (if Voice is available)
    if (Voice) {
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;
      Voice.onSpeechError = this.onSpeechError;
    }
  }

  /**
   * Check if speech recognition is available
   */
  async isAvailable(): Promise<boolean> {
    if (!Voice) {
      logger.log('[SpeechRecognition] Voice module not loaded');
      return false;
    }
    try {
      const available = await Voice.isAvailable();
      return available === 1;
    } catch (error) {
      logger.error('[SpeechRecognition] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Start listening for speech
   */
  async startListening(
    onResult: SpeechRecognitionCallback,
    onError: SpeechErrorCallback
  ): Promise<boolean> {
    try {
      // Check if already listening
      if (this.isListening) {
        logger.warn('[SpeechRecognition] Already listening');
        return false;
      }

      // Check if available
      const available = await this.isAvailable();
      if (!available) {
        onError('Speech recognition is not available on this device');
        return false;
      }

      // Set callbacks
      this.onResultCallback = onResult;
      this.onErrorCallback = onError;

      // Start listening
      if (Voice) {
        await Voice.start('en-US');
        this.isListening = true;
        logger.log('[SpeechRecognition] Started listening');
        return true;
      } else {
        onError('Speech recognition module not available');
        return false;
      }
    } catch (error) {
      logger.error('[SpeechRecognition] Error starting:', error);
      onError('Failed to start speech recognition');
      return false;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    try {
      if (!this.isListening || !Voice) {
        return;
      }

      await Voice.stop();
      this.isListening = false;
      logger.log('[SpeechRecognition] Stopped listening');
    } catch (error) {
      logger.error('[SpeechRecognition] Error stopping:', error);
    }
  }

  /**
   * Cancel listening (without processing results)
   */
  async cancelListening(): Promise<void> {
    try {
      if (!this.isListening || !Voice) {
        return;
      }

      await Voice.cancel();
      this.isListening = false;
      logger.log('[SpeechRecognition] Cancelled listening');
    } catch (error) {
      logger.error('[SpeechRecognition] Error cancelling:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Destroy the service (cleanup)
   */
  async destroy(): Promise<void> {
    try {
      if (Voice) {
        await Voice.destroy();
      }
      this.isListening = false;
      this.onResultCallback = null;
      this.onErrorCallback = null;
      logger.log('[SpeechRecognition] Service destroyed');
    } catch (error) {
      logger.error('[SpeechRecognition] Error destroying:', error);
    }
  }

  // Event handlers

  private onSpeechStart = () => {
    logger.log('[SpeechRecognition] Speech started');
  };

  private onSpeechEnd = () => {
    logger.log('[SpeechRecognition] Speech ended');
    this.isListening = false;
  };

  private onSpeechResults = (event: SpeechResultsEvent) => {
    logger.log('[SpeechRecognition] Final results:', event.value);

    if (this.onResultCallback && event.value && event.value.length > 0) {
      const text = event.value[0];
      this.onResultCallback({
        text,
        isFinal: true,
        confidence: 1.0,
      });
    }
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent) => {
    logger.log('[SpeechRecognition] Partial results:', event.value);

    if (this.onResultCallback && event.value && event.value.length > 0) {
      const text = event.value[0];
      this.onResultCallback({
        text,
        isFinal: false,
      });
    }
  };

  private onSpeechError = (event: SpeechErrorEvent) => {
    logger.error('[SpeechRecognition] Speech error:', event.error);

    this.isListening = false;

    if (this.onErrorCallback) {
      let errorMessage = 'Speech recognition error';

      switch (event.error?.code) {
        case '1':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case '2':
          errorMessage = 'Network timeout. Please try again.';
          break;
        case '5':
          errorMessage = 'Client error. Please restart the app.';
          break;
        case '6':
          errorMessage = 'Speech recognition service unavailable.';
          break;
        case '7':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case '8':
          errorMessage = 'No match found. Please speak more clearly.';
          break;
        case '9':
          errorMessage = 'Insufficient permissions. Please enable microphone access.';
          break;
        default:
          errorMessage = event.error?.message || 'Unknown error occurred';
      }

      this.onErrorCallback(errorMessage);
    }
  };
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();

logger.log('[speechRecognitionService] Module loaded');

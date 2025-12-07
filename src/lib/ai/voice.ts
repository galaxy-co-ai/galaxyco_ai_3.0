/**
 * Voice AI Module
 * 
 * Provides speech-to-text (Whisper) and text-to-speech (TTS) capabilities
 * for voice interactions with Neptune.
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface SpeechOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

// ============================================================================
// SPEECH-TO-TEXT (Whisper)
// ============================================================================

/**
 * Transcribe audio to text using OpenAI Whisper
 * 
 * @param audioData - Audio file as Buffer or Blob
 * @param options - Transcription options
 * @returns Transcription result with text and metadata
 */
export async function transcribeAudio(
  audioData: Buffer | Blob,
  options: {
    language?: string;
    prompt?: string;
    timestamps?: boolean;
  } = {}
): Promise<TranscriptionResult> {
  try {
    const openai = getOpenAI();
    
    // Convert Buffer to File-like object for OpenAI
    let file: File;
    if (Buffer.isBuffer(audioData)) {
      const uint8Array = new Uint8Array(audioData);
      const blob = new Blob([uint8Array], { type: 'audio/webm' });
      file = new File([blob], 'audio.webm', { type: 'audio/webm' });
    } else {
      const blobType = audioData instanceof Blob ? audioData.type : 'audio/webm';
      file = new File([audioData], 'audio.webm', { type: blobType || 'audio/webm' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt,
      response_format: options.timestamps ? 'verbose_json' : 'json',
    });

    // Handle different response formats
    if (typeof transcription === 'string') {
      return { text: transcription };
    }
    
    const result = transcription as {
      text: string;
      language?: string;
      duration?: number;
      segments?: Array<{ text: string; start: number; end: number }>;
    };

    logger.info('[Voice] Audio transcribed', {
      textLength: result.text.length,
      language: result.language,
      duration: result.duration,
    });

    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments,
    };
  } catch (error) {
    logger.error('[Voice] Transcription failed', error);
    throw new Error('Failed to transcribe audio');
  }
}

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

/**
 * Convert text to speech using OpenAI TTS
 * 
 * @param text - Text to convert to speech
 * @param options - Speech options (voice, speed, format)
 * @returns Audio data as ArrayBuffer
 */
export async function textToSpeech(
  text: string,
  options: SpeechOptions = {}
): Promise<ArrayBuffer> {
  const {
    voice = 'nova', // Neptune uses a friendly voice
    speed = 1.0,
    format = 'mp3',
  } = options;

  try {
    const openai = getOpenAI();
    
    // Limit text length (TTS has a limit)
    const maxLength = 4096;
    const truncatedText = text.length > maxLength 
      ? text.slice(0, maxLength - 3) + '...'
      : text;

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: truncatedText,
      speed,
      response_format: format,
    });

    const audioBuffer = await response.arrayBuffer();

    logger.info('[Voice] Speech generated', {
      textLength: truncatedText.length,
      voice,
      audioSize: audioBuffer.byteLength,
    });

    return audioBuffer;
  } catch (error) {
    logger.error('[Voice] TTS failed', error);
    throw new Error('Failed to generate speech');
  }
}

/**
 * Convert text to speech and return as base64 data URL
 * Useful for browser playback
 */
export async function textToSpeechBase64(
  text: string,
  options: SpeechOptions = {}
): Promise<string> {
  const audioBuffer = await textToSpeech(text, options);
  const format = options.format || 'mp3';
  
  // Convert to base64
  const base64 = Buffer.from(audioBuffer).toString('base64');
  const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
  
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// VOICE INTERACTION HELPERS
// ============================================================================

/**
 * Clean text for TTS (remove markdown, special chars)
 */
export function cleanTextForSpeech(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`(.*?)`/g, '$1') // Code
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    // Remove bullet points
    .replace(/^[-*•]\s/gm, '')
    // Remove numbered lists
    .replace(/^\d+\.\s/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if text should be spoken (not too long, not a list, etc.)
 */
export function isSpeakable(text: string): boolean {
  // Don't speak very long responses
  if (text.length > 2000) return false;
  
  // Don't speak responses that are mostly lists
  const lines = text.split('\n').filter(l => l.trim());
  const listLines = lines.filter(l => /^[-*•\d]/.test(l.trim()));
  if (listLines.length > lines.length * 0.7) return false;
  
  // Don't speak code blocks
  if (text.includes('```')) return false;
  
  return true;
}

/**
 * Get appropriate voice for Neptune based on context
 */
export function getVoiceForContext(
  context: 'greeting' | 'explanation' | 'alert' | 'casual'
): SpeechOptions['voice'] {
  switch (context) {
    case 'greeting':
    case 'casual':
      return 'nova'; // Friendly
    case 'explanation':
      return 'alloy'; // Clear
    case 'alert':
      return 'onyx'; // Authoritative
    default:
      return 'nova';
  }
}

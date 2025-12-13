"use client";

/**
 * VoiceRecorder Component
 * 
 * Records voice messages using Web Audio API and uploads to server.
 * Features:
 * - Real-time recording indicator
 * - Duration display
 * - Upload to Vercel Blob
 * - Preview before sending
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  Mic,
  Square,
  Play,
  Pause,
  X,
  Send,
  Loader2,
} from "lucide-react";

interface VoiceRecorderProps {
  onRecorded: (attachment: {
    type: 'audio';
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onRecorded, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (error) {
      logger.error("Failed to start recording", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playPreview = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const handleSend = useCallback(async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      const fileName = `voice-message-${Date.now()}.webm`;
      formData.append('file', audioBlob, fileName);
      formData.append('isVoiceMessage', 'true');

      const res = await fetch('/api/conversations/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      
      onRecorded({
        type: 'audio',
        url: data.attachment.url,
        name: fileName,
        size: audioBlob.size,
        mimeType: audioBlob.type,
      });

      // Clean up
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      logger.error("Failed to upload voice message", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload voice message");
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, audioUrl, onRecorded]);

  const handleCancel = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onCancel();
  }, [isRecording, stopRecording, audioUrl, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Audio preview element
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border">
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-500">Recording</span>
        </div>
      )}

      {/* Duration */}
      <span className="text-sm font-mono tabular-nums min-w-[50px]">
        {formatDuration(duration)}
      </span>

      {/* Waveform placeholder (visual indicator) */}
      {isRecording && (
        <div className="flex items-center gap-0.5 h-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Preview playback */}
      {audioUrl && !isRecording && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={playPreview}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}

      <div className="flex-1" />

      {/* Controls */}
      {!audioUrl ? (
        // Recording controls
        <>
          {isRecording ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={startRecording}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}
        </>
      ) : (
        // Preview controls
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-1" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </>
      )}

      {/* Cancel button (always visible when not uploading) */}
      {!audioUrl && !isRecording && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

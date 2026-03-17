import { useState, useRef, useCallback } from 'react';
import { VoiceAuthResult, AuthLayer, AudioQuality } from '../types/voice';

const MATCH_THRESHOLD_HIGH = 85;
const MATCH_THRESHOLD_LOW = 70;

function getAuthLayer(score: number, isLargeTransfer: boolean, isReplay: boolean): AuthLayer {
  if (isReplay) return 'DENY';
  if (score < MATCH_THRESHOLD_LOW) return 'DENY';
  if (isLargeTransfer) return 'L3';
  if (score >= MATCH_THRESHOLD_HIGH) return 'L2';
  return 'F1';
}

function getStatus(layer: AuthLayer): VoiceAuthResult['status'] {
  if (layer === 'DENY') return 'denied';
  if (layer === 'L2' || layer === 'L3') return layer === 'L3' ? 'fallback' : 'authenticated';
  if (['F1', 'F2', 'F3', 'F4'].includes(layer)) return 'fallback';
  return 'authenticated';
}

export const useVoiceAuth = () => {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<VoiceAuthResult | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const analyseScenario = useCallback((scenario: string): VoiceAuthResult => {
    const scenarios: Record<string, VoiceAuthResult> = {
      normal: {
        matchScore: 93, audioQuality: 'Good', f0Match: 'Match',
        authLayer: 'L2', status: 'authenticated',
        message: 'Voice match 93%. All biometric checks passed. Transaction approved.',
      },
      sick: {
        matchScore: 74, audioQuality: 'OK', f0Match: 'Weak',
        authLayer: 'F1', status: 'fallback',
        message: 'Voice match 74% — below threshold. System switching to spoken PIN fallback.',
        fallbackMethod: 'spoken-pin',
      },
      noise: {
        matchScore: 61, audioQuality: 'Poor', f0Match: '—',
        authLayer: 'F2', status: 'fallback',
        message: 'Audio quality too low. Moving to quieter area or sending OTP to registered number.',
        fallbackMethod: 'otp',
      },
      fake: {
        matchScore: 38, audioQuality: 'Good', f0Match: 'No match',
        authLayer: 'DENY', status: 'denied',
        message: 'Formant pattern mismatch: 38% match. Not the registered user. Attempt logged.',
      },
      replay: {
        matchScore: 89, audioQuality: 'Good', f0Match: 'Match',
        authLayer: 'DENY', status: 'denied',
        message: 'Voiceprint passed (89%) but liveness challenge failed. Replay attack blocked.',
      },
      large: {
        matchScore: 95, audioQuality: 'Good', f0Match: 'Match',
        authLayer: 'L3', status: 'fallback',
        message: 'Transfer ₹5,000+ detected. Voice passed. OTP sent to registered number (L3 required).',
        fallbackMethod: 'otp',
      },
    };
    return scenarios[scenario] || scenarios.normal;
  }, []);

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API not supported');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN'; // Tamil by default
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const simulateAuth = useCallback((scenario: string) => {
    setIsListening(true);
    setResult(null);
    setTimeout(() => {
      setIsListening(false);
      setResult(analyseScenario(scenario));
    }, 1800);
  }, [analyseScenario]);

  return { isListening, result, startListening, stopListening, simulateAuth };
};

export type AuthLayer = 'L1' | 'L2' | 'L3' | 'F1' | 'F2' | 'F3' | 'F4' | 'DENY';

export type FallbackMethod = 'spoken-pin' | 'otp' | 'security-question' | 'csp-assisted';

export type AudioQuality = 'Good' | 'OK' | 'Poor';

export interface VoiceAuthResult {
  matchScore: number;
  audioQuality: AudioQuality;
  f0Match: string;
  authLayer: AuthLayer;
  status: 'authenticated' | 'fallback' | 'denied';
  message: string;
  fallbackMethod?: FallbackMethod;
}

export interface VoiceprintProfile {
  userId: number;
  enrolledAt: string;
  f0Range: [number, number];
  formantHash: string;
  language: string;
}

export interface VoiceScenario {
  key: string;
  label: string;
  result: VoiceAuthResult;
}

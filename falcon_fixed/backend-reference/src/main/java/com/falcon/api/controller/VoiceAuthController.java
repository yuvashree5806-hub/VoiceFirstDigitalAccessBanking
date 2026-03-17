package com.falcon.api.controller;

import com.falcon.api.service.VoiceAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/voice")
@CrossOrigin(origins = "*")
public class VoiceAuthController {

    private final VoiceAuthService voiceAuthService;

    public VoiceAuthController(VoiceAuthService voiceAuthService) {
        this.voiceAuthService = voiceAuthService;
    }

    /**
     * Enroll a user's voiceprint.
     * Body: { userId, voiceprintHash, language }
     */
    @PostMapping("/enroll")
    public ResponseEntity<Map<String, Object>> enroll(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String hash = body.get("voiceprintHash").toString();
        String language = body.getOrDefault("language", "ta-IN").toString();
        return ResponseEntity.ok(voiceAuthService.enroll(userId, hash, language));
    }

    /**
     * Verify a voice attempt.
     * Body: { userId, matchScore, audioQuality, isLargeTransfer, challengePassed }
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        double matchScore = Double.parseDouble(body.get("matchScore").toString());
        String audioQuality = body.getOrDefault("audioQuality", "Good").toString();
        boolean isLargeTransfer = Boolean.parseBoolean(body.getOrDefault("isLargeTransfer", "false").toString());
        boolean challengePassed = Boolean.parseBoolean(body.getOrDefault("challengePassed", "true").toString());
        return ResponseEntity.ok(voiceAuthService.verify(userId, matchScore, audioQuality, isLargeTransfer, challengePassed));
    }

    /**
     * Trigger fallback auth method.
     * Body: { userId, method }  method: otp | spoken-pin | csp
     */
    @PostMapping("/fallback")
    public ResponseEntity<Map<String, Object>> fallback(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String method = body.getOrDefault("method", "otp").toString();
        return ResponseEntity.ok(voiceAuthService.triggerFallback(userId, method));
    }

    /**
     * Reset failed attempts (called after successful fallback auth).
     */
    @PostMapping("/reset-attempts")
    public ResponseEntity<Map<String, Object>> resetAttempts(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        return ResponseEntity.ok(voiceAuthService.resetAttempts(userId));
    }
}

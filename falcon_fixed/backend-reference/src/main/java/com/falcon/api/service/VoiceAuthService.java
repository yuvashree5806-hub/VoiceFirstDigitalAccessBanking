package com.falcon.api.service;

import com.falcon.api.model.User;
import com.falcon.api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class VoiceAuthService {

    private static final double THRESHOLD_HIGH = 85.0;
    private static final double THRESHOLD_LOW  = 70.0;
    private static final int    MAX_ATTEMPTS   = 3;
    private static final int    LOCKOUT_MINUTES = 30;

    private final UserRepository userRepository;

    public VoiceAuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, Object> enroll(Long userId, String voiceprintHash, String language) {
        Map<String, Object> response = new HashMap<>();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }
        user.setVoiceprintHash(voiceprintHash);
        user.setEnrolledAt(LocalDateTime.now());
        user.setVerified(true);
        user.setLanguagePreference(language);
        userRepository.save(user);
        response.put("success", true);
        response.put("message", "Voiceprint enrolled successfully");
        response.put("enrolledAt", user.getEnrolledAt().toString());
        return response;
    }

    public Map<String, Object> verify(Long userId, double matchScore, String audioQuality,
                                      boolean isLargeTransfer, boolean challengePassed) {
        Map<String, Object> response = new HashMap<>();
        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            response.put("status", "denied");
            response.put("message", "User not found");
            return response;
        }

        // Check if account is locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            response.put("status", "denied");
            response.put("authLayer", "LOCKED");
            response.put("message", "Account locked. Try again after " + user.getLockedUntil());
            return response;
        }

        // Replay attack detection
        if (!challengePassed) {
            incrementFailedAttempts(user);
            response.put("status", "denied");
            response.put("authLayer", "DENY");
            response.put("message", "Liveness challenge failed. Possible replay attack.");
            return response;
        }

        // Poor audio quality — route to fallback
        if ("Poor".equals(audioQuality)) {
            response.put("status", "fallback");
            response.put("authLayer", "F2");
            response.put("fallbackMethod", user.getPreferredFallback());
            response.put("message", "Audio quality too low. Switching to " + user.getPreferredFallback() + " fallback.");
            return response;
        }

        // Voice match too low — deny
        if (matchScore < THRESHOLD_LOW) {
            incrementFailedAttempts(user);
            response.put("status", "denied");
            response.put("authLayer", "DENY");
            response.put("matchScore", matchScore);
            response.put("message", "Voice match too low (" + matchScore + "%). Access denied.");
            checkLockout(user, response);
            return response;
        }

        // Partial match — spoken PIN fallback
        if (matchScore < THRESHOLD_HIGH) {
            response.put("status", "fallback");
            response.put("authLayer", "F1");
            response.put("fallbackMethod", "spoken-pin");
            response.put("matchScore", matchScore);
            response.put("message", "Voice match partial (" + matchScore + "%). Spoken PIN required.");
            return response;
        }

        // High match — but large transfer needs OTP too
        if (isLargeTransfer) {
            response.put("status", "fallback");
            response.put("authLayer", "L3");
            response.put("fallbackMethod", "otp");
            response.put("matchScore", matchScore);
            response.put("message", "Voice passed (" + matchScore + "%). OTP required for large transfer.");
            return response;
        }

        // Full authentication success
        resetAttempts(userId);
        response.put("status", "authenticated");
        response.put("authLayer", "L2");
        response.put("matchScore", matchScore);
        response.put("message", "Voice authenticated successfully.");
        return response;
    }

    public Map<String, Object> triggerFallback(Long userId, String method) {
        Map<String, Object> response = new HashMap<>();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }
        user.setPreferredFallback(method);
        userRepository.save(user);
        response.put("success", true);
        response.put("method", method);
        response.put("message", "Fallback method '" + method + "' activated for user " + userId);
        return response;
    }

    public Map<String, Object> resetAttempts(Long userId) {
        Map<String, Object> response = new HashMap<>();
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }
        response.put("success", true);
        return response;
    }

    private void incrementFailedAttempts(User user) {
        user.setFailedAttempts(user.getFailedAttempts() + 1);
        if (user.getFailedAttempts() >= MAX_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
        }
        userRepository.save(user);
    }

    private void checkLockout(User user, Map<String, Object> response) {
        if (user.getLockedUntil() != null) {
            response.put("locked", true);
            response.put("lockedUntil", user.getLockedUntil().toString());
            response.put("message", "Account locked for " + LOCKOUT_MINUTES + " minutes after " + MAX_ATTEMPTS + " failed attempts.");
        }
    }
}

package com.falcon.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @Column(nullable = false)
    private String languagePreference;

    @Column(nullable = false)
    private Boolean isVerified = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 512)
    private String voiceprintHash;

    private LocalDateTime enrolledAt;

    @Column(nullable = false)
    private int failedAttempts = 0;

    private LocalDateTime lockedUntil;

    @Column(nullable = false)
    private String preferredFallback = "otp";

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

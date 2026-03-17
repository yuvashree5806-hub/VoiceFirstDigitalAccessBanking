package com.falcon.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    
    private String languagePreference;
    private Boolean isVerified;
    private String createdAt;
}

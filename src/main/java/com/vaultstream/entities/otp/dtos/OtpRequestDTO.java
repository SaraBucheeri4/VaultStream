package com.vaultstream.entities.otp.dtos;

import com.vaultstream.entities.otp.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OtpRequestDTO(
        @NotBlank @Email String email,
        @NotNull OtpPurpose purpose
) {}

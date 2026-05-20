package com.vaultstream.entities.otp.dtos;

import com.vaultstream.entities.otp.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OtpVerifyDTO(
        @NotBlank @Email String email,
        @NotNull OtpPurpose purpose,
        @NotBlank @Size(min = 6, max = 6) String code
) {}

package com.vaultstream.entities.users.dtos;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PinSetupDTO(
        @Pattern(regexp = "\\d{4,6}", message = "PIN must be 4–6 digits")
        @Size(min = 4, max = 6)
        String pin
) {}

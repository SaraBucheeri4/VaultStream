package com.vaultstream.entities.users.dtos;

import com.vaultstream.entities.users.UserRole;

public record RegisterDTO(String name, String email, String password, UserRole role) {
}

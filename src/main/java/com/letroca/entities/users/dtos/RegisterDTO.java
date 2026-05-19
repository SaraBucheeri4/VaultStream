package com.letroca.entities.users.dtos;

import com.letroca.entities.users.UserRole;

public record RegisterDTO(String name, String email, String password, UserRole role) {
}

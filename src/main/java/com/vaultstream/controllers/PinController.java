package com.vaultstream.controllers;

import com.vaultstream.entities.users.User;
import com.vaultstream.entities.users.dtos.PinSetupDTO;
import com.vaultstream.entities.users.dtos.PinVerifyDTO;
import com.vaultstream.services.PinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "/api/pin", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "PIN", description = "Transaction PIN setup and verification")
public class PinController {

    private final PinService pinService;

    public PinController(PinService pinService) {
        this.pinService = pinService;
    }

    @PostMapping(value = "/setup", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Set up a 4–6 digit transaction PIN for the authenticated user")
    public ResponseEntity<Map<String, String>> setup(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PinSetupDTO dto) {

        pinService.setupPin(user, dto.pin());
        return ResponseEntity.ok(Map.of("message", "PIN configured successfully"));
    }

    @PostMapping(value = "/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Verify the transaction PIN for the authenticated user")
    public ResponseEntity<Map<String, Object>> verify(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PinVerifyDTO dto,
            HttpServletRequest request) {

        try {
            boolean valid = pinService.verifyPin(user, dto.pin(), clientIp(request));
            if (valid) {
                return ResponseEntity.ok(Map.of("valid", true, "message", "PIN verified"));
            }
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Incorrect PIN"));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", ex.getMessage()));
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}

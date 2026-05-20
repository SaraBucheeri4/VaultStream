package com.vaultstream.controllers;

import com.vaultstream.entities.otp.dtos.OtpRequestDTO;
import com.vaultstream.entities.otp.dtos.OtpVerifyDTO;
import com.vaultstream.entities.users.User;
import com.vaultstream.infra.logging.CorrelationIdFilter;
import com.vaultstream.repositories.UserRepository;
import com.vaultstream.services.OtpService;
import jakarta.validation.Valid;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService     otpService;
    private final UserRepository userRepository;

    public OtpController(OtpService otpService, UserRepository userRepository) {
        this.otpService     = otpService;
        this.userRepository = userRepository;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generate(@Valid @RequestBody OtpRequestDTO dto) {
        User user = (User) userRepository.findByEmail(dto.email());
        String userId = user != null ? user.getId() : "unknown";
        otpService.generate(userId, dto.email(), dto.purpose());
        return ResponseEntity.ok(Map.of("message", "OTP sent"));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@Valid @RequestBody OtpVerifyDTO dto) {
        try {
            boolean valid = otpService.verify(dto.email(), dto.purpose(), dto.code());
            if (valid) {
                return ResponseEntity.ok(Map.of("valid", true, "message", "OTP verified successfully"));
            }
            return ResponseEntity.badRequest().body(errorBody("Invalid OTP code"));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    private Map<String, Object> errorBody(String message) {
        String cid = MDC.get(CorrelationIdFilter.MDC_KEY);
        return cid != null
                ? Map.of("valid", false, "message", message, "correlationId", cid)
                : Map.of("valid", false, "message", message);
    }
}

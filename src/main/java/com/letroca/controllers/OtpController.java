package com.letroca.controllers;

import com.letroca.entities.otp.dtos.OtpRequestDTO;
import com.letroca.entities.otp.dtos.OtpVerifyDTO;
import com.letroca.services.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generate(@Valid @RequestBody OtpRequestDTO dto) {
        otpService.generate(dto.email(), dto.purpose());
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + dto.email()));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@Valid @RequestBody OtpVerifyDTO dto) {
        boolean valid = otpService.verify(dto.email(), dto.purpose(), dto.code());
        if (valid) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "OTP verified successfully"));
        }
        return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Invalid OTP code"));
    }
}

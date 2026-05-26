package com.vaultstream.controllers;

import com.vaultstream.entities.otp.dtos.OtpRequestDTO;
import com.vaultstream.entities.otp.dtos.OtpVerifyDTO;
import com.vaultstream.entities.users.User;
import com.vaultstream.infra.logging.CorrelationIdFilter;
import com.vaultstream.infra.logging.SecurityEventLogger;
import com.vaultstream.infra.logging.SecurityEventLogger.EventType;
import com.vaultstream.infra.logging.SecurityEventLogger.Severity;
import com.vaultstream.repositories.UserRepository;
import com.vaultstream.services.DeviceTrustService;
import com.vaultstream.services.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private static final Logger log = LoggerFactory.getLogger(OtpController.class);

    private final OtpService          otpService;
    private final UserRepository      userRepository;
    private final DeviceTrustService  deviceTrustService;
    private final SecurityEventLogger eventLogger;

    public OtpController(OtpService otpService,
                         UserRepository userRepository,
                         DeviceTrustService deviceTrustService,
                         SecurityEventLogger eventLogger) {
        this.otpService         = otpService;
        this.userRepository     = userRepository;
        this.deviceTrustService = deviceTrustService;
        this.eventLogger        = eventLogger;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generate(@Valid @RequestBody OtpRequestDTO dto) {
        User user     = (User) userRepository.findByEmail(dto.email());
        String userId = user != null ? user.getId() : "unknown";
        log.info("correlationId={} OTP generate request email={}", correlationId(), maskEmail(dto.email()));
        otpService.generate(userId, dto.email(), dto.purpose());
        return ResponseEntity.ok(Map.of("message", "OTP sent"));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(
            @Valid @RequestBody OtpVerifyDTO dto,
            HttpServletRequest request) {
        try {
            boolean valid = otpService.verify(dto.email(), dto.purpose(), dto.code());
            if (valid) {
                log.info("correlationId={} OTP verified successfully email={}", correlationId(), maskEmail(dto.email()));

                // Register this device as trusted after successful OTP verification
                User user = (User) userRepository.findByEmail(dto.email());
                if (user != null) {
                    deviceTrustService.registerTrustedDevice(
                            user.getId(), clientIp(request), request.getHeader("User-Agent"));
                }

                return ResponseEntity.ok(Map.of("valid", true, "message", "OTP verified successfully"));
            }

            log.warn("correlationId={} OTP invalid for email={}", correlationId(), maskEmail(dto.email()));
            User user = (User) userRepository.findByEmail(dto.email());
            if (user != null) {
                eventLogger.emit(EventType.OTP_FAILED, user.getId(), clientIp(request), Severity.MEDIUM);
            }
            return ResponseEntity.badRequest().body(errorBody("Invalid OTP code"));

        } catch (IllegalStateException ex) {
            log.warn("correlationId={} OTP error email={} reason={}", correlationId(), maskEmail(dto.email()), ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    private Map<String, Object> errorBody(String message) {
        String cid = correlationId();
        return cid != null
                ? Map.of("valid", false, "message", message, "correlationId", cid)
                : Map.of("valid", false, "message", message);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
    }

    private String correlationId() {
        return MDC.get(CorrelationIdFilter.MDC_KEY);
    }
}

package com.vaultstream.controllers;

import com.vaultstream.entities.users.User;
import com.vaultstream.entities.users.dtos.AuthenticationDTO;
import com.vaultstream.entities.users.dtos.LoginResponseDTO;
import com.vaultstream.entities.users.dtos.RefreshRequestDTO;
import com.vaultstream.entities.users.dtos.RegisterDTO;
import com.vaultstream.infra.logging.CorrelationIdFilter;
import com.vaultstream.infra.logging.SecurityEventLogger;
import com.vaultstream.infra.logging.SecurityEventLogger.EventType;
import com.vaultstream.infra.logging.SecurityEventLogger.Severity;
import com.vaultstream.infra.metrics.AuthMetrics;
import com.vaultstream.infra.security.TokenService;
import com.vaultstream.repositories.UserRepository;
import com.vaultstream.services.DeviceTrustService;
import com.vaultstream.services.LoginAuditService;
import com.vaultstream.services.SuspiciousLoginService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "/auth", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Authentication", description = "Login, registration, and session management endpoints")
public class AuthenticationController {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);

    private final AuthenticationManager  authenticationManager;
    private final UserRepository         userRepository;
    private final TokenService           tokenService;
    private final AuthMetrics            metrics;
    private final DeviceTrustService     deviceTrustService;
    private final SuspiciousLoginService suspiciousLoginService;
    private final LoginAuditService      loginAuditService;
    private final SecurityEventLogger    eventLogger;

    public AuthenticationController(AuthenticationManager authenticationManager,
                                    UserRepository userRepository,
                                    TokenService tokenService,
                                    AuthMetrics metrics,
                                    DeviceTrustService deviceTrustService,
                                    SuspiciousLoginService suspiciousLoginService,
                                    LoginAuditService loginAuditService,
                                    SecurityEventLogger eventLogger) {
        this.authenticationManager  = authenticationManager;
        this.userRepository         = userRepository;
        this.tokenService           = tokenService;
        this.metrics                = metrics;
        this.deviceTrustService     = deviceTrustService;
        this.suspiciousLoginService = suspiciousLoginService;
        this.loginAuditService      = loginAuditService;
        this.eventLogger            = eventLogger;
    }

    @Transactional
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Authenticate and receive JWT access + refresh tokens")
    public ResponseEntity<?> login(@RequestBody AuthenticationDTO data, HttpServletRequest request) {
        metrics.loginAttempts.increment();
        String maskedEmail = maskEmail(data.email());
        String ip          = clientIp(request);
        String userAgent   = request.getHeader("User-Agent");
        log.info("correlationId={} Login attempt email={} ip={}", correlationId(), maskedEmail, ip);

        try {
            var credentials = new UsernamePasswordAuthenticationToken(data.email(), data.password());
            var auth        = metrics.loginTimer.record(() -> authenticationManager.authenticate(credentials));
            var user        = (User) auth.getPrincipal();

            user.resetFailedAttempts();
            userRepository.save(user);

            // Device trust check — if trusted device, no OTP needed; just note it
            boolean trusted = deviceTrustService.isTrusted(user.getId(), ip);
            if (trusted) {
                deviceTrustService.touchLastUsed(user.getId(), ip);
                log.info("correlationId={} Trusted device login userId={} ip={}", correlationId(), user.getId(), ip);
            } else {
                log.info("correlationId={} New device login userId={} ip={} — OTP required", correlationId(), user.getId(), ip);
            }

            // Suspicious login detection
            suspiciousLoginService.checkAndReport(user.getId(), data.email(), ip);

            // Audit
            loginAuditService.recordSuccess(user.getId(), data.email(), ip, userAgent);
            eventLogger.emit(EventType.LOGIN_SUCCESS, user.getId(), ip, Severity.LOW);

            String accessToken  = tokenService.generateAccessToken(user);
            String refreshToken = tokenService.generateRefreshToken(user);

            metrics.loginSuccess.increment();
            log.info("correlationId={} Login successful email={} ip={} trusted={}", correlationId(), maskedEmail, ip, trusted);

            return ResponseEntity.ok()
                    .header(CorrelationIdFilter.CORRELATION_ID_HEADER, correlationId())
                    .body(new LoginResponseDTO(accessToken, refreshToken));

        } catch (LockedException ex) {
            metrics.loginFailure.increment();
            log.warn("correlationId={} Login rejected — account locked email={} ip={}", correlationId(), maskedEmail, ip);
            loginAuditService.recordLocked(data.email(), ip, userAgent);
            eventLogger.emit(EventType.ACCOUNT_LOCKED, null, ip, Severity.HIGH, maskEmail(data.email()));
            return errorResponse(423, "Account temporarily locked due to too many failed attempts");

        } catch (BadCredentialsException ex) {
            metrics.loginFailure.increment();
            log.warn("correlationId={} Login failed email={} ip={} reason=bad_credentials", correlationId(), maskedEmail, ip);

            User stored = (User) userRepository.findByEmail(data.email());
            if (stored != null) {
                stored.recordFailedAttempt();
                userRepository.save(stored);
                loginAuditService.recordFailure(stored.getId(), data.email(), ip, userAgent, "bad_credentials");
            } else {
                loginAuditService.recordFailure(null, data.email(), ip, userAgent, "user_not_found");
            }
            eventLogger.emit(EventType.LOGIN_FAILED, null, ip, Severity.MEDIUM, maskEmail(data.email()));
            return errorResponse(401, "Invalid credentials");

        } catch (Exception ex) {
            metrics.loginFailure.increment();
            log.error("correlationId={} Login error email={}", correlationId(), maskedEmail, ex);
            return errorResponse(500, "Internal error");
        }
    }

    @PostMapping(value = "/refresh", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Rotate a refresh token and get a new access + refresh token pair")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequestDTO body) {
        try {
            var stored = tokenService.findRefreshToken(body.refreshToken());
            User user  = userRepository.findUserById(stored.getUserId());
            if (user == null) return errorResponse(401, "User not found");

            String[] tokens = tokenService.rotateRefreshToken(body.refreshToken(), user);
            metrics.tokenRefreshes.increment();
            return ResponseEntity.ok(new LoginResponseDTO(tokens[0], tokens[1]));

        } catch (IllegalStateException ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("already revoked")) {
                eventLogger.emit(EventType.TOKEN_REUSE_DETECTED, null, null, Severity.CRITICAL);
            }
            log.warn("correlationId={} Refresh token rejected: {}", correlationId(), ex.getMessage());
            return errorResponse(401, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("correlationId={} Refresh token rejected: {}", correlationId(), ex.getMessage());
            return errorResponse(401, ex.getMessage());
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate the current access token")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = extractBearerToken(request);
        if (token != null) {
            String email = tokenService.validateToken(token);
            User user    = (User) userRepository.findByEmail(email);
            tokenService.blacklistToken(token);
            if (user != null) {
                loginAuditService.recordLogout(user.getId(), clientIp(request), request.getHeader("User-Agent"));
            }
        }
        metrics.logouts.increment();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout/all")
    @Operation(summary = "Revoke all active sessions (global logout)")
    public ResponseEntity<Void> logoutAll(HttpServletRequest request) {
        String token = extractBearerToken(request);
        if (token != null) {
            String email = tokenService.validateToken(token);
            User user    = (User) userRepository.findByEmail(email);
            if (user != null) {
                tokenService.revokeAllTokens(user.getId());
                tokenService.blacklistToken(token);
                loginAuditService.recordLogout(user.getId(), clientIp(request), request.getHeader("User-Agent"));
                eventLogger.emit(EventType.GLOBAL_LOGOUT, user.getId(), clientIp(request), Severity.LOW);
                log.info("correlationId={} Global logout email={}", correlationId(), maskEmail(email));
            }
        }
        metrics.logouts.increment();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Register a new user account")
    public ResponseEntity<?> register(@RequestBody RegisterDTO data) {
        log.info("correlationId={} Registration attempt email={}", correlationId(), maskEmail(data.email()));

        if (userRepository.findByEmail(data.email()) != null) {
            log.warn("correlationId={} Registration rejected: email already exists email={}", correlationId(), maskEmail(data.email()));
            return errorResponse(400, "Email already registered");
        }

        String encryptedPassword = new BCryptPasswordEncoder().encode(data.password());
        userRepository.save(new User(data.name(), data.email(), encryptedPassword, data.role()));

        metrics.registrations.increment();
        log.info("correlationId={} Registration successful email={}", correlationId(), maskEmail(data.email()));

        return ResponseEntity.ok().build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, String>> errorResponse(int status, String message) {
        String cid = correlationId();
        var body = cid != null
                ? Map.of("error", message, "correlationId", cid)
                : Map.of("error", message);
        return ResponseEntity.status(status).body(body);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return header.substring(7);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIdx);
    }

    private String correlationId() {
        return MDC.get(CorrelationIdFilter.MDC_KEY);
    }
}

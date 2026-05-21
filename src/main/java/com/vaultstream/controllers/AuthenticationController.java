package com.vaultstream.controllers;

import com.vaultstream.entities.users.User;
import com.vaultstream.entities.users.dtos.AuthenticationDTO;
import com.vaultstream.entities.users.dtos.LoginResponseDTO;
import com.vaultstream.entities.users.dtos.RefreshRequestDTO;
import com.vaultstream.entities.users.dtos.RegisterDTO;
import com.vaultstream.infra.logging.CorrelationIdFilter;
import com.vaultstream.infra.metrics.AuthMetrics;
import com.vaultstream.infra.security.TokenService;
import com.vaultstream.repositories.UserRepository;
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

    private final AuthenticationManager authenticationManager;
    private final UserRepository        userRepository;
    private final TokenService          tokenService;
    private final AuthMetrics           metrics;

    public AuthenticationController(AuthenticationManager authenticationManager,
                                    UserRepository userRepository,
                                    TokenService tokenService,
                                    AuthMetrics metrics) {
        this.authenticationManager = authenticationManager;
        this.userRepository        = userRepository;
        this.tokenService          = tokenService;
        this.metrics               = metrics;
    }

    @Transactional
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Authenticate and receive JWT access + refresh tokens")
    public ResponseEntity<?> login(@RequestBody AuthenticationDTO data) {
        metrics.loginAttempts.increment();
        String maskedEmail = maskEmail(data.email());
        log.info("Login attempt for email={}", maskedEmail);

        try {
            var credentials = new UsernamePasswordAuthenticationToken(data.email(), data.password());
            var auth        = metrics.loginTimer.record(() -> authenticationManager.authenticate(credentials));
            var user        = (User) auth.getPrincipal();

            user.resetFailedAttempts();
            userRepository.save(user);

            String accessToken  = tokenService.generateAccessToken(user);
            String refreshToken = tokenService.generateRefreshToken(user);

            metrics.loginSuccess.increment();
            log.info("Login successful for email={}", maskedEmail);

            return ResponseEntity.ok(new LoginResponseDTO(accessToken, refreshToken));

        } catch (LockedException ex) {
            metrics.loginFailure.increment();
            log.warn("Login rejected — account locked email={}", maskedEmail);
            return errorResponse(423, "Account temporarily locked due to too many failed attempts");

        } catch (BadCredentialsException ex) {
            metrics.loginFailure.increment();
            log.warn("Login failed email={} reason=bad_credentials", maskedEmail);

            // Increment failed attempts on the stored user (best-effort)
            User stored = (User) userRepository.findByEmail(data.email());
            if (stored != null) {
                stored.recordFailedAttempt();
                userRepository.save(stored);
            }

            return errorResponse(401, "Invalid credentials");

        } catch (Exception ex) {
            metrics.loginFailure.increment();
            log.error("Login error for email={}", maskedEmail, ex);
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
            return ResponseEntity.ok(new LoginResponseDTO(tokens[0], tokens[1]));

        } catch (IllegalStateException | IllegalArgumentException ex) {
            log.warn("Refresh token rejected: {}", ex.getMessage());
            return errorResponse(401, ex.getMessage());
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate the current access token")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = extractBearerToken(request);
        if (token != null) {
            tokenService.blacklistToken(token);
        }
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
                log.info("Global logout for email={}", maskEmail(email));
            }
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Register a new user account")
    public ResponseEntity<?> register(@RequestBody RegisterDTO data) {
        log.info("Registration attempt for email={}", maskEmail(data.email()));

        if (userRepository.findByEmail(data.email()) != null) {
            log.warn("Registration rejected: email already exists email={}", maskEmail(data.email()));
            return errorResponse(400, "Email already registered");
        }

        String encryptedPassword = new BCryptPasswordEncoder().encode(data.password());
        userRepository.save(new User(data.name(), data.email(), encryptedPassword, data.role()));

        metrics.registrations.increment();
        log.info("Registration successful for email={}", maskEmail(data.email()));

        return ResponseEntity.ok().build();
    }

    // ── helpers ─────────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, String>> errorResponse(int status, String message) {
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        var body = correlationId != null
                ? Map.of("error", message, "correlationId", correlationId)
                : Map.of("error", message);
        return ResponseEntity.status(status).body(body);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return header.substring(7);
    }

    /** Masks email for logs: a***@example.com */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}

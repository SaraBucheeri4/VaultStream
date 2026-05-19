package com.letroca.controllers;

import com.letroca.entities.users.User;
import com.letroca.entities.users.dtos.AuthenticationDTO;
import com.letroca.entities.users.dtos.LoginResponseDTO;
import com.letroca.entities.users.dtos.RegisterDTO;
import com.letroca.infra.metrics.AuthMetrics;
import com.letroca.infra.security.TokenService;
import com.letroca.repositories.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/auth", produces = "application/json")
@Tag(name = "Authentication", description = "Login and registration endpoints")
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

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Authenticate and receive a JWT token")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody AuthenticationDTO data) {
        metrics.loginAttempts.increment();
        log.info("Login attempt for email={}", data.email());

        try {
            var credentials = new UsernamePasswordAuthenticationToken(data.email(), data.password());
            var auth        = metrics.loginTimer.record(() -> authenticationManager.authenticate(credentials));
            var token       = tokenService.generateToken((User) auth.getPrincipal());

            metrics.loginSuccess.increment();
            log.info("Login successful for email={}", data.email());

            return ResponseEntity.ok(new LoginResponseDTO(token));

        } catch (BadCredentialsException ex) {
            metrics.loginFailure.increment();
            log.warn("Login failed for email={} reason=bad_credentials", data.email());
            return ResponseEntity.status(401).build();

        } catch (Exception ex) {
            metrics.loginFailure.increment();
            log.error("Login error for email={}", data.email(), ex);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Register a new user account")
    public ResponseEntity<Void> register(@RequestBody RegisterDTO data) {
        log.info("Registration attempt for email={}", data.email());

        if (userRepository.findByEmail(data.email()) != null) {
            log.warn("Registration rejected: email already exists email={}", data.email());
            return ResponseEntity.badRequest().build();
        }

        String encryptedPassword = new BCryptPasswordEncoder().encode(data.password());
        userRepository.save(new User(data.name(), data.email(), encryptedPassword, data.role()));

        metrics.registrations.increment();
        log.info("Registration successful for email={}", data.email());

        return ResponseEntity.ok().build();
    }
}

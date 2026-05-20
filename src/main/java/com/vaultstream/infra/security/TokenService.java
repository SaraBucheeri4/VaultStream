package com.vaultstream.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.vaultstream.entities.tokens.RefreshToken;
import com.vaultstream.entities.users.User;
import com.vaultstream.repositories.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class TokenService {

    private static final Duration ACCESS_TTL  = Duration.ofMinutes(15);
    private static final Duration REFRESH_TTL = Duration.ofDays(7);

    @Value("${api.security.token.secret}")
    private String secret;

    private final RefreshTokenRepository refreshTokenRepository;
    private final StringRedisTemplate    redis;

    public TokenService(RefreshTokenRepository refreshTokenRepository,
                        StringRedisTemplate redis) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.redis                  = redis;
    }

    /** Blacklists an access token until its natural expiry. */
    public void blacklistToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(this.secret);
            Date expiresAt = JWT.require(algorithm).withIssuer("auth-api")
                    .build().verify(token).getExpiresAt();
            long ttlSeconds = (expiresAt.getTime() - System.currentTimeMillis()) / 1000;
            if (ttlSeconds > 0) {
                redis.opsForValue().set("blacklist:" + token, "1", Duration.ofSeconds(ttlSeconds));
            }
        } catch (JWTVerificationException ignored) {
            // already expired — no need to blacklist
        }
    }

    public String generateAccessToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(this.secret);
            return JWT.create()
                    .withIssuer("auth-api")
                    .withSubject(user.getEmail())
                    .withExpiresAt(Instant.now().plus(ACCESS_TTL))
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Error while generating access token", exception);
        }
    }

    @Transactional
    public String generateRefreshToken(User user) {
        String token = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(Instant.now().plus(REFRESH_TTL))
                .createdAt(Instant.now())
                .build());
        return token;
    }

    /**
     * Rotates a refresh token: validates, revokes the old one, issues a new pair.
     * Returns [newAccessToken, newRefreshToken].
     */
    @Transactional
    public String[] rotateRefreshToken(String oldToken, User user) {
        RefreshToken stored = refreshTokenRepository.findByToken(oldToken)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (stored.isRevoked()) {
            // Possible token theft — revoke all tokens for this user
            refreshTokenRepository.revokeAllByUserId(stored.getUserId());
            throw new IllegalStateException("Refresh token already revoked; all sessions invalidated");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Refresh token expired");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccess  = generateAccessToken(user);
        String newRefresh = generateRefreshToken(user);
        return new String[]{newAccess, newRefresh};
    }

    /** Looks up a stored refresh token record without modifying it. */
    public RefreshToken findRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));
    }

    @Transactional
    public void revokeAllTokens(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(this.secret);
            return JWT.require(algorithm)
                    .withIssuer("auth-api")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return "";
        }
    }

    // Kept for backward-compat callers; delegates to access token generation
    public String generateToken(User user) {
        return generateAccessToken(user);
    }
}

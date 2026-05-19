package com.letroca.services;

import com.letroca.entities.otp.OtpPurpose;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redis;
    private final ResendEmailService emailService;

    @Value("${otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${otp.rate-limit-per-hour:5}")
    private int rateLimitPerHour;

    public OtpService(StringRedisTemplate redis, ResendEmailService emailService) {
        this.redis = redis;
        this.emailService = emailService;
    }

    public void generate(String email, OtpPurpose purpose) {
        String rateLimitKey = "otp:ratelimit:" + email;
        String countStr = redis.opsForValue().get(rateLimitKey);
        int count = countStr == null ? 0 : Integer.parseInt(countStr);

        if (count >= rateLimitPerHour) {
            throw new IllegalStateException("Too many OTP requests. Try again in an hour.");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        String otpKey = "otp:" + email + ":" + purpose.name();
        String attemptsKey = "otp:attempts:" + email + ":" + purpose.name();

        redis.opsForValue().set(otpKey, code, Duration.ofMinutes(expiryMinutes));
        redis.delete(attemptsKey);

        if (countStr == null) {
            redis.opsForValue().set(rateLimitKey, "1", Duration.ofHours(1));
        } else {
            redis.opsForValue().increment(rateLimitKey);
        }

        emailService.sendOtpEmail(email, code, purpose.name());
    }

    public boolean verify(String email, OtpPurpose purpose, String code) {
        String otpKey = "otp:" + email + ":" + purpose.name();
        String attemptsKey = "otp:attempts:" + email + ":" + purpose.name();

        String attemptsStr = redis.opsForValue().get(attemptsKey);
        int attempts = attemptsStr == null ? 0 : Integer.parseInt(attemptsStr);

        if (attempts >= maxAttempts) {
            throw new IllegalStateException("Maximum verification attempts exceeded. Request a new OTP.");
        }

        String stored = redis.opsForValue().get(otpKey);

        if (stored == null) {
            throw new IllegalStateException("OTP expired or not found. Request a new one.");
        }

        if (!stored.equals(code)) {
            if (attemptsStr == null) {
                redis.opsForValue().set(attemptsKey, "1", Duration.ofMinutes(expiryMinutes));
            } else {
                redis.opsForValue().increment(attemptsKey);
            }
            return false;
        }

        redis.delete(otpKey);
        redis.delete(attemptsKey);
        return true;
    }
}

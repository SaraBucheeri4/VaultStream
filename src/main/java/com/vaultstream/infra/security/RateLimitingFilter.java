package com.vaultstream.infra.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Fixed-window rate limiter backed by Redis: 5 requests per 15-minute window per IP.
 * Counter is stored in Redis so it persists across restarts and scales horizontally.
 */
@Component
@Order(2)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int      MAX_REQUESTS = 5;
    private static final Duration WINDOW       = Duration.ofMinutes(15);

    private final StringRedisTemplate redis;

    public RateLimitingFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (!request.getRequestURI().startsWith("/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String key     = "ratelimit:" + getClientIP(request);
        String current = redis.opsForValue().get(key);
        int    count   = current == null ? 0 : Integer.parseInt(current);

        if (count >= MAX_REQUESTS) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests\"}");
            return;
        }

        if (current == null) {
            redis.opsForValue().set(key, "1", WINDOW);
        } else {
            redis.opsForValue().increment(key);
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) return request.getRemoteAddr();
        return xfHeader.split(",")[0].trim();
    }
}

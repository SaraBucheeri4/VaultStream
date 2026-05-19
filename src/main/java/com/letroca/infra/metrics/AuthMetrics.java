package com.letroca.infra.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

/**
 * Centralised Prometheus counters and timers for authentication events.
 * Inject this bean into any service/controller that needs to record metrics.
 */
@Component
public class AuthMetrics {

    public final Counter loginAttempts;
    public final Counter loginSuccess;
    public final Counter loginFailure;
    public final Counter registrations;
    public final Counter tokenRefreshes;
    public final Counter logouts;
    public final Timer   loginTimer;

    public AuthMetrics(MeterRegistry registry) {
        this.loginAttempts  = Counter.builder("auth.login.attempts")
                .description("Total login attempts")
                .register(registry);

        this.loginSuccess   = Counter.builder("auth.login.success")
                .description("Successful logins")
                .register(registry);

        this.loginFailure   = Counter.builder("auth.login.failure")
                .description("Failed login attempts")
                .register(registry);

        this.registrations  = Counter.builder("auth.registrations")
                .description("New user registrations")
                .register(registry);

        this.tokenRefreshes = Counter.builder("auth.token.refreshes")
                .description("JWT token refreshes")
                .register(registry);

        this.logouts        = Counter.builder("auth.logouts")
                .description("User logouts")
                .register(registry);

        this.loginTimer     = Timer.builder("auth.login.duration")
                .description("Time taken to process a login request")
                .register(registry);
    }
}

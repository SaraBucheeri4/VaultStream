package com.vaultstream.infra.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class AuthMetrics {

    // Login
    public final Counter loginAttempts;
    public final Counter loginSuccess;
    public final Counter loginFailure;
    public final Timer   loginTimer;

    // Registration & sessions
    public final Counter registrations;
    public final Counter tokenRefreshes;
    public final Counter logouts;

    // OTP
    public final Counter otpFailures;

    // Security events
    public final Counter suspiciousLogins;
    public final Counter deviceTrustRegistrations;
    public final Counter deviceRevocations;
    public final Counter pinVerifyFailures;
    public final Counter tokenReuseDetections;

    public AuthMetrics(MeterRegistry registry) {
        this.loginAttempts   = counter(registry, "auth.login.attempts",    "Total login attempts");
        this.loginSuccess    = counter(registry, "auth.login.success",     "Successful logins");
        this.loginFailure    = counter(registry, "auth.login.failure",     "Failed login attempts");
        this.registrations   = counter(registry, "auth.registrations",     "New user registrations");
        this.tokenRefreshes  = counter(registry, "auth.token.refreshes",   "JWT token refreshes");
        this.logouts         = counter(registry, "auth.logouts",           "User logouts");
        this.otpFailures     = counter(registry, "auth.otp.failures",      "OTP verification failures");
        this.suspiciousLogins        = counter(registry, "auth.suspicious.logins",         "Suspicious login detections");
        this.deviceTrustRegistrations = counter(registry, "auth.device.trust.registered", "New trusted device registrations");
        this.deviceRevocations       = counter(registry, "auth.device.revocations",       "Trusted device revocations");
        this.pinVerifyFailures       = counter(registry, "auth.pin.verify.failures",      "PIN verification failures");
        this.tokenReuseDetections    = counter(registry, "auth.token.reuse.detected",     "Refresh token reuse detections");

        this.loginTimer = Timer.builder("auth.login.duration")
                .description("Time taken to process a login request")
                .register(registry);
    }

    private Counter counter(MeterRegistry registry, String name, String description) {
        return Counter.builder(name).description(description).register(registry);
    }
}

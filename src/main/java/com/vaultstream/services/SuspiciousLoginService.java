package com.vaultstream.services;

import com.vaultstream.infra.logging.SecurityEventLogger;
import com.vaultstream.infra.logging.SecurityEventLogger.EventType;
import com.vaultstream.infra.logging.SecurityEventLogger.Severity;
import com.vaultstream.repositories.LoginAuditRepository;
import com.vaultstream.repositories.TrustedDeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SuspiciousLoginService {

    private static final Logger log = LoggerFactory.getLogger(SuspiciousLoginService.class);

    private static final int RAPID_ATTEMPT_THRESHOLD  = 10;
    private static final int RAPID_ATTEMPT_WINDOW_MIN = 5;
    private static final int FAILED_ATTEMPT_THRESHOLD = 5;
    private static final int FAILED_ATTEMPT_WINDOW_MIN = 15;

    private final LoginAuditRepository   auditRepository;
    private final TrustedDeviceRepository deviceRepository;
    private final SecurityEventLogger    eventLogger;

    public SuspiciousLoginService(LoginAuditRepository auditRepository,
                                  TrustedDeviceRepository deviceRepository,
                                  SecurityEventLogger eventLogger) {
        this.auditRepository  = auditRepository;
        this.deviceRepository = deviceRepository;
        this.eventLogger      = eventLogger;
    }

    /**
     * Runs all detection checks after a successful login and warns/emits events
     * for any suspicious patterns found.
     *
     * @return true if any suspicion was detected
     */
    public boolean checkAndReport(String userId, String email, String ip) {
        boolean suspicious = false;

        if (isNewDevice(userId, ip)) {
            log.warn("Suspicious login detected for user {} — new device ip={}", maskEmail(email), ip);
            eventLogger.emit(EventType.SUSPICIOUS_LOGIN, userId, ip, Severity.MEDIUM, "new_device");
            suspicious = true;
        }

        if (isNewIpForUser(userId, ip)) {
            log.warn("Suspicious login detected for user {} — login from different IP ip={}", maskEmail(email), ip);
            eventLogger.emit(EventType.SUSPICIOUS_LOGIN, userId, ip, Severity.MEDIUM, "new_ip");
            suspicious = true;
        }

        if (hasRapidLoginAttempts(ip)) {
            log.warn("Suspicious login detected for user {} — rapid login attempts from ip={}", maskEmail(email), ip);
            eventLogger.emit(EventType.SUSPICIOUS_LOGIN, userId, ip, Severity.HIGH, "rapid_attempts");
            suspicious = true;
        }

        if (hasMultipleFailedLogins(userId)) {
            log.warn("Suspicious login detected for user {} — multiple failed logins prior to success", maskEmail(email));
            eventLogger.emit(EventType.SUSPICIOUS_LOGIN, userId, ip, Severity.MEDIUM, "multiple_failed_logins");
            suspicious = true;
        }

        return suspicious;
    }

    /** Returns true if this IP is not registered as a trusted device for the user. */
    public boolean isNewDevice(String userId, String ip) {
        return !deviceRepository.existsByUserIdAndIpAddressAndTrustedTrue(userId, ip);
    }

    /** Returns true if this IP has never had a successful login for this user. */
    public boolean isNewIpForUser(String userId, String ip) {
        List<String> knownIps = auditRepository.findDistinctSuccessIpsByUserId(userId);
        return !knownIps.contains(ip);
    }

    /** Returns true if there have been rapid login attempts (any status) from this IP. */
    public boolean hasRapidLoginAttempts(String ip) {
        Instant since = Instant.now().minus(RAPID_ATTEMPT_WINDOW_MIN, ChronoUnit.MINUTES);
        long total = auditRepository.countByIpAddressAndStatusAndCreatedAtAfter(ip, "FAILED", since)
                   + auditRepository.countByIpAddressAndStatusAndCreatedAtAfter(ip, "SUCCESS", since);
        return total >= RAPID_ATTEMPT_THRESHOLD;
    }

    /** Returns true if the user had many recent failed logins before this success. */
    public boolean hasMultipleFailedLogins(String userId) {
        Instant since = Instant.now().minus(FAILED_ATTEMPT_WINDOW_MIN, ChronoUnit.MINUTES);
        return auditRepository.countByUserIdAndStatusAndCreatedAtAfter(userId, "FAILED", since)
                >= FAILED_ATTEMPT_THRESHOLD;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
    }
}

package com.vaultstream.services;

import com.vaultstream.entities.audit.LoginAuditLog;
import com.vaultstream.infra.logging.CorrelationIdFilter;
import com.vaultstream.repositories.LoginAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class LoginAuditService {

    private static final Logger log = LoggerFactory.getLogger(LoginAuditService.class);

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED  = "FAILED";
    public static final String STATUS_LOCKED  = "LOCKED";
    public static final String STATUS_LOGOUT  = "LOGOUT";

    private final LoginAuditRepository auditRepository;

    public LoginAuditService(LoginAuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    public void recordSuccess(String userId, String email, String ip, String userAgent) {
        save(userId, email, ip, userAgent, STATUS_SUCCESS, null);
        log.info("correlationId={} audit=LOGIN_SUCCESS userId={} ip={}", correlationId(), userId, ip);
    }

    public void recordFailure(String userId, String email, String ip, String userAgent, String reason) {
        save(userId, email, ip, userAgent, STATUS_FAILED, reason);
        log.warn("correlationId={} audit=LOGIN_FAILED email={} ip={} reason={}", correlationId(), maskEmail(email), ip, reason);
    }

    public void recordLocked(String email, String ip, String userAgent) {
        save(null, email, ip, userAgent, STATUS_LOCKED, "Account locked");
        log.warn("correlationId={} audit=ACCOUNT_LOCKED email={} ip={}", correlationId(), maskEmail(email), ip);
    }

    public void recordLogout(String userId, String ip, String userAgent) {
        save(userId, null, ip, userAgent, STATUS_LOGOUT, null);
        log.info("correlationId={} audit=LOGOUT userId={} ip={}", correlationId(), userId, ip);
    }

    @SuppressWarnings("null")
    private void save(String userId, String email, String ip, String userAgent, String status, String reason) {
        try {
            LoginAuditLog entry = LoginAuditLog.builder()
                    .userId(userId)
                    .email(email)
                    .ipAddress(ip != null ? ip : "unknown")
                    .userAgent(userAgent)
                    .status(status)
                    .failureReason(reason)
                    .correlationId(correlationId())
                    .createdAt(Instant.now())
                    .build();
            auditRepository.save(entry);
        } catch (Exception ex) {
            log.error("correlationId={} Failed to write login audit log", correlationId(), ex);
        }
    }

    private String correlationId() {
        return MDC.get(CorrelationIdFilter.MDC_KEY);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
    }
}

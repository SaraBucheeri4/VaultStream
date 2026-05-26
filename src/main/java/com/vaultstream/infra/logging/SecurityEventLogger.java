package com.vaultstream.infra.logging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Emits structured JSON security events so that ELK / Logstash can index them
 * by eventType for dashboards and alerts without any log parsing.
 */
@Component
public class SecurityEventLogger {

    private static final Logger log = LoggerFactory.getLogger("security-events");
    private final ObjectMapper mapper = new ObjectMapper();

    public enum EventType {
        LOGIN_SUCCESS,
        LOGIN_FAILED,
        ACCOUNT_LOCKED,
        TOKEN_REUSE_DETECTED,
        GLOBAL_LOGOUT,
        OTP_FAILED,
        SUSPICIOUS_LOGIN,
        DEVICE_TRUSTED,
        DEVICE_REVOKED,
        PIN_SETUP,
        PIN_VERIFY_FAILED
    }

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    public void emit(EventType type, String userId, String ip, Severity severity) {
        emit(type, userId, ip, severity, null);
    }

    public void emit(EventType type, String userId, String ip, Severity severity, String detail) {
        try {
            ObjectNode node = mapper.createObjectNode();
            node.put("eventType",  type.name());
            node.put("userId",     userId != null ? userId : "unknown");
            node.put("ip",         ip != null ? ip : "unknown");
            node.put("severity",   severity.name());
            node.put("timestamp",  Instant.now().toString());
            if (detail != null) node.put("detail", detail);

            if (severity == Severity.HIGH || severity == Severity.CRITICAL) {
                log.warn(mapper.writeValueAsString(node));
            } else {
                log.info(mapper.writeValueAsString(node));
            }
        } catch (Exception ex) {
            log.error("Failed to emit security event type={}", type, ex);
        }
    }
}

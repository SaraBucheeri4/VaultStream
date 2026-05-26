package com.vaultstream.services;

import com.vaultstream.entities.devices.TrustedDevice;
import com.vaultstream.infra.logging.SecurityEventLogger;
import com.vaultstream.infra.logging.SecurityEventLogger.EventType;
import com.vaultstream.infra.logging.SecurityEventLogger.Severity;
import com.vaultstream.repositories.TrustedDeviceRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class DeviceTrustService {

    private static final Logger log = LoggerFactory.getLogger(DeviceTrustService.class);

    private final TrustedDeviceRepository deviceRepository;
    private final SecurityEventLogger     eventLogger;

    public DeviceTrustService(TrustedDeviceRepository deviceRepository,
                              SecurityEventLogger eventLogger) {
        this.deviceRepository = deviceRepository;
        this.eventLogger      = eventLogger;
    }

    public boolean isTrusted(String userId, String ip) {
        return deviceRepository.existsByUserIdAndIpAddressAndTrustedTrue(userId, ip);
    }

    @SuppressWarnings("null")
    @Transactional
    public void registerTrustedDevice(String userId, String ip, String userAgent) {
        Optional<TrustedDevice> existing = deviceRepository.findByUserIdAndIpAddress(userId, ip);
        if (existing.isPresent()) {
            TrustedDevice d = existing.get();
            d.setTrusted(true);
            d.setLastUsed(Instant.now());
            d.setUserAgent(userAgent);
            deviceRepository.save(d);
        } else {
            TrustedDevice d = TrustedDevice.builder()
                    .userId(userId)
                    .deviceName(deriveDeviceName(userAgent))
                    .userAgent(userAgent)
                    .ipAddress(ip)
                    .lastUsed(Instant.now())
                    .trusted(true)
                    .createdAt(Instant.now())
                    .build();
            deviceRepository.save(d);
            log.info("New trusted device registered userId={} ip={}", userId, ip);
            eventLogger.emit(EventType.DEVICE_TRUSTED, userId, ip, Severity.LOW);
        }
    }

    @Transactional
    public boolean revoke(Long deviceId, String userId) {
        int updated = deviceRepository.revokeByIdAndUserId(deviceId, userId);
        if (updated > 0) {
            log.info("Trusted device revoked deviceId={} userId={}", deviceId, userId);
            eventLogger.emit(EventType.DEVICE_REVOKED, userId, null, Severity.LOW,
                    "deviceId=" + deviceId);
        }
        return updated > 0;
    }

    public List<TrustedDevice> listForUser(String userId) {
        return deviceRepository.findByUserIdOrderByLastUsedDesc(userId);
    }

    @Transactional
    public void touchLastUsed(String userId, String ip) {
        deviceRepository.findByUserIdAndIpAddress(userId, ip).ifPresent(d -> {
            d.setLastUsed(Instant.now());
            deviceRepository.save(d);
        });
    }

    private String deriveDeviceName(String userAgent) {
        if (userAgent == null) return "Unknown Device";
        if (userAgent.contains("Mobile"))  return "Mobile Browser";
        if (userAgent.contains("Chrome"))  return "Chrome Browser";
        if (userAgent.contains("Firefox")) return "Firefox Browser";
        if (userAgent.contains("Safari"))  return "Safari Browser";
        if (userAgent.contains("Edge"))    return "Edge Browser";
        return "Browser";
    }
}

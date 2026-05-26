package com.vaultstream.entities.devices.dtos;

import com.vaultstream.entities.devices.TrustedDevice;

import java.time.Instant;

public record TrustedDeviceResponseDTO(
        Long    id,
        String  deviceName,
        String  userAgent,
        String  ipAddress,
        Instant lastUsed,
        boolean trusted,
        Instant createdAt
) {
    public static TrustedDeviceResponseDTO from(TrustedDevice d) {
        return new TrustedDeviceResponseDTO(
                d.getId(), d.getDeviceName(), d.getUserAgent(),
                d.getIpAddress(), d.getLastUsed(), d.isTrusted(), d.getCreatedAt());
    }
}

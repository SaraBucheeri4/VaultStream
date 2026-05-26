package com.vaultstream.controllers;

import com.vaultstream.entities.devices.dtos.TrustedDeviceResponseDTO;
import com.vaultstream.entities.users.User;
import com.vaultstream.services.DeviceTrustService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/devices", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Devices", description = "Trusted device management")
public class DeviceController {

    private final DeviceTrustService deviceTrustService;

    public DeviceController(DeviceTrustService deviceTrustService) {
        this.deviceTrustService = deviceTrustService;
    }

    @GetMapping
    @Operation(summary = "List all trusted devices for the authenticated user")
    public ResponseEntity<List<TrustedDeviceResponseDTO>> list(@AuthenticationPrincipal User user) {
        List<TrustedDeviceResponseDTO> devices = deviceTrustService.listForUser(user.getId())
                .stream()
                .map(TrustedDeviceResponseDTO::from)
                .toList();
        return ResponseEntity.ok(devices);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke a trusted device by ID")
    public ResponseEntity<Map<String, String>> revoke(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        boolean revoked = deviceTrustService.revoke(id, user.getId());
        if (revoked) {
            return ResponseEntity.ok(Map.of("message", "Device revoked"));
        }
        return ResponseEntity.status(404).body(Map.of("error", "Device not found or does not belong to this user"));
    }
}

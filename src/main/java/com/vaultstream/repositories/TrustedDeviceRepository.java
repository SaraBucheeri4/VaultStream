package com.vaultstream.repositories;

import com.vaultstream.entities.devices.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, Long> {

    List<TrustedDevice> findByUserIdOrderByLastUsedDesc(String userId);

    Optional<TrustedDevice> findByUserIdAndIpAddress(String userId, String ipAddress);

    boolean existsByUserIdAndIpAddressAndTrustedTrue(String userId, String ipAddress);

    @Modifying
    @Query("UPDATE TrustedDevice d SET d.trusted = false WHERE d.id = :id AND d.userId = :userId")
    int revokeByIdAndUserId(Long id, String userId);
}

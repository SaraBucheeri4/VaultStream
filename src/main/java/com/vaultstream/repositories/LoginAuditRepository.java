package com.vaultstream.repositories;

import com.vaultstream.entities.audit.LoginAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAuditLog, Long> {

    List<LoginAuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndStatusAndCreatedAtAfter(String userId, String status, Instant since);

    long countByIpAddressAndStatusAndCreatedAtAfter(String ipAddress, String status, Instant since);

    @Query("SELECT DISTINCT a.ipAddress FROM LoginAuditLog a WHERE a.userId = :userId AND a.status = 'SUCCESS' ORDER BY a.ipAddress")
    List<String> findDistinctSuccessIpsByUserId(String userId);
}

package com.vaultstream.repositories;

import com.vaultstream.entities.logs.LogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LogEntryRepository extends JpaRepository<LogEntry, Long> {

    Page<LogEntry> findByCorrelationId(String correlationId, Pageable pageable);

    @Query("""
            SELECT l FROM LogEntry l
            WHERE (:level       IS NULL OR l.level       = :level)
              AND (:serviceName IS NULL OR l.serviceName = :serviceName)
              AND (:from        IS NULL OR l.timestamp  >= :from)
              AND (:to          IS NULL OR l.timestamp  <= :to)
              AND (:keyword     IS NULL OR LOWER(l.message) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:correlationId IS NULL OR l.correlationId = :correlationId)
            """)
    Page<LogEntry> search(
            @Param("level")         String level,
            @Param("serviceName")   String serviceName,
            @Param("from")          Instant from,
            @Param("to")            Instant to,
            @Param("keyword")       String keyword,
            @Param("correlationId") String correlationId,
            Pageable pageable
    );

    @Query("SELECT l.level, COUNT(l) FROM LogEntry l GROUP BY l.level")
    List<Object[]> countByLevel();

    long countByLevel(String level);
}

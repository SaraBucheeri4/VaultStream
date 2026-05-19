package com.letroca.entities.logs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "log_entries", indexes = {
        @Index(name = "idx_log_level",          columnList = "level"),
        @Index(name = "idx_log_correlation_id", columnList = "correlation_id"),
        @Index(name = "idx_log_timestamp",      columnList = "timestamp"),
        @Index(name = "idx_log_service",        columnList = "service_name")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, length = 10)
    private String level;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @Column(name = "service_name", length = 100)
    private String serviceName;

    @Column(name = "logger_name", length = 200)
    private String loggerName;

    @Column(name = "thread_name", length = 100)
    private String threadName;

    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;
}

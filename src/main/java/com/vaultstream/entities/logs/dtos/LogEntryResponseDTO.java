package com.vaultstream.entities.logs.dtos;

import com.vaultstream.entities.logs.LogEntry;

import java.time.Instant;

public record LogEntryResponseDTO(
        Long id,
        Instant timestamp,
        String level,
        String message,
        String correlationId,
        String serviceName,
        String loggerName,
        String threadName,
        String stackTrace
) {
    public static LogEntryResponseDTO from(LogEntry entry) {
        return new LogEntryResponseDTO(
                entry.getId(),
                entry.getTimestamp(),
                entry.getLevel(),
                entry.getMessage(),
                entry.getCorrelationId(),
                entry.getServiceName(),
                entry.getLoggerName(),
                entry.getThreadName(),
                entry.getStackTrace()
        );
    }
}

package com.vaultstream.entities.logs.dtos;

import java.util.Map;

public record LogStatsDTO(
        long total,
        long errorCount,
        long warnCount,
        long infoCount,
        long debugCount,
        Map<String, Long> byLevel
) {}

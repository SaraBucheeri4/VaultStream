package com.letroca.controllers;

import com.letroca.entities.logs.dtos.LogEntryResponseDTO;
import com.letroca.entities.logs.dtos.LogStatsDTO;
import com.letroca.services.LogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping(value = "/api/logs", produces = "application/json")
@Tag(name = "Logs", description = "Centralized log retrieval and statistics")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    @Operation(summary = "Get all logs (paginated, newest first)")
    public ResponseEntity<Page<LogEntryResponseDTO>> getAll(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Page size")             @RequestParam(defaultValue = "50") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(logService.findAll(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Search logs by level, date range, correlation ID, service name, or keyword")
    public ResponseEntity<Page<LogEntryResponseDTO>> search(
            @Parameter(description = "Log level: ERROR, WARN, INFO, DEBUG")
            @RequestParam(required = false) String level,

            @Parameter(description = "Service name")
            @RequestParam(required = false) String serviceName,

            @Parameter(description = "Start of date range (ISO-8601, e.g. 2024-01-01T00:00:00Z)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,

            @Parameter(description = "End of date range (ISO-8601)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,

            @Parameter(description = "Keyword to search in message text")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Exact correlation ID")
            @RequestParam(required = false) String correlationId,

            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(
                logService.search(level, serviceName, from, to, keyword, correlationId, pageable));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get log statistics: totals broken down by level")
    public ResponseEntity<LogStatsDTO> getStats() {
        return ResponseEntity.ok(logService.getStats());
    }

    @GetMapping("/correlation/{id}")
    @Operation(summary = "Get all log entries for a single correlation ID (full request trace)")
    public ResponseEntity<List<LogEntryResponseDTO>> getByCorrelationId(
            @Parameter(description = "Correlation ID (UUID)") @PathVariable String id) {
        return ResponseEntity.ok(logService.findByCorrelationId(id));
    }
}

package com.vaultstream.controllers;

import com.vaultstream.repositories.LogEntryRepository;
import com.vaultstream.repositories.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping(value = "/api/metrics", produces = "application/json")
@Tag(name = "Metrics", description = "Aggregated system metrics for the dashboard")
public class MetricsController {

    private final MeterRegistry meterRegistry;
    private final LogEntryRepository logEntryRepository;
    private final UserRepository userRepository;

    public MetricsController(MeterRegistry meterRegistry,
                             LogEntryRepository logEntryRepository,
                             UserRepository userRepository) {
        this.meterRegistry = meterRegistry;
        this.logEntryRepository = logEntryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/summary")
    @Operation(summary = "Aggregated metrics: stat cards, nodes, service health")
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(Map.of(
                "statCards",     buildStatCards(),
                "nodes",         buildNodes(),
                "serviceHealth", buildServiceHealth()
        ));
    }

    // ── Stat cards ────────────────────────────────────────────────────────────

    private Map<String, Object> buildStatCards() {
        double httpRequests = safeCount("http.server.requests");
        double avgLatencyMs = safeLatencyMs("http.server.requests");
        long   totalLogs    = logEntryRepository.count();
        long   errorLogs    = logEntryRepository.countByLevel("ERROR");
        double errorRate    = totalLogs > 0 ? (double) errorLogs / totalLogs * 100.0 : 0.0;
        long   totalUsers   = userRepository.count();

        return Map.of(
                "requestCount", (long) httpRequests,
                "avgLatencyMs", Math.round(avgLatencyMs * 10.0) / 10.0,
                "errorRate",    Math.round(errorRate * 1000.0) / 1000.0,
                "totalUsers",   totalUsers
        );
    }

    // ── Nodes (JVM host — single node) ───────────────────────────────────────

    private List<Map<String, Object>> buildNodes() {
        MemoryMXBean mem = ManagementFactory.getMemoryMXBean();
        long heapUsed = mem.getHeapMemoryUsage().getUsed();
        long heapMax  = mem.getHeapMemoryUsage().getMax();
        double heapPct = heapMax > 0 ? (double) heapUsed / heapMax * 100.0 : 0;

        OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();
        double cpuLoad = 0;
        if (os instanceof com.sun.management.OperatingSystemMXBean ext) {
            cpuLoad = ext.getCpuLoad() * 100.0;
            if (cpuLoad < 0) cpuLoad = 0;
        }

        return List.of(Map.of(
                "region",   "LOCAL-NODE",
                "location", System.getProperty("os.name", "Unknown OS"),
                "heapUsedMb",  heapUsed / (1024 * 1024),
                "heapMaxMb",   heapMax  / (1024 * 1024),
                "heapPct",     Math.round(heapPct * 10.0) / 10.0,
                "cpuPct",      Math.round(cpuLoad * 10.0) / 10.0
        ));
    }

    // ── Service health (auth metrics + log error rate) ────────────────────────

    private List<Map<String, Object>> buildServiceHealth() {
        double loginAttempts = safeCount("auth.login.attempts");
        double loginSuccess  = safeCount("auth.login.success");
        double loginFailure  = safeCount("auth.login.failure");

        double authUptime = loginAttempts > 0
                ? Math.min(100.0, loginSuccess / loginAttempts * 100.0)
                : 100.0;

        long totalLogs = logEntryRepository.count();
        long errorLogs = logEntryRepository.countByLevel("ERROR");
        double logHealth = totalLogs > 0
                ? Math.max(0, (1.0 - (double) errorLogs / totalLogs) * 100.0)
                : 100.0;

        double httpCount = safeCount("http.server.requests");

        return List.of(
                Map.of("name", "Auth Service",
                        "pct",    Math.round(authUptime * 100.0) / 100.0,
                        "status", loginFailure == 0 ? "OK" : "DEGRADED"),
                Map.of("name", "Log Engine",
                        "pct",    Math.round(logHealth * 100.0) / 100.0,
                        "status", errorLogs == 0 ? "OK" : "DEGRADED"),
                Map.of("name", "API Gateway",
                        "pct",    httpCount > 0 ? 100.0 : 0.0,
                        "status", httpCount > 0 ? "OK" : "STARTING")
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private double safeCount(String metricName) {
        try {
            return meterRegistry.find(metricName).counters().stream()
                    .mapToDouble(c -> c.count())
                    .sum();
        } catch (Exception e) {
            return 0;
        }
    }

    private double safeLatencyMs(String metricName) {
        try {
            return meterRegistry.find(metricName).timers().stream()
                    .filter(t -> t.count() > 0)
                    .mapToDouble(t -> t.mean(TimeUnit.MILLISECONDS))
                    .average()
                    .orElse(0);
        } catch (Exception e) {
            return 0;
        }
    }
}

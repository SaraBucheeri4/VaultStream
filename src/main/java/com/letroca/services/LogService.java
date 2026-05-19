package com.letroca.services;

import com.letroca.entities.logs.dtos.LogEntryResponseDTO;
import com.letroca.entities.logs.dtos.LogStatsDTO;
import com.letroca.repositories.LogEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LogService {

    private final LogEntryRepository repository;

    public LogService(LogEntryRepository repository) {
        this.repository = repository;
    }

    public Page<LogEntryResponseDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(LogEntryResponseDTO::from);
    }

    public Page<LogEntryResponseDTO> search(String level,
                                            String serviceName,
                                            Instant from,
                                            Instant to,
                                            String keyword,
                                            String correlationId,
                                            Pageable pageable) {
        return repository.search(level, serviceName, from, to, keyword, correlationId, pageable)
                .map(LogEntryResponseDTO::from);
    }

    public List<LogEntryResponseDTO> findByCorrelationId(String correlationId) {
        return repository.findByCorrelationId(correlationId, Pageable.unpaged())
                .map(LogEntryResponseDTO::from)
                .getContent();
    }

    public LogStatsDTO getStats() {
        List<Object[]> rows = repository.countByLevel();
        Map<String, Long> byLevel = rows.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1]
                ));

        long total  = byLevel.values().stream().mapToLong(Long::longValue).sum();
        long errors = byLevel.getOrDefault("ERROR", 0L);
        long warns  = byLevel.getOrDefault("WARN",  0L);
        long infos  = byLevel.getOrDefault("INFO",  0L);
        long debugs = byLevel.getOrDefault("DEBUG", 0L);

        return new LogStatsDTO(total, errors, warns, infos, debugs, byLevel);
    }
}

package com.vaultstream.infra.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import ch.qos.logback.core.AppenderBase;
import com.vaultstream.entities.logs.LogEntry;
import com.vaultstream.repositories.LogEntryRepository;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Logback appender that persists WARN and ERROR events to PostgreSQL.
 * The Spring context is injected only after it is fully refreshed to avoid
 * startup failures caused by early bean-factory access.
 */
@Component
public class DatabaseLogAppender extends AppenderBase<ILoggingEvent> {

    private static volatile LogEntryRepository repository;

    /** Called by Spring after the context is fully refreshed — safe to resolve beans here. */
    @EventListener(ContextRefreshedEvent.class)
    public void onContextRefreshed(ContextRefreshedEvent event) {
        ApplicationContext ctx = event.getApplicationContext();
        if (repository == null) {
            synchronized (DatabaseLogAppender.class) {
                if (repository == null) {
                    repository = ctx.getBean(LogEntryRepository.class);
                }
            }
        }
    }

    @Override
    protected void append(ILoggingEvent event) {
        LogEntryRepository repo = repository;
        if (repo == null || !event.getLevel().isGreaterOrEqual(Level.WARN)) {
            return;
        }
        try {
            repo.save(buildEntry(event));
        } catch (Exception ignored) {
            // never let a log-persistence failure crash the application
        }
    }

    private LogEntry buildEntry(ILoggingEvent event) {
        return LogEntry.builder()
                .timestamp(Instant.ofEpochMilli(event.getTimeStamp()))
                .level(event.getLevel().toString())
                .message(truncate(event.getFormattedMessage(), 500))
                .correlationId(event.getMDCPropertyMap().get("correlationId"))
                .serviceName(event.getMDCPropertyMap().getOrDefault("service_name", "vaultstream"))
                .loggerName(event.getLoggerName())
                .threadName(event.getThreadName())
                .stackTrace(formatThrowable(event.getThrowableProxy()))
                .build();
    }


    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }

    private String formatThrowable(IThrowableProxy proxy) {
        if (proxy == null) return null;
        StringBuilder sb = new StringBuilder();
        sb.append(proxy.getClassName()).append(": ").append(proxy.getMessage()).append("\n");
        for (StackTraceElementProxy step : proxy.getStackTraceElementProxyArray()) {
            sb.append("\tat ").append(step.getSTEAsString()).append("\n");
        }
        return sb.toString();
    }
}

package com.letroca.infra.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import ch.qos.logback.core.AppenderBase;
import com.letroca.entities.logs.LogEntry;
import com.letroca.repositories.LogEntryRepository;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Logback appender that persists WARN and ERROR events to PostgreSQL.
 * Uses lazy Spring context lookup to avoid circular dependency during startup.
 */
@Component
public class DatabaseLogAppender extends AppenderBase<ILoggingEvent> implements ApplicationContextAware {

    private static ApplicationContext applicationContext;
    private static volatile LogEntryRepository repository;

    @Override
    public void setApplicationContext(ApplicationContext ctx) throws BeansException {
        applicationContext = ctx;
    }

    @Override
    protected void append(ILoggingEvent event) {
        if (event.getLevel().isGreaterOrEqual(Level.WARN)) {
            getRepository().save(buildEntry(event));
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

    private LogEntryRepository getRepository() {
        if (repository == null) {
            synchronized (DatabaseLogAppender.class) {
                if (repository == null && applicationContext != null) {
                    repository = applicationContext.getBean(LogEntryRepository.class);
                }
            }
        }
        return repository;
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

CREATE TABLE log_entries
(
    id             BIGSERIAL PRIMARY KEY,
    timestamp      TIMESTAMPTZ  NOT NULL,
    level          VARCHAR(10)  NOT NULL,
    message        VARCHAR(500) NOT NULL,
    correlation_id VARCHAR(36),
    service_name   VARCHAR(100),
    logger_name    VARCHAR(200),
    thread_name    VARCHAR(100),
    stack_trace    TEXT
);

CREATE INDEX idx_log_level          ON log_entries (level);
CREATE INDEX idx_log_correlation_id ON log_entries (correlation_id);
CREATE INDEX idx_log_timestamp      ON log_entries (timestamp DESC);
CREATE INDEX idx_log_service        ON log_entries (service_name);

CREATE TABLE login_audit (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        TEXT,
    email          VARCHAR(255),
    ip_address     VARCHAR(45)  NOT NULL,
    user_agent     TEXT,
    status         VARCHAR(30)  NOT NULL,
    failure_reason VARCHAR(200),
    correlation_id VARCHAR(36),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_audit_user_id      ON login_audit (user_id);
CREATE INDEX idx_login_audit_created_at   ON login_audit (created_at DESC);
CREATE INDEX idx_login_audit_status       ON login_audit (status);
CREATE INDEX idx_login_audit_ip           ON login_audit (ip_address);

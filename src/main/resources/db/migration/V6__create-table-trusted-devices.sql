CREATE TABLE trusted_devices (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     TEXT         NOT NULL,
    device_name VARCHAR(200),
    user_agent  TEXT,
    ip_address  VARCHAR(45)  NOT NULL,
    last_used   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    trusted     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trusted_devices_user_id ON trusted_devices (user_id);
CREATE INDEX idx_trusted_devices_ip      ON trusted_devices (ip_address);

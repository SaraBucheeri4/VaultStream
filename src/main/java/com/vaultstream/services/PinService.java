package com.vaultstream.services;

import com.vaultstream.entities.users.User;
import com.vaultstream.infra.logging.SecurityEventLogger;
import com.vaultstream.infra.logging.SecurityEventLogger.EventType;
import com.vaultstream.infra.logging.SecurityEventLogger.Severity;
import com.vaultstream.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

@Service
public class PinService {

    private static final Logger log = LoggerFactory.getLogger(PinService.class);

    @Value("${pin.pepper:changeme-use-env-var}")
    private String pepper;

    private final UserRepository      userRepository;
    private final SecurityEventLogger eventLogger;

    public PinService(UserRepository userRepository, SecurityEventLogger eventLogger) {
        this.userRepository = userRepository;
        this.eventLogger    = eventLogger;
    }

    public void setupPin(User user, String rawPin) {
        String hash = BCrypt.hashpw(rawPin + pepper, BCrypt.gensalt());
        user.setPinHash(hash);
        userRepository.save(user);
        log.info("PIN set up for userId={}", user.getId());
        eventLogger.emit(EventType.PIN_SETUP, user.getId(), null, Severity.LOW);
    }

    public boolean verifyPin(User user, String rawPin, String ip) {
        if (user.getPinHash() == null) {
            throw new IllegalStateException("PIN not configured for this account");
        }
        boolean match = BCrypt.checkpw(rawPin + pepper, user.getPinHash());
        if (!match) {
            log.warn("PIN verification failed for userId={} ip={}", user.getId(), ip);
            eventLogger.emit(EventType.PIN_VERIFY_FAILED, user.getId(), ip, Severity.MEDIUM);
        }
        return match;
    }

    public boolean hasPin(User user) {
        return user.getPinHash() != null;
    }
}

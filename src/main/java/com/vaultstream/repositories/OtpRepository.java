package com.vaultstream.repositories;

import com.vaultstream.entities.otp.OTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends JpaRepository<OTP, Long> {
}

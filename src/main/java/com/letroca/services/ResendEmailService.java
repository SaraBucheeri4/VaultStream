package com.letroca.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ResendEmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api.key}")
    private String apiKey;

    @Value("${resend.from.email}")
    private String fromEmail;

    @Value("${resend.from.name}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String html = buildEmailHtml(otpCode, purpose);

        Map<String, Object> body = Map.of(
                "from", fromName + " <" + fromEmail + ">",
                "to", new String[]{toEmail},
                "subject", "Your VaultStream verification code",
                "html", html
        );

        restTemplate.postForObject(RESEND_API_URL, new HttpEntity<>(body, headers), Map.class);
    }

    private String buildEmailHtml(String code, String purpose) {
        return """
                <div style="font-family:sans-serif;max-width:480px;margin:auto">
                  <h2>VaultStream — Verification Code</h2>
                  <p>Your one-time code for <strong>%s</strong>:</p>
                  <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f4f4f4;border-radius:8px;text-align:center">%s</div>
                  <p style="color:#888;font-size:12px">This code expires in 5 minutes. Do not share it with anyone.</p>
                </div>
                """.formatted(purpose.replace("_", " ").toLowerCase(), code);
    }
}

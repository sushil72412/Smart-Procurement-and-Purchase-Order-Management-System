package com.epms.controller;

import com.epms.service.EmailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EmailTestController {

    private final EmailService emailService;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/test-email")
    public String sendEmail() {

        emailService.sendEmail(
                "sushilkgaya01@gmail.com",
                "Enterprise Procurement System",
                "Congratulations! Your email configuration is working successfully."
        );

        return "Email Sent Successfully!";
    }
}
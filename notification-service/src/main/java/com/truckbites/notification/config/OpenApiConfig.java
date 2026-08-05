package com.truckbites.notification.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Notification Service API",
                version = "1.0.0",
                description = "Event-driven notification service for TruckBites. This service consumes RabbitMQ events (order.placed, order.paid) and sends transactional emails via Brevo SMTP. It has no REST endpoints for core functionality.",
                contact = @Contact(name = "TruckBites Team", url = "https://github.com/Saddalayogesh/truckbites"),
                license = @License(name = "MIT", url = "https://opensource.org/licenses/MIT")
        ),
        servers = {
                @Server(url = "http://localhost:8087", description = "Local development")
        }
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer"
)
public class OpenApiConfig {
}

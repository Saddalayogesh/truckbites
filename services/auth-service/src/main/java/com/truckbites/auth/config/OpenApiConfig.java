package com.truckbites.auth.config;

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
                title = "TruckBites Auth Service",
                description = "Authentication and authorization service for the TruckBites platform. " +
                        "Provides user registration, login, and JWT token generation.",
                version = "1.0.0",
                contact = @Contact(
                        name = "TruckBites Team",
                        email = "support@truckbites.com"
                ),
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8081", description = "Local development server"),
                @Server(url = "https://api.truckbites.com/auth", description = "Production server")
        }
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Enter your JWT token to authorize requests. " +
                "Obtain a token by calling POST /api/auth/login or POST /api/auth/register."
)
public class OpenApiConfig {
}

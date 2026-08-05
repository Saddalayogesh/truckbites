package com.truckbites.menu.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "TruckBites Menu Service",
                description = "Menu and inventory management service. Handles menu item CRUD, " +
                        "inventory tracking, and availability management for food trucks.",
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
                @Server(url = "http://localhost:8084", description = "Local development server"),
                @Server(url = "https://api.truckbites.com/menu", description = "Production server")
        },
        security = {
                @SecurityRequirement(name = "Bearer Authentication")
        }
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Enter your JWT token to authorize requests. " +
                "Obtain a token from the Auth Service (POST /api/auth/login)."
)
public class OpenApiConfig {
}

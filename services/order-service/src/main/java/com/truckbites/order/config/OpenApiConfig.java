package com.truckbites.order.config;

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
                title = "TruckBites Order Service",
                description = "Order management service. Handles order placement, status tracking, " +
                        "order history for customers, and order management for vendors. " +
                        "Integrates with Menu Service for item validation and Truck Service for ownership checks.",
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
                @Server(url = "http://localhost:8085", description = "Local development server"),
                @Server(url = "https://api.truckbites.com/orders", description = "Production server")
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

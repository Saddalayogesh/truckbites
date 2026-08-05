package com.truckbites.analytics.config;

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
                title = "TruckBites Analytics Service",
                description = "Read-only analytics and aggregation queries against order_db. " +
                        "Provides daily sales, top-selling items, and order status summaries per truck. " +
                        "All endpoints are VENDOR-only and validate truck ownership via Feign call to truck-service.",
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
                @Server(url = "http://localhost:8088", description = "Local development server"),
                @Server(url = "https://api.truckbites.com/analytics", description = "Production server")
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

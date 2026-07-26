package com.truckbites.truck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = "com.truckbites")
@EnableDiscoveryClient
public class TruckServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TruckServiceApplication.class, args);
    }
}

package com.letsgo.devcommunity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication
public class DevCommunityBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(DevCommunityBackendApplication.class, args);
	}
}

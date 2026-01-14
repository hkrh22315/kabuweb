package com.kabu.kabuweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KabuwebApplication {

	public static void main(String[] args) {
		System.setProperty("http.agent", "Mozilla/5.0 (Windows NT 10/0; Win64; x64) AppleWebkit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

		SpringApplication.run(KabuwebApplication.class, args);
	}

}

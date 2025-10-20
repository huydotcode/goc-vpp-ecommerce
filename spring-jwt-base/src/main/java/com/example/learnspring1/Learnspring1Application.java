package com.example.learnspring1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class Learnspring1Application {

	public static void main(String[] args) {
		SpringApplication.run(Learnspring1Application.class, args);
	}

	// Controller bên trong class này (có thể tạo file riêng cũng được)
	@RestController
	class HelloController {

		@GetMapping("/")
		public String hello() {
			return "Hello World hihi haha";
		}
	}
}

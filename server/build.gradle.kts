plugins {
	java
	id("org.springframework.boot") version "3.5.4"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"
description = "Demo project for Spring Boot"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}



repositories {
	mavenCentral()
}

dependencies {	
	// Swagger OpenAPI UI - phiên bản 2.7.0 hỗ trợ Spring Boot 3.5.x
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.7.0")
	implementation("org.springframework.boot:spring-boot-starter-web")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa") 
	implementation("org.mariadb.jdbc:mariadb-java-client:3.4.0")
	implementation("org.springframework.boot:spring-boot-starter-security")
	// https://mvnrepository.com/artifact/org.projectlombok/lombok
	compileOnly("org.projectlombok:lombok:1.18.36")
	annotationProcessor("org.projectlombok:lombok:1.18.36")
	  // Validation (để Spring quản lý phiên bản, bỏ số version)
    implementation("org.springframework.boot:spring-boot-starter-validation")


	implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
	
	// SpringFilter for JPA filtering
	implementation("com.turkraft:spring-filter:2.1.6")

	// https://mvnrepository.com/artifact/com.cloudinary/cloudinary-http44
	implementation("com.cloudinary:cloudinary-http44:1.39.0")

	// OkHttp for ChromaDB REST API calls
	implementation("com.squareup.okhttp3:okhttp:4.12.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
}
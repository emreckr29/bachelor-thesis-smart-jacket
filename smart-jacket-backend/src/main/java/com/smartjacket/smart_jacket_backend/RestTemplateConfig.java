package com.smartjacket.smart_jacket_backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration // Bu sınıfın bir yapılandırma sınıfı olduğunu belirtir
public class RestTemplateConfig {

    @Bean // Spring konteynerine RestTemplate bean'i ekler
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
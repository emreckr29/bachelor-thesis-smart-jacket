package com.smartjacket.smart_jacket_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200") // Angular uygulamanızın adresinden gelen isteklere izin verir
public class MovementController {

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate;

    public MovementController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // Angular'dan gelen hareket verisini alacak endpoint
    // GÜNCELLEME: Angular'dan artık { "movement_data": ..., "movement_type": "...", "model_name": "..." } bekleniyor
    @PostMapping("/predict")
    public ResponseEntity<?> predictMovement(@RequestBody Map<String, Object> requestBody) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Angular'dan gelen requestBody'i (artık model_name'i de içeriyor) doğrudan Python'a iletiyoruz
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // GÜNCELLEME: Python API'sinin endpoint'i '/predict' olarak değiştirildi
            String pythonApiEndpoint = mlServiceUrl + "/predict";

            System.out.println("Forwarding request to Python API: " + pythonApiEndpoint);
            System.out.println("Forwarding data: " + requestBody);

            // Python'dan gelen yanıtı JSON olarak al
            ResponseEntity<JsonNode> pythonResponse = restTemplate.postForEntity(
                    pythonApiEndpoint, entity, JsonNode.class
            );

            // Python'dan gelen yanıtı doğrudan Angular'a geri dön
            return ResponseEntity.status(pythonResponse.getStatusCode()).body(pythonResponse.getBody());

        } catch (HttpClientErrorException e) {
            // Python tarafından dönen HTTP hatalarını yakala
            System.err.println("Error from Python ML Service: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            // Hata mesajını JSON formatında döndürmek daha iyi bir pratiktir
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            // Diğer genel hataları yakala
            System.err.println("Unexpected error during prediction: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\": \"Internal Server Error: " + e.getMessage() + "\"}");
        }
    }
}

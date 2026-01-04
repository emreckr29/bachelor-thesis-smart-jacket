package com.smartjacket.smart_jacket_backend.dto;

import lombok.Data;

@Data
public class CompleteSessionRequest {
    // Frontend'den gelen tüm seans sonuçlarını JSON formatında bir String olarak alacağız.
    // Örn: "{ \"totalReps\": 10, \"averageScore\": 92.5, \"reps\": [{\"rep\":1, \"score\":95}, ...] }"
    private String results;
}
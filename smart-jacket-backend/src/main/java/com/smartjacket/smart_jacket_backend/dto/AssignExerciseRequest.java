package com.smartjacket.smart_jacket_backend.dto;

import lombok.Data;

@Data
public class AssignExerciseRequest {
    private Long exerciseId;
    // İleride tekrar, set sayısı gibi bilgiler de eklenebilir.
}
package com.smartjacket.smart_jacket_backend.dto;

import lombok.Data;

@Data
public class PatientProfileDTO {
    private Long id;
    private String email;
    private PhysiotherapistInfoDTO physiotherapist; // Bu alan null olabilir
}
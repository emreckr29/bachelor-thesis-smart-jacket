package com.smartjacket.smart_jacket_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private Long id;
    private String email;
    // İleride hastanın adı, soyadı gibi alanları da ekleyebiliriz.
}
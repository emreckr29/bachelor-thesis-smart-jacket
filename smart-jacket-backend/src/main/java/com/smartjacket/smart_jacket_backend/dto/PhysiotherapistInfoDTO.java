package com.smartjacket.smart_jacket_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhysiotherapistInfoDTO {
    private Long id;
    private String email;
    // İleride isim, soyisim gibi alanlar eklenebilir
}
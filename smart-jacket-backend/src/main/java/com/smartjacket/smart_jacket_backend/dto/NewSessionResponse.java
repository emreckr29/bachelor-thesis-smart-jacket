package com.smartjacket.smart_jacket_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor // Constructor'ı otomatik oluşturur
public class NewSessionResponse {
    private Long sessionId;
}
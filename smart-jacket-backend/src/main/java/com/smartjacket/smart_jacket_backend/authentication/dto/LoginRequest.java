package com.smartjacket.smart_jacket_backend.authentication.dto;

import lombok.Data;
@Data
public class LoginRequest {
    private String email;
    private String password;
}
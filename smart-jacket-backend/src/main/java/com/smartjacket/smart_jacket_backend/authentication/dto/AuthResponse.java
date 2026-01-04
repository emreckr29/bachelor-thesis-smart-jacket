package com.smartjacket.smart_jacket_backend.authentication.dto;
import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Role role;

}
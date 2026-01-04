package com.smartjacket.smart_jacket_backend.authentication.dto;

import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import lombok.Data;
@Data
public class SignUpRequest {
    private String email;
    private String password;
    private Role role;
}
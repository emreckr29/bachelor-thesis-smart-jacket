package com.smartjacket.smart_jacket_backend.controller;
// src/main/java/com/example/authservice/controller/AuthController.java

import com.smartjacket.smart_jacket_backend.authentication.dto.AuthResponse;
import com.smartjacket.smart_jacket_backend.authentication.dto.LoginRequest;
import com.smartjacket.smart_jacket_backend.authentication.dto.SignUpRequest;
import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import com.smartjacket.smart_jacket_backend.authentication.models.User;
import com.smartjacket.smart_jacket_backend.authentication.repository.UserRepository;
import com.smartjacket.smart_jacket_backend.authentication.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest signUpRequest) {
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists!");
        }

        User user = new User();
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole(signUpRequest.getRole());
        if (signUpRequest.getRole() == Role.PHYSIOTHERAPIST) {
            String code = "PHY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            // Teorik olarak çok düşük bir ihtimal de olsa, kodun benzersizliğini garantile
            while(userRepository.findByInvitationCode(code).isPresent()){
                code = "PHY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }
            user.setInvitationCode(code);
        }
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IllegalStateException("Login sonrası kullanıcı bulunamadı."));

        // Auth başarılı, token üret
        final String token = jwtUtil.generateToken(loginRequest.getEmail());

        return ResponseEntity.ok(new AuthResponse(token, user.getRole()));
    }
}
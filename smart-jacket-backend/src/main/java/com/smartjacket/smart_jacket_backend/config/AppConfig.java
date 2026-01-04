package com.smartjacket.smart_jacket_backend.config;

import com.smartjacket.smart_jacket_backend.authentication.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import java.util.ArrayList;
import java.util.Collections;
import org.springframework.security.core.authority.SimpleGrantedAuthority; // <-- Bunu import et


@Configuration
@RequiredArgsConstructor
public class AppConfig {

    private final UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            var user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            // --- GÜNCELLEME ---
            // Kullanıcının rolünü alıp Spring Security'nin anlayacağı bir "Yetki" listesine çevir.
            var authorities = Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()));

            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    authorities // <-- Boş liste yerine, kullanıcının gerçek yetkilerini ver
            );
        };
    }
}
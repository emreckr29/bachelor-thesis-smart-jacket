package com.smartjacket.smart_jacket_backend.authentication.repository;


import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import com.smartjacket.smart_jacket_backend.authentication.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List; // <-- Bunu import et

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.patients WHERE u.email = :email")
    Optional<User> findByEmailWithPatients(@Param("email") String email);

    // --- YENİ METOT ---
    /**
     * Verilen 'physiotherapist' ID'sine sahip olan tüm 'PATIENT' rolündeki
     * kullanıcıları bulur. Spring Data JPA bu metot isminden doğru sorguyu kendi üretir.
     */
    List<User> findByPhysiotherapistIdAndRole(Long physioId, Role role);

    Optional<User> findByInvitationCode(String code);

}
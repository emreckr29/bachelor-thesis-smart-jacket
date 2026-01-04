package com.smartjacket.smart_jacket_backend.controller;

import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import com.smartjacket.smart_jacket_backend.dto.*;
import com.smartjacket.smart_jacket_backend.authentication.models.User;
import com.smartjacket.smart_jacket_backend.models.Exercise;
import com.smartjacket.smart_jacket_backend.models.ExerciseSession;
import com.smartjacket.smart_jacket_backend.repository.ExerciseRepository;
import com.smartjacket.smart_jacket_backend.repository.ExerciseSessionRepository;
import com.smartjacket.smart_jacket_backend.authentication.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable; // <-- Ekle
import org.springframework.web.bind.annotation.PostMapping; // <-- Ekle
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PATIENT')") // Bu controller'a sadece PATIENT rolü erişebilir.
public class PatientController {

    private final UserRepository userRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseRepository exerciseRepository; // <-- ExerciseRepository'yi ekle


    /**
     * Giriş yapmış hastaya atanmış ve henüz tamamlanmamış egzersizleri listeler.
     */
    @GetMapping("/my-assigned-exercises")
    public ResponseEntity<List<SessionDetailDTO>> getMyAssignedExercises(Principal principal) {
        User patient = findUserByPrincipal(principal);

        List<SessionDetailDTO> assignedExercises = exerciseSessionRepository.findByPatientIdAndResultsIsNull(patient.getId())
                .stream()
                .map(session -> new SessionDetailDTO(
                        session.getId(),
                        session.getExercise().getName(),
                        session.getExercise().getDisplayName(), // <-- Görünen Ad
                        session.getSessionDate(), // Bu henüz null olacak
                        session.getResults(),     // Bu da null olacak
                        session.getFeedback()     // Bu da null olacak
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(assignedExercises);
    }

    @PostMapping("/my-sessions/{sessionId}/complete")
    public ResponseEntity<?> completeSession(
            @PathVariable Long sessionId,
            @RequestBody CompleteSessionRequest request,
            Principal principal) {

        // 1. Seansı veritabanından bul
        ExerciseSession session = exerciseSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Seans bulunamadı: " + sessionId));

        // 2. Güvenlik: Bu seans, giriş yapmış hastaya mı ait?
        checkSessionBelongsToPatient(principal, session);

        // 3. Seans bilgilerini güncelle
        session.setResults(request.getResults());
        session.setSessionDate(LocalDateTime.now()); // Tamamlanma tarihini şimdi olarak ayarla

        // 4. Güncellenmiş seansı kaydet
        exerciseSessionRepository.save(session);

        return ResponseEntity.ok("Seans başarıyla tamamlandı.");
    }

    @GetMapping("/my-sessions/{sessionId}")
    public ResponseEntity<SessionDetailDTO> getSessionDetails(@PathVariable Long sessionId, Principal principal) {
        // 1. Seansı veritabanından bul
        ExerciseSession session = exerciseSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Seans bulunamadı: " + sessionId));

        // 2. Güvenlik: Bu seans, giriş yapmış hastaya mı ait?
        checkSessionBelongsToPatient(principal, session);

        // 3. Seans bilgilerini DTO'ya çevir ve frontend'e gönder
        SessionDetailDTO dto = new SessionDetailDTO(
                session.getId(),
                session.getExercise().getName(),
                session.getExercise().getDisplayName(),
                session.getSessionDate(),
                session.getResults(),
                session.getFeedback()
        );

        return ResponseEntity.ok(dto);
    }

    /**
     * Giriş yapmış hastanın tamamladığı tüm egzersiz seanslarının geçmişini listeler.
     */
    @GetMapping("/my-history")
    public ResponseEntity<List<SessionDetailDTO>> getMyHistory(Principal principal) {
        User patient = findUserByPrincipal(principal);

        List<SessionDetailDTO> history = exerciseSessionRepository.findByPatientIdAndResultsIsNotNullOrderBySessionDateDesc(patient.getId())
                .stream()
                .map(session -> new SessionDetailDTO(
                        session.getId(),
                        session.getExercise().getName(),
                        session.getExercise().getDisplayName(),
                        session.getSessionDate(),
                        session.getResults(),
                        session.getFeedback()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    // --- YENİ ENDPOINT ---
    @PostMapping("/link-physio")
    public ResponseEntity<?> linkToPhysiotherapist(@RequestBody LinkPhysioRequest request, Principal principal) {
        // 1. Giriş yapmış olan hastayı bul
        User patient = findUserByPrincipal(principal);

        // 2. Gelen davet kodu ile fizyoterapisti bul
        User physiotherapist = userRepository.findByInvitationCode(request.getInvitationCode())
                .orElseThrow(() -> new RuntimeException("Geçersiz davet kodu."));

        // 3. Bulunan kullanıcının rolünün fizyoterapist olduğunu doğrula
        if (physiotherapist.getRole() != Role.PHYSIOTHERAPIST) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Bu kod bir fizyoterapiste ait değil.");
        }

        // 4. Hastanın fizyoterapist alanını güncelle ve kaydet
        patient.setPhysiotherapist(physiotherapist);
        userRepository.save(patient);

        return ResponseEntity.ok("Fizyoterapist başarıyla bağlandı.");
    }

    @GetMapping("/me")
    public ResponseEntity<PatientProfileDTO> getMyProfile(Principal principal) {
        // Giriş yapmış hastayı bul
        User patient = findUserByPrincipal(principal);

        PatientProfileDTO profileDTO = new PatientProfileDTO();
        profileDTO.setId(patient.getId());
        profileDTO.setEmail(patient.getEmail());

        // Hastanın bir fizyoterapisti varsa, bilgilerini DTO'ya ekle
        if (patient.getPhysiotherapist() != null) {
            User physio = patient.getPhysiotherapist();
            profileDTO.setPhysiotherapist(new PhysiotherapistInfoDTO(physio.getId(), physio.getEmail()));
        }

        return ResponseEntity.ok(profileDTO);
    }

    @PostMapping("/start-free-exercise")
    // --- DÖNÜŞ TİPİNİ GÜNCELLE ---
    public ResponseEntity<NewSessionResponse> startFreeExercise(@RequestBody StartExerciseRequest request, Principal principal) {
        User patient = findUserByPrincipal(principal);
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Egzersiz bulunamadı: " + request.getExerciseId()));

        ExerciseSession newSession = new ExerciseSession();
        newSession.setPatient(patient);
        newSession.setExercise(exercise);
        newSession.setAssigned(false);

        ExerciseSession savedSession = exerciseSessionRepository.save(newSession);

        // --- DÖNÜŞÜ GÜNCELLE ---
        // Tam nesne yerine sadece yeni seansın ID'sini içeren DTO'yu dön.
        NewSessionResponse response = new NewSessionResponse(savedSession.getId());

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Hastanın egzersiz tamamlama, geçmişini görme gibi diğer endpoint'leri
    // gelecekte buraya eklenecek.

    /**
     * Principal nesnesinden User'ı bulan yardımcı metot.
     */
    private User findUserByPrincipal(Principal principal) {
        String email = principal.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + email));
    }

    private void checkSessionBelongsToPatient(Principal principal, ExerciseSession session) {
        User patient = findUserByPrincipal(principal);
        if (!session.getPatient().getId().equals(patient.getId())) {
            throw new AccessDeniedException("Bu seansa erişim yetkiniz yok.");
        }
    }
}
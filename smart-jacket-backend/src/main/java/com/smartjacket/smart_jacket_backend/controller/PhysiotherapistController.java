package com.smartjacket.smart_jacket_backend.controller;

import com.smartjacket.smart_jacket_backend.authentication.models.Role;
import com.smartjacket.smart_jacket_backend.dto.AssignExerciseRequest;
import com.smartjacket.smart_jacket_backend.dto.FeedbackRequest;
import com.smartjacket.smart_jacket_backend.dto.PatientDTO;
import com.smartjacket.smart_jacket_backend.dto.SessionDetailDTO;
import com.smartjacket.smart_jacket_backend.models.Exercise;
import com.smartjacket.smart_jacket_backend.models.ExerciseSession;
import com.smartjacket.smart_jacket_backend.authentication.models.User;
import com.smartjacket.smart_jacket_backend.repository.ExerciseRepository;
import com.smartjacket.smart_jacket_backend.repository.ExerciseSessionRepository;
import com.smartjacket.smart_jacket_backend.authentication.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/physio")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PHYSIOTHERAPIST')") // Bu controller'a sadece PHYSIOTHERAPIST rolü erişebilir.
public class PhysiotherapistController {

    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;

    /**
     * Giriş yapmış fizyoterapiste bağlı olan tüm hastaların listesini döner.
     */
    @GetMapping("/patients")
    public ResponseEntity<List<PatientDTO>> getMyPatients(Principal principal) {
        // 1. Giriş yapmış olan fizyoterapisti bul.
        User physiotherapist = findUserByPrincipal(principal);

        // --- MANTIĞI GÜNCELLE ---
        // 2. Artık physiotherapist nesnesinin içindeki listeye değil,
        //    doğrudan repository'e fizyoterapistin ID'sini vererek hastaları sorgula.
        List<User> patients = userRepository.findByPhysiotherapistIdAndRole(physiotherapist.getId(), Role.PATIENT);

        // 3. Bulunan hasta listesini DTO'ya çevir.
        List<PatientDTO> patientDTOs = patients.stream()
                .map(patient -> new PatientDTO(patient.getId(), patient.getEmail()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(patientDTOs);
    }

    /**
     * Belirli bir hastanın tüm egzersiz seanslarının geçmişini döner.
     */
    @GetMapping("/patients/{patientId}/sessions")
    public ResponseEntity<List<SessionDetailDTO>> getPatientSessions(@PathVariable Long patientId, Principal principal) {
        checkPatientBelongsToPhysio(principal, patientId); // Güvenlik kontrolü

        List<SessionDetailDTO> sessions = exerciseSessionRepository.findByPatientIdOrderBySessionDateDesc(patientId).stream()
                .map(session -> new SessionDetailDTO(
                        session.getId(),
                        session.getExercise().getName(),
                        session.getExercise().getDisplayName(),
                        session.getSessionDate(),
                        session.getResults(),
                        session.getFeedback()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(sessions);
    }

    /**
     * Belirli bir hastaya yeni bir egzersiz atar.
     */
    @PostMapping("/patients/{patientId}/assign")
    public ResponseEntity<SessionDetailDTO> assignExercise(@PathVariable Long patientId, @RequestBody AssignExerciseRequest request, Principal principal) {
        User physiotherapist = findUserByPrincipal(principal);
        checkPatientBelongsToPhysio(principal, patientId); // Güvenlik kontrolü

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Hasta bulunamadı: " + patientId));
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Egzersiz bulunamadı: " + request.getExerciseId()));

        ExerciseSession newSession = new ExerciseSession();
        newSession.setPatient(patient);
        newSession.setExercise(exercise);
        newSession.setAssigned(true); // Bu bir atama olduğu için true
        // sessionDate, results, feedback bu aşamada null olacak

        ExerciseSession savedSession = exerciseSessionRepository.save(newSession);

        SessionDetailDTO responseDto = new SessionDetailDTO(
                savedSession.getId(),
                savedSession.getExercise().getName(),
                savedSession.getExercise().getDisplayName(),
                null, null, null
        );

        return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
    }

    /**
     * Tamamlanmış bir egzersiz seansına geri bildirim (feedback) ekler.
     */
    @PostMapping("/sessions/{sessionId}/feedback")
    public ResponseEntity<SessionDetailDTO> giveFeedback(@PathVariable Long sessionId, @RequestBody FeedbackRequest request, Principal principal) {
        ExerciseSession session = exerciseSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Seans bulunamadı: " + sessionId));

        // Güvenlik: Bu seansın hastası, giriş yapan fizyoterapiste mi ait?
        checkPatientBelongsToPhysio(principal, session.getPatient().getId());

        session.setFeedback(request.getFeedback());
        ExerciseSession updatedSession = exerciseSessionRepository.save(session);

        SessionDetailDTO responseDto = new SessionDetailDTO(
                updatedSession.getId(),
                updatedSession.getExercise().getName(),
                updatedSession.getExercise().getDisplayName(),
                updatedSession.getSessionDate(),
                updatedSession.getResults(),
                updatedSession.getFeedback()
        );

        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> getMyProfile(Principal principal) {
        User physiotherapist = findUserByPrincipal(principal);
        Map<String, String> profile = Map.of(
                "email", physiotherapist.getEmail(),
                "invitationCode", physiotherapist.getInvitationCode()
        );
        return ResponseEntity.ok(profile);
    }


    // --- YARDIMCI METOTLAR ---

    /**
     * Principal nesnesinden User'ı bulan yardımcı metot.
     */
    private User findUserByPrincipal(Principal principal) {
        String email = principal.getName();
        // findByEmail yerine, hastaları da getiren yeni metodumuzu kullanıyoruz.
        return userRepository.findByEmailWithPatients(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı (Principal) bulunamadı: " + email));
    }

    /**
     * Bir hastanın, giriş yapmış olan fizyoterapiste ait olup olmadığını kontrol eden güvenlik metodu.
     * Eğer hastası değilse, AccessDeniedException fırlatır.
     */
    private void checkPatientBelongsToPhysio(Principal principal, Long patientId) {
        // 1. Giriş yapmış fizyoterapisti bul
        User physiotherapist = findUserByPrincipal(principal);

        // 2. Kontrol edilecek hastayı ID'si ile veritabanından bul
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Kontrol için hasta bulunamadı: " + patientId));

        // 3. Kontrol et: Hastanın bir fizyoterapisti var mı? VE Bu fizyoterapist, giriş yapmış olan kişi mi?
        if (patient.getPhysiotherapist() == null || !patient.getPhysiotherapist().getId().equals(physiotherapist.getId())) {
            // Eğer hastanın fizyoterapisti yoksa VEYA hastanın fizyoterapistinin ID'si,
            // giriş yapan fizyoterapistin ID'si ile eşleşmiyorsa, yetkisi yok demektir.
            throw new AccessDeniedException("Bu hastaya erişim yetkiniz yok.");
        }
    }
}
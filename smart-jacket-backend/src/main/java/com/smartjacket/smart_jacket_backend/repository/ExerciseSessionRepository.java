package com.smartjacket.smart_jacket_backend.repository;

import com.smartjacket.smart_jacket_backend.models.ExerciseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {

    /**
     * Belirli bir hastanın (patientId ile) tüm egzersiz seanslarını
     * seans tarihine göre azalan sırada (en yeniden en eskiye) bulan bir metot.
     *
     * Spring Data JPA, metot isminden sorguyu otomatik olarak oluşturur:
     * "FindBy" -> Sorgu başlangıcı
     * "PatientId" -> 'patient' alanının 'id'sine göre filtrele
     * "OrderBySessionDateDesc" -> 'sessionDate' alanına göre azalan sırala
     */
    List<ExerciseSession> findByPatientIdOrderBySessionDateDesc(Long patientId);

    // --- YENİ METOT ---
    /**
     * Belirli bir hastaya atanmış VE henüz tamamlanmamış (results alanı boş olan)
     * tüm egzersiz seanslarını bulur.
     */
    List<ExerciseSession> findByPatientIdAndResultsIsNull(Long patientId);
    // --- YENİ METOT ---
    /**
     * Belirli bir hastanın tamamlanmış (results alanı dolu olan) tüm seanslarını
     * tarihe göre azalan sırada bulur.
     */
    List<ExerciseSession> findByPatientIdAndResultsIsNotNullOrderBySessionDateDesc(Long patientId);

}
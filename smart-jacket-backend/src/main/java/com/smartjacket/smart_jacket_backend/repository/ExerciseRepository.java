package com.smartjacket.smart_jacket_backend.repository;

import com.smartjacket.smart_jacket_backend.models.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    // JpaRepository bize şu metotları otomatik olarak sağlar:
    // - save() (yeni egzersiz ekleme veya mevcut olanı güncelleme)
    // - findById() (tek bir egzersizi ID ile bulma)
    // - findAll() (tüm egzersizleri listeleme)
    // - deleteById() (bir egzersizi silme)
    // Bu yüzden şimdilik içine özel bir metot yazmamıza gerek yok.
}
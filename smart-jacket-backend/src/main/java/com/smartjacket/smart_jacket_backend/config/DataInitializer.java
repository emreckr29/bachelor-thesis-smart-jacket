package com.smartjacket.smart_jacket_backend.config;

import com.smartjacket.smart_jacket_backend.models.Exercise;
import com.smartjacket.smart_jacket_backend.repository.ExerciseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ExerciseRepository exerciseRepository) {
        return args -> {
            // Veritabanında hiç egzersiz yoksa, örnek egzersizleri ekle
            if (exerciseRepository.count() == 0) {
                // ...
                Exercise ex1 = new Exercise();
                ex1.setName("ShoulderFlexion"); // <-- Sistem Adı
                ex1.setDisplayName("Shoulder Flexion"); // <-- Görünen Ad
                ex1.setDescription("Sırt üstü yatarken bir dizinizi bükerek...");
                ex1.setVideoUrl("...");
                exerciseRepository.save(ex1);

                Exercise ex2 = new Exercise();
                ex2.setName("ShoulderAbduction"); // <-- Sistem Adı
                ex2.setDisplayName("Shoulder Abduction"); // <-- Görünen Ad
                ex2.setDescription("Sırt üstü yatın, dizler bükülü...");
                ex2.setVideoUrl("...");
                exerciseRepository.save(ex2);

                Exercise ex3 = new Exercise();
                ex3.setName("SitAndReach"); // <-- Sistem Adı
                ex3.setDisplayName("Sit and Reach"); // <-- Görünen Ad
                ex3.setDescription("Bir duvarın önünde durun...");
                ex3.setVideoUrl("...");
                exerciseRepository.save(ex3);
                // ...
            }
        };
    }
}
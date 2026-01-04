package com.smartjacket.smart_jacket_backend.models;

import com.smartjacket.smart_jacket_backend.authentication.models.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class ExerciseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User patient; // Bu seansı yapan hasta

    @ManyToOne
    private Exercise exercise; // Yapılan egzersiz

    private LocalDateTime sessionDate; // Egzersizin yapıldığı tarih

    @Column(length = 2000)
    private String results; // Hastanın girdiği sonuçlar (örn: "10 tekrar, 3 set, zorlanmadım")

    @Column(length = 2000)
    private String feedback; // Fizyoterapistin bu seansa özel yorumu

    private boolean isAssigned; // Fizyoterapist tarafından mı atandı, yoksa serbest çalışma mı?
}
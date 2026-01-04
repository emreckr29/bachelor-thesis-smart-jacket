package com.smartjacket.smart_jacket_backend.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name; // Sistem adı, örn: "ShoulderAbduction"

    @Column(nullable = false)
    private String displayName; // Arayüzde görünecek ad, örn: "Omuz Abdüksiyonu"

    @Column(length = 1000)
    private String description;
    private String videoUrl; // Egzersiz videosu linki
    // İstersek zorluk seviyesi, hedef bölge gibi alanlar da ekleyebiliriz
}
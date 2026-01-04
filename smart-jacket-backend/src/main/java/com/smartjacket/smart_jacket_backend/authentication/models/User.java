package com.smartjacket.smart_jacket_backend.authentication.models;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "users") // Tablo adını 'users' olarak belirledik
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING) // Enum'ı veritabanına String olarak kaydet (PATIENT, PHYSIOTHERAPIST)
    @Column(nullable = false)
    private Role role;


    @Column(unique = true) // Bu kodun her kullanıcı için benzersiz olmasını sağlar
    private String invitationCode;

    // --- YENİ İLİŞKİ ---
    // Birçok hasta (@ManyToOne) tek bir fizyoterapiste bağlı olabilir.
    @ManyToOne(fetch = FetchType.LAZY) // Gerektiğinde yüklemesi için LAZY
    @JoinColumn(name = "physiotherapist_id") // users tablosunda bu isimde bir kolon oluşturacak
    private User physiotherapist;

    // --- YENİ İLİŞKİ ---
    // Bir fizyoterapistin birden çok hastası olabilir (@OneToMany)
    @OneToMany(mappedBy = "physiotherapist") // İlişkinin sahibinin diğer taraftaki "physiotherapist" alanı olduğunu belirtir
    @JsonIgnore // Bu alanı JSON'a çevirirken sonsuz döngüye girmemesi için
    private Set<User> patients = new HashSet<>();
}
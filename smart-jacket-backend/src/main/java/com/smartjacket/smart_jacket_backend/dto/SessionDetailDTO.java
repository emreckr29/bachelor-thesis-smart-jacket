package com.smartjacket.smart_jacket_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailDTO {
    private Long id;
    private String exerciseName; // Bu artık sistem adı olacak (örn: ShoulderAbduction)
    private String exerciseDisplayName; // Bu da görünen ad olacak (örn: Shoulder Abduction)
    private LocalDateTime sessionDate;
    private String results;
    private String feedback;
}
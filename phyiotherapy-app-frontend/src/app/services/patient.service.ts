import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface corresponding to SessionDetailDTO in the backend
export interface AssignedExercise {
  id: number; // This is actually the session ID
  exerciseName: string;
  exerciseDisplayName: string; // Display Name (Shoulder Abduction)
}

// SessionDetails interface can be used for both new and old methods.
export interface SessionDetails {
  id: number;
  exerciseName: string;
  exerciseDisplayName: string;
  sessionDate: string | null;
  results: string | null;
  feedback: string | null;
}

// Interface to hold physiotherapist information
export interface PhysiotherapistInfo {
  id: number;
  email: string;
}

// Interface to hold patient profile information
export interface PatientProfile {
  id: number;
  email: string;
  physiotherapist: PhysiotherapistInfo | null; // can be null
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8080/api/patient';

  constructor(private http: HttpClient) { }

  /**
   * Retrieves the assigned exercises of the logged-in patient.
   */
  // Let's update this method to return SessionDetails[]
  getMyAssignedExercises(): Observable<SessionDetails[]> {
    return this.http.get<SessionDetails[]>(`${this.apiUrl}/my-assigned-exercises`);
  }

  getSessionDetails(sessionId: number): Observable<SessionDetails> {
    return this.http.get<SessionDetails>(`${this.apiUrl}/my-sessions/${sessionId}`);
  }

  getMySessionHistory(): Observable<SessionDetails[]> {
    return this.http.get<SessionDetails[]>(`${this.apiUrl}/my-history`);
  }

  getMyProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.apiUrl}/me`);
  }

  startFreeExercise(exerciseId: number): Observable<{ sessionId: number }> {
    return this.http.post<{ sessionId: number }>(`${this.apiUrl}/start-free-exercise`, { exerciseId });
  }

  // --- ADD THIS MISSING METHOD ---
  /**
   * Sends the results of a completed exercise session to the backend.
   * @param sessionId ID of the completed session
   * @param results JSON string containing session results
   */
  completeSession(sessionId: number, results: string): Observable<any> {
    const endpoint = `${this.apiUrl}/my-sessions/${sessionId}/complete`;
    const body = { results: results };

    // --- UPDATE HERE ---
    // Specify that HttpClient should return the full response and its type is 'text'.
    return this.http.post(endpoint, body, { observe: 'response', responseType: 'text' });
  }

  linkToPhysio(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/link-physio`, { invitationCode: code }, { responseType: 'text' });
  }
}

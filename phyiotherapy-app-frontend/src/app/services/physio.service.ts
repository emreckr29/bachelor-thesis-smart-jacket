import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the structure of PatientDTO coming from the backend
export interface Patient {
  id: number;
  email: string;
}

export interface PhysioProfile {
  email: string;
  invitationCode: string;
}

export interface SessionHistory {
  id: number;
  exerciseName: string;
  sessionDate: string; // Date will come as a string
  results: string; // Results will come as a JSON string
  feedback: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PhysioService {
  private apiUrl = 'http://localhost:8080/api/physio'; // Address of the controller in the backend

  constructor(private http: HttpClient) { }

  /**
   * Retrieves the list of patients for the logged-in physiotherapist.
   * The token will be automatically added by the AuthInterceptor.
   */
  getMyPatients(): Observable<Patient[]> {
    console.log("aaa")
    return this.http.get<Patient[]>(`${this.apiUrl}/patients`);
  }

  getPatientSessionHistory(patientId: number): Observable<SessionHistory[]> {
    return this.http.get<SessionHistory[]>(`${this.apiUrl}/patients/${patientId}/sessions`);
  }

  assignExercise(patientId: number, exerciseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/patients/${patientId}/assign`, { exerciseId: exerciseId });
  }

  submitFeedback(sessionId: number, feedback: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions/${sessionId}/feedback`, { feedback: feedback });
  }

  getMyProfile(): Observable<PhysioProfile> {
    return this.http.get<PhysioProfile>(`${this.apiUrl}/me`);
  }
}

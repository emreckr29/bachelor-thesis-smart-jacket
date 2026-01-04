import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs'; // Import BehaviorSubject

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  // --- NEW ---
  // Create a BehaviorSubject that holds and broadcasts the login status.
  // Check if there is a token as the initial value.
  private loggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('authToken'));

  // --- NEW ---
  // Expose this status as an observable so components can subscribe to it.
  // This will fix the 'isLoggedIn$' error.
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  signup(email: string, pass: string, role: string): Observable<any> {
    const body = { email: email, password: pass, role: role };

    // --- FIX HERE ---
    // Specify that the HttpClient response will be in 'text' format.
    return this.http.post(`${this.apiUrl}/signup`, body, { responseType: 'text' });
  }

  login(email: string, pass: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email: email, password: pass })
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userRole', response.role);

            this.loggedIn.next(true); // --- UPDATE --- Broadcast login status as 'true'.
            if (response.role === 'PHYSIOTHERAPIST') {
              this.router.navigate(['/physio-dashboard']); // Update redirection
            } else {
              this.router.navigate(['/patient-dashboard']); // Patient dashboard
            }
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole'); // --- UPDATE --- Remove role when logging out
    this.loggedIn.next(false); // --- UPDATE --- Broadcast login status as 'false'.
    this.router.navigate(['/login']);
  }

  // We can still keep this method for guards.
  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule], // Make sure ReactiveFormsModule is imported
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  // --- DEFINE THE MISSING PROPERTIES ---
  signupForm: FormGroup;
  signupErrorMessage: string | null = null; // <-- ADD THIS INSTEAD

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize the form in the constructor
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['PATIENT', Validators.required] // --- UPDATE --- Add role field and assign default value
    });
  }

  // --- DEFINE THE MISSING METHOD ---
  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }
    this.signupErrorMessage = null; // Reset the error on each attempt

    const { email, password, role } = this.signupForm.value;

    this.authService.signup(email, password, role).subscribe({
      next: () => {
        alert('Registration successful! You can now log in.');
        this.signupForm.reset({ role: 'PATIENT' });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Assign the error message returned from the backend directly to the variable
        // The error from Spring Boot is usually in err.error
        this.signupErrorMessage = err.error || 'An unknown error occurred.';
        console.error('Signup failed:', err);
      }
    });
  }
}

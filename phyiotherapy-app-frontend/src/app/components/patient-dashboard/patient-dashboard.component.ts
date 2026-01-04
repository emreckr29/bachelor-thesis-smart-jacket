import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyExercisesComponent } from '../my-exercises/my-exercises.component';
import { SessionHistoryComponent } from '../session-history/session-history.component';
import { PatientService, PatientProfile } from '../../services/patient.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MyExercisesComponent, SessionHistoryComponent, RouterLink],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  myProfile: PatientProfile | null = null;
  physioCodeInput = '';
  isLoading = true;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.patientService.getMyProfile().subscribe(profile => {
      this.myProfile = profile;
      this.isLoading = false;
    });
  }

  submitLinkCode(): void {
    if (!this.physioCodeInput) {
      alert("Please enter a code.");
      return;
    }
    this.patientService.linkToPhysio(this.physioCodeInput).subscribe({
      next: () => {
        alert("Successfully linked to the physiotherapist!");
        this.loadProfile();
      },
      error: (err) => {
        alert("Error: Invalid code or server error.");
        console.error(err);
      }
    });
  }
}

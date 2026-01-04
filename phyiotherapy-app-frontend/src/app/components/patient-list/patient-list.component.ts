import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhysioService, Patient } from '../../services/physio.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private physioService: PhysioService) {}

  ngOnInit(): void {
    this.physioService.getMyPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'An error occurred while loading patients.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}

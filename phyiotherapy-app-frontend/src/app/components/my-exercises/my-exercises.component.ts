import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignedExercise, PatientService } from '../../services/patient.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-exercises',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-exercises.component.html',
  styleUrls: ['./my-exercises.component.css']
})
export class MyExercisesComponent implements OnInit {
  assignedExercises: AssignedExercise[] = [];
  isLoading = true;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.patientService.getMyAssignedExercises().subscribe(data => {
      this.assignedExercises = data;
      this.isLoading = false;
    });
  }
}

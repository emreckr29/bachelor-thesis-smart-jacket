import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Import Router and RouterLink
import { Exercise, ExerciseService } from '../../services/exercise.service';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-free-exercises',
  standalone: true,
  imports: [CommonModule, RouterLink], // Added RouterLink
  templateUrl: './free-exercises.component.html',
  styleUrls: ['./free-exercises.component.css']
})
export class FreeExercisesComponent implements OnInit {
  allExercises: Exercise[] = [];
  isLoading = true;

  constructor(
    private exerciseService: ExerciseService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.exerciseService.getAllExercises().subscribe(data => {
      this.allExercises = data;
      this.isLoading = false;
    });
  }

  startExercise(exercise: Exercise): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.patientService.startFreeExercise(exercise.id).subscribe({
      next: (newSessionResponse) => { // <-- Updated variable name
        // --- READ THE RESPONSE CORRECTLY ---
        // Backend now returns an object like { sessionId: 123 }.
        this.router.navigate(
          ['/do-exercise', newSessionResponse.sessionId],
          { state: { exerciseSystemName: exercise.name, exerciseDisplayName: exercise.displayName } }
        );
      },
      error: (err) => {
        alert("An error occurred while starting the session.");
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}

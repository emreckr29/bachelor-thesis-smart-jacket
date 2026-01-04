import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Exercise, ExerciseService } from '../../services/exercise.service';
import { PhysioService, SessionHistory } from '../../services/physio.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent implements OnInit {
  patientId!: number;
  availableExercises: Exercise[] = [];
  sessionHistory: SessionHistory[] = [];

  isLoadingExercises = true;
  isLoadingHistory = true;

  feedbackInputs: { [sessionId: number]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private exerciseService: ExerciseService,
    private physioService: PhysioService
  ) {}

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.patientId) return;

    this.loadExercises();
    this.loadSessionHistory();
  }

  loadExercises(): void {
    this.exerciseService.getAllExercises().subscribe(exercises => {
      this.availableExercises = exercises;
      this.isLoadingExercises = false;
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) {
      return '#27ae60'; // Green (Good)
    } else if (score >= 50) {
      return '#f39c12'; // Yellow (Medium)
    } else {
      return '#e74c3c'; // Red (Weak)
    }
  }

  loadSessionHistory(): void {
    this.isLoadingHistory = true;
    this.physioService.getPatientSessionHistory(this.patientId).subscribe(history => {
      this.sessionHistory = history;
      // Load existing feedbacks into our input model
      history.forEach(session => {
        if (session.feedback) {
          this.feedbackInputs[session.id] = session.feedback;
        }
      });
      this.isLoadingHistory = false;
    });
  }

  assignExercise(exerciseId: number): void {
    if (this.patientId) {
      this.physioService.assignExercise(this.patientId, exerciseId).subscribe({
        next: () => {
          alert(`Exercise #${exerciseId} assigned successfully!`);
          // Optional: We can remove the assigned exercise from the list or add a visual mark.
        },
        error: (err) => {
          alert('An error occurred while assigning the exercise.');
          console.error(err);
        }
      });
    }
  }

  submitFeedback(sessionId: number): void {
    const feedbackText = this.feedbackInputs[sessionId];
    if (!feedbackText) {
      alert("Please write some feedback.");
      return;
    }

    this.physioService.submitFeedback(sessionId, feedbackText).subscribe({
      next: () => {
        alert("Feedback saved successfully!");
        // Refresh the interface with the latest data
        this.loadSessionHistory();
      },
      error: (err) => {
        alert("An error occurred while saving feedback.");
        console.error(err);
      }
    });
  }

  parseResults(results: string): any {
    try {
      return JSON.parse(results);
    } catch (e) {
      return { raw: results }; // If not a valid JSON, show raw text
    }
  }
}

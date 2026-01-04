import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms'; // <-- 1. IMPORT FormsModule

import { BluetoothService, SensorQuaternion } from '../../services/bluetooth.service';
import { PatientService } from '../../services/patient.service';
import { MlService } from '../../services/ml.service';

type ExerciseState = 'AwaitingConnection' | 'Connecting' | 'Ready' | 'Countdown' | 'Recording' | 'Processing' | 'Result' | 'Finished';

@Component({
  selector: 'app-do-exercise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './do-exercise.component.html',
  styleUrls: ['./do-exercise.component.css']
})
export class DoExerciseComponent implements OnInit, OnDestroy {
  sessionId!: number;
  state: ExerciseState = 'AwaitingConnection';
  statusMessage = "Connect to the smart jacket to start the exercise.";
  isConnected = false;

  totalReps = 10;
  currentRep = 1;
  countdown = 2;

  exerciseSystemName: string | null = null; // Name to send to Python
  exerciseDisplayName: string | null = null; // Name to display on the screen

  private currentRepData: SensorQuaternion[][] = [];
  repResults: { rep: number; score: number; prediction: string }[] = [];
  lastScore = 0;
  lastPrediction = '';

  private subscriptions = new Subscription();

  models = [
    { value: 'RandomForest', viewValue: 'Random Forest' },
    { value: 'SVM', viewValue: 'SVM' },
    { value: 'KNN', viewValue: 'K-Nearest Neighbors' },
    { value: 'XGBoost', viewValue: 'XGBoost' }
  ];
  selectedModel: string = 'RandomForest'; // Default selection

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bluetoothService: BluetoothService,
    private patientService: PatientService,
    private mlService: MlService
  ) {
  }

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));

    if (!this.sessionId) {
      this.state = 'Finished';
      this.statusMessage = 'Error: Session ID not found.';
      return;
    }

    this.statusMessage = "Loading session details...";

    // --- MAIN CHANGE ---
    // 1. First, fetch session details (including exercise name) from the backend
    this.subscriptions.add(
      this.patientService.getSessionDetails(this.sessionId).subscribe({
        next: (sessionDetails) => {
          // 2. Save exercise names in the component
          this.exerciseSystemName = sessionDetails.exerciseName;
          this.exerciseDisplayName = sessionDetails.exerciseDisplayName;

          this.state = 'AwaitingConnection';
          this.statusMessage = "Connect to the smart jacket to start the exercise.";

          // 3. Start Bluetooth listeners only after this information is received
          this.setupBluetoothListeners();
        },
        error: (err) => {
          this.state = 'Finished';
          this.statusMessage = 'Error: Failed to load session details.';
          console.error(err);
        }
      })
    );
  }

  setupBluetoothListeners(): void {
    this.subscriptions.add(this.bluetoothService.getConnectionStream().subscribe(isConnected => {
      this.isConnected = isConnected;
      if (isConnected) this.state = 'Ready';
      else {
        this.state = 'AwaitingConnection';
        this.statusMessage = "Connection lost. Please reconnect.";
      }
    }));
    this.subscriptions.add(this.bluetoothService.getStatusStream().subscribe(message => {
      if(this.state === 'Connecting' || this.state === 'AwaitingConnection' || this.state === 'Ready') {
          this.statusMessage = message;
      }
    }));
}

  ngOnDestroy(): void {
    // When the component is destroyed, terminate all subscriptions (prevents memory leaks)
    this.subscriptions.unsubscribe();
    this.bluetoothService.disconnect();
  }

  connectToDevice(): void {
    this.state = 'Connecting';
    this.bluetoothService.connect();
  }

  startSession(): void {
    this.state = 'Countdown';
    this.runCountdownAndRecord();
  }

  private runCountdownAndRecord(): void {
    this.countdown = 2;
    this.statusMessage = `${this.countdown}`;
    const countdownInterval = setInterval(() => {
      this.countdown--;
      this.statusMessage = `${this.countdown}`;
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        this.startRecording();
      }
    }, 1000);
  }

  private startRecording(): void {
    this.state = 'Recording';
    this.statusMessage = "RECORDING... Perform the movement!";
    this.currentRepData = [];

    const dataSub = this.bluetoothService.getRawDataStream().subscribe(data => {
      this.currentRepData.push(data);
    });
    this.subscriptions.add(dataSub);

    // --- UPDATE HERE ---
    // Determine recording duration based on exercise name
    const recordingDuration = this.getDurationForExercise(this.exerciseSystemName);

    // Stop recording after the dynamic duration
    setTimeout(() => {
      dataSub.unsubscribe();
      this.stopAndProcessRecording();
    }, recordingDuration);
  }

  private getDurationForExercise(exerciseName: string | null): number {
    if (!exerciseName) return 4000; // Default duration

    const lowerCaseName = exerciseName.toLowerCase();

    if (lowerCaseName.includes('sitandreach')) {
        return 4000; // 4 seconds
    } else {
        return 3000; // 3 seconds (for others)
    }
}

private transformDataForPython(data: SensorQuaternion[][]): number[][] {
  // Python'un beklediği doğru sıralama: [x, y, z, w]
  return data.map(frame => frame.flatMap(q => [q.x, q.y, q.z, q.w]));
}

  private scoreFromPrediction(prediction: string): number {
    // If the prediction is "True", give 100 points; otherwise, 0 points.
    return prediction.toLowerCase() === 'true' ? 100 : 0;
  }

  private stopAndProcessRecording(): void {
    this.state = 'Processing';
    this.statusMessage = "Processing results...";

    if (!this.exerciseSystemName || !this.selectedModel) { // Check for selected model
      this.statusMessage = "Error: Exercise or model not selected.";
      setTimeout(() => this.prepareNextRep(), 2000);
      return;
    }

    // --- MAIN CHANGE HERE ---

    // 1. Convert data to the format expected by Python
    const transformedData = this.transformDataForPython(this.currentRepData);

    const movementType = this.exerciseSystemName;
    const modelName = this.selectedModel; // <-- 3. USE THE SELECTED MODEL

    // 2. Send the transformed data to the ML service
    this.mlService.evaluateMovement(transformedData, movementType, modelName).subscribe({
      next: (response) => {
        // 3. Convert the returned string prediction ("Correct" etc.) to a score
        this.lastPrediction = response.prediction;
        this.lastScore = this.scoreFromPrediction(response.prediction);

        this.repResults.push({ rep: this.currentRep, score: this.lastScore, prediction: this.lastPrediction });
        this.state = 'Result';
        this.statusMessage = `Repetition ${this.currentRep}: ${this.lastPrediction} (Score: %${this.lastScore})`;
        setTimeout(() => this.prepareNextRep(), 2000);
      },
      error: (err) => {
        this.statusMessage = `Repetition ${this.currentRep} could not be evaluated.`;
        console.error('ML Service Error:', err);
        // Even in case of an error, proceed to the next step, just skip saving this repetition.
        setTimeout(() => this.prepareNextRep(), 2000);
      }
    });
  }

  private prepareNextRep(): void {
    this.currentRep++;
    if (this.currentRep > this.totalReps) {
      this.finishSession();
    } else {
      this.state = 'Countdown';
      this.runCountdownAndRecord();
    }
  }

  private finishSession(): void {
    this.state = 'Finished';
    const totalScore = this.repResults.reduce((acc, cur) => acc + cur.score, 0);

    const averageScore = this.repResults.length > 0 ? totalScore / this.repResults.length : 0;
    const finalResult = {
      totalReps: this.totalReps,
      completedReps: this.repResults.length,
      averageScore: averageScore,
      reps: this.repResults
    };
    this.statusMessage = `Session Completed! Average Score: %${averageScore.toFixed(1)}`;

    this.patientService.completeSession(this.sessionId, JSON.stringify(finalResult)).subscribe({
      next: () => {
        console.log("Session results successfully saved.");
        this.statusMessage = `Session Completed! Results successfully saved.`;

        setTimeout(() => this.router.navigate(['/patient-dashboard']), 4000);
      },
      error: (err) => {
        console.error("Failed to save session results:", err);
        this.statusMessage = "Failed to save results, please try again.";
      }
    });
  }
}

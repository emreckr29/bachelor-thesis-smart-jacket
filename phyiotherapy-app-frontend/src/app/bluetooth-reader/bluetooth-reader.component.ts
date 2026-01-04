import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { BluetoothService, SensorQuaternion } from '../services/bluetooth.service';
import { BodyVisualizationComponent } from "../body-visualization/body-visualization.component";
import { MotionAvatarComponent } from "../motion-avatar/motion-avatar.component";
import { LiveAvatarComponent } from "../live-avatar/live-avatar.component";




// NEW: Define a more structured type for our movements
interface Movement {
  value: string;
  viewValue: string;
  duration: number; // Recording duration in milliseconds
}

@Component({
    selector: 'app-bluetooth-reader',
    standalone: true,
    template: `
    <div class="container">
      <h1>Smart Jacket Live Feedback</h1>

      <button mat-raised-button color="primary" (click)="connectToBluetoothDevice()" [disabled]="deviceConnected">
        {{ deviceConnected ? 'Jacket Connected' : 'Connect to Jacket' }}
      </button>

      <p class="status-message">Status: <strong>{{ statusMessage }}</strong></p>
      <p class="error-message" *ngIf="errorMessage">{{ errorMessage }}</p>

      <div *ngIf="deviceConnected" class="controls-section">
        <!-- Movement Selection -->
        <mat-form-field appearance="fill">
          <mat-label>1. Select Exercise</mat-label>
          <mat-select [(ngModel)]="selectedMovement">
            <mat-option *ngFor="let movement of movements" [value]="movement.value">
              {{ movement.viewValue }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- NEW: Model Selection -->
        <mat-form-field appearance="fill">
          <mat-label>2. Select AI Model</mat-label>
          <mat-select [(ngModel)]="selectedModel">
            <mat-option *ngFor="let model of models" [value]="model.value">
              {{ model.viewValue }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="accent" class="record-button"
                (click)="startRecording()"
                [disabled]="!selectedMovement || !selectedModel || isRecording">
          {{ isRecording ? 'Recording...' : '3. Start Recording' }}
        </button>

        <p *ngIf="loadingPrediction">Analyzing...</p>
        <div *ngIf="lastPredictionResult" class="prediction-result" [ngClass]="predictionClass">
          <h3>Analysis Result:</h3>
          <p>{{ lastPredictionResult }}</p>
        </div>
      </div>
    </div>
    <div>
    <app-live-avatar></app-live-avatar>
    </div>
  `,
    styles: [`
    .container { display: flex; flex-direction: column; align-items: center; padding: 20px; max-width: 600px; margin: 20px auto; }
    .status-message { color: #555; }
    .error-message { color: #D32F2F; font-weight: bold; }
    .controls-section { margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; width: 100%; display: flex; flex-direction: column; gap: 15px; }
    .record-button { padding: 15px 0; font-size: 1.1em; }
    .prediction-result { margin-top: 20px; padding: 15px; border-radius: 8px; text-align: center; }
    .prediction-result.correct { background-color: #E8F5E9; border: 1px solid #4CAF50; color: #1B5E20; }
    .prediction-result.incorrect { background-color: #FFEBEE; border: 1px solid #F44336; color: #C62828; }
    .prediction-result h3 { margin-top: 0; }
  `],
    imports: [
        CommonModule, MatButtonModule, MatSelectModule,
        MatFormFieldModule, FormsModule, NgFor, NgIf,
        BodyVisualizationComponent,
        MotionAvatarComponent,
        LiveAvatarComponent
    ]
})
export class BluetoothReaderComponent implements OnInit, OnDestroy {
  statusMessage: string = 'Waiting for connection.';
  errorMessage: string | null = null;
  deviceConnected: boolean = false;
  isRecording: boolean = false;
  loadingPrediction: boolean = false;

  private allRecordedFrames: SensorQuaternion[][] = [];
  private subscriptions: Subscription[] = [];
  private recordingTimeout: any;

  // --- Dynamic Configuration ---
  selectedMovement: string = '';
  selectedModel: string = '';

  movements: Movement[] = [
    { value: 'ShoulderAbduction', viewValue: 'Shoulder Abduction', duration: 3000 },
    { value: 'ShoulderFlexion', viewValue: 'Shoulder Flexion', duration: 3000 },
    { value: 'SitAndReach', viewValue: 'Sit and Reach', duration: 4000 }
  ];

  models = [
    { value: 'RandomForest', viewValue: 'Random Forest' },
    { value: 'SVM', viewValue: 'SVM' },
    { value: 'KNN', viewValue: 'K-Nearest Neighbors' },
    { value: 'LogisticRegression', viewValue: 'Logistic Regression' },
    { value: 'XGBoost', viewValue: 'XGBoost' }
  ];

  lastPredictionResult: string | null = null;
  predictionClass: 'correct' | 'incorrect' | '' = '';

  constructor(private http: HttpClient, private bluetoothService: BluetoothService) {}

  ngOnInit(): void {
    const dataSub = this.bluetoothService.getRawDataStream().subscribe(data => {
      if (this.isRecording) {
        this.allRecordedFrames.push(data);
      }
    });
    // Subscribe to other streams...
    const statusSub = this.bluetoothService.getStatusStream().subscribe(msg => this.statusMessage = msg);
    const errorSub = this.bluetoothService.getErrorStream().subscribe(msg => this.errorMessage = msg);
    const connectionSub = this.bluetoothService.getConnectionStream().subscribe(isConnected => this.deviceConnected = isConnected);
    this.subscriptions.push(dataSub, statusSub, errorSub, connectionSub);
  }

  connectToBluetoothDevice() {
    this.bluetoothService.connect();
  }

  startRecording() {
    const selectedMovementConfig = this.movements.find(m => m.value === this.selectedMovement);
    if (!selectedMovementConfig) {
      this.errorMessage = 'Could not find configuration for the selected movement.';
      return;
    }
    const duration = selectedMovementConfig.duration;

    this.isRecording = true;
    this.allRecordedFrames = [];
    this.lastPredictionResult = null;
    this.predictionClass = '';
    this.errorMessage = null;
    this.statusMessage = `Recording for ${duration / 1000} seconds...`;

    this.recordingTimeout = setTimeout(() => {
      this.stopRecordingAndPredict();
    }, duration);
  }

  stopRecordingAndPredict() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearTimeout(this.recordingTimeout);
    this.statusMessage = 'Recording finished.';

    if (this.allRecordedFrames.length < 20) {
      this.errorMessage = 'Not enough data was collected. Please try recording again.';
      return;
    }
    this.sendDataToBackend();
  }

  private async sendDataToBackend() {
    this.loadingPrediction = true;
    const backendUrl = 'http://localhost:8080/api/predict'; // Spring Boot URL

    const payload = {
      movement_data: this.transformDataForBackend(this.allRecordedFrames),
      movement_type: this.selectedMovement,
      model_name: this.selectedModel
    };

    try {
      const response: any = await this.http.post(backendUrl, payload).toPromise();
      this.handlePredictionResponse(response.prediction);
    } catch (error: any) {
      this.errorMessage = `Backend Error: ${error.error?.error || 'Could not reach server. Is it running?'}`;
      this.lastPredictionResult = null;
    } finally {
      this.loadingPrediction = false;
    }
  }

  private handlePredictionResponse(prediction: string) {
    if (!prediction) {
      this.errorMessage = 'Received an empty prediction from the server.';
      return;
    }

    // The new API sends back clean labels, so translation is simpler.
    this.lastPredictionResult = prediction.replace(/_/g, ' '); // Replace underscores for readability

    if (prediction.toLowerCase().includes('true')) {
      this.predictionClass = 'correct';
    } else {
      this.predictionClass = 'incorrect';
    }
  }

  private transformDataForBackend(data: SensorQuaternion[][]): number[][] {
    // Flatten the data for the JSON payload
    return data.map(frame => frame.flatMap(q => [q.x, q.y, q.z, q.w]));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.recordingTimeout);
  }
}

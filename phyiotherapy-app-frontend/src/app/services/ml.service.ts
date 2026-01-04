import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// SensorQuaternion'a artık burada ihtiyacımız yok, component'te kalabilir.

export interface MlPredictionResponse {
  prediction: string; // 'Correct', 'Incorrect' etc.
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private predictApiUrl = 'http://localhost:8080/api/predict';

  constructor(private http: HttpClient) { }

  evaluateMovement(
    movementData: number[][],
    movementType: string,
    modelName: string
  ): Observable<MlPredictionResponse> {

    const body = {
      movement_data: movementData,
      movement_type: movementType,
      model_name: modelName
    };

    return this.http.post<MlPredictionResponse>(this.predictApiUrl, body);
  }
}

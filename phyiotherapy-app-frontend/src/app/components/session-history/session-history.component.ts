import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService, SessionDetails } from '../../services/patient.service';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.css']
})
export class SessionHistoryComponent implements OnInit {
  sessionHistory: SessionDetails[] = [];
  isLoading = true;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.patientService.getMySessionHistory().subscribe(data => {
      this.sessionHistory = data;
      this.isLoading = false;
    });
  }

  parseResults(results: string | null): any {
    if (!results) return null;
    try {
      return JSON.parse(results);
    } catch (e) {
      return { raw: results };
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#27ae60'; // Green
    else if (score >= 50) return '#f39c12'; // Yellow
    else return '#e74c3c'; // Red
  }
}

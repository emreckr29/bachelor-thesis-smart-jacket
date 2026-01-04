import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientListComponent } from '../patient-list/patient-list.component';
import { PhysioService, PhysioProfile } from '../../services/physio.service';


@Component({
  selector: 'app-physiotherapist-dashboard',
  standalone: true,
  imports: [CommonModule, PatientListComponent],
  templateUrl: './physiotherapist-dashboard.component.html',
  styleUrls: ['./physiotherapist-dashboard.component.css']
})
export class PhysiotherapistDashboardComponent implements OnInit {
  myProfile: PhysioProfile | null = null;

  constructor(private physioService: PhysioService) {}

  ngOnInit(): void {
    this.physioService.getMyProfile().subscribe(profile => {
      this.myProfile = profile;
    });
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      alert('Invitation Code Copied!');
    });
  }
}

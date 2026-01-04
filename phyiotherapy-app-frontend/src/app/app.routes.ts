import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/components/login/login.component';
import { SignupComponent } from './authentication/components/signup/signup.component';
import { PhysiotherapistDashboardComponent } from './components/physiotherapist-dashboard/physiotherapist-dashboard.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { PatientDetailComponent } from './components/patient-detail/patient-detail.component';
import { DoExerciseComponent } from './components/do-exercise/do-exercise.component';
import { FreeExercisesComponent } from './components/free-exercises/free-exercises.component';
import { BluetoothReaderComponent } from './bluetooth-reader/bluetooth-reader.component';
import { MotionAvatarComponent } from './motion-avatar/motion-avatar.component';
import { LiveAvatarComponent } from './live-avatar/live-avatar.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  {
    path: 'physio-dashboard',
    component: PhysiotherapistDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient-dashboard',
    component: PatientDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/:id',
    component: PatientDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'do-exercise/:sessionId',
    component: DoExerciseComponent,
    canActivate: [authGuard]
  },

  {
    path: 'free-exercises',
    component: FreeExercisesComponent,
    canActivate: [authGuard]
  },

  { path: 'vis', component: LiveAvatarComponent },



  { path: '', component: BluetoothReaderComponent },
  { path: '**', redirectTo: '/login' }
];

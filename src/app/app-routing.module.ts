import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BookingTimesComponent } from './booking-times/booking-times.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthenticationGuard } from './core/authentication/authentication.guard';

const routes: Routes = [{
  path: '',
  component: DashboardComponent,
  canActivate: [AuthenticationGuard]
},
{
  path: 'bookingTimes',
  component: BookingTimesComponent,
  canActivate: [AuthenticationGuard]
}, {
  path: 'profile',
  component: ProfileComponent,
  canActivate: [AuthenticationGuard]
}, {
  path: 'stomp',
  component: DashboardComponent,
  canActivate: [AuthenticationGuard]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

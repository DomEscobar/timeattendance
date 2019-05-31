import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BookingTimesComponent } from './booking-times/booking-times.component';

const routes: Routes = [{
  path: '',
  component: DashboardComponent,
},
{
  path: 'bookingTimes',
  component: BookingTimesComponent,
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

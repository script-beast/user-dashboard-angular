import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserDashboardComponent } from './user-dashboard.component';

@NgModule({
  declarations: [UserDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: UserDashboardComponent,
      },
    ]),
  ],
})
export class UserDashboardModule {}

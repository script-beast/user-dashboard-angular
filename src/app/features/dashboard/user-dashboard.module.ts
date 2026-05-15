import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserDashboardComponent } from './user-dashboard.component';
import { UserFormModule } from '../user-form/user-form.module';

@NgModule({
  declarations: [UserDashboardComponent],
  imports: [
    CommonModule,
    UserFormModule,
    RouterModule.forChild([
      {
        path: '',
        component: UserDashboardComponent,
      },
    ]),
  ],
})
export class UserDashboardModule {}

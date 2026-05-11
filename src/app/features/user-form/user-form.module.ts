import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { UserFormComponent } from './user-form.component';

@NgModule({
  declarations: [UserFormComponent],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [UserFormComponent],
})
export class UserFormModule {}

export { UserFormComponent } from './user-form.component';

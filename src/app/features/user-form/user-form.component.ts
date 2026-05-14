import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { User } from '../../shared/models/user.model';

function roleIn(
  allowed: ReadonlyArray<User['role']>,
): (control: AbstractControl<User['role'] | null>) => ValidationErrors | null {
  return (control: AbstractControl<User['role'] | null>) => {
    const value = control.value;
    if (value === null) {
      return null;
    }
    return allowed.includes(value) ? null : { roleInvalid: true };
  };
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  standalone: false,
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  @Input() initialUser: User | null = null;

  @Output() userAdded = new EventEmitter<User>();
  @Output() close = new EventEmitter<void>();

  readonly roles: ReadonlyArray<User['role']> = ['Admin', 'Editor', 'Viewer'];
  private readonly roleValidator = roleIn(this.roles);

  readonly form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    role: FormControl<User['role'] | null>;
  }>;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      name: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.email],
      }),
      role: this.fb.control<User['role'] | null>(null, {
        validators: [Validators.required, this.roleValidator],
      }),
    });
  }

  // Programmatic prefill method — call this after creating the component instance
  prefill(user: User | null): void {
    this.initialUser = user;
    if (!user) {
      this.form.reset({ name: '', email: '', role: null });
      return;
    }

    this.form.controls.name.setValue(user.name);
    this.form.controls.email.setValue(user.email);
    this.form.controls.role.setValue(user.role);
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const role = this.form.controls.role.value;
    if (role === null) {
      return;
    }

    const user: User = {
      name: this.form.controls.name.value.trim(),
      email: this.form.controls.email.value.trim(),
      role,
      idx: this.initialUser?.idx ?? 0,
    };

    this.userAdded.emit(user);
    this.close.emit();
  }
}

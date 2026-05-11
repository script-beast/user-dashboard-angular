import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly usersSubject = new BehaviorSubject<User[]>([
    { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Admin' },
    { name: 'Isha Mehta', email: 'isha.mehta@example.com', role: 'Editor' },
    { name: 'Rohan Kapoor', email: 'rohan.kapoor@example.com', role: 'Viewer' },
    { name: 'Neha Verma', email: 'neha.verma@example.com', role: 'Editor' },
    { name: 'Kabir Singh', email: 'kabir.singh@example.com', role: 'Viewer' },
  ]);

  readonly users$ = this.usersSubject.asObservable();

  addUser(user: User): void {
    this.usersSubject.next([...this.usersSubject.value, user]);
  }

  getUsers(): User[] {
    return [...this.usersSubject.value];
  }
}

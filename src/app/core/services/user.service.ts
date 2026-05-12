import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { User } from '../../shared/models/user.model';

const USERS_STORAGE_KEY = 'user-dashboard.users.v1';

const SEED_USERS: User[] = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Admin' },
  { name: 'Isha Mehta', email: 'isha.mehta@example.com', role: 'Editor' },
  { name: 'Rohan Kapoor', email: 'rohan.kapoor@example.com', role: 'Viewer' },
  { name: 'Neha Verma', email: 'neha.verma@example.com', role: 'Editor' },
  { name: 'Kabir Singh', email: 'kabir.singh@example.com', role: 'Viewer' },
];

function isRole(value: unknown): value is User['role'] {
  return value === 'Admin' || value === 'Editor' || value === 'Viewer';
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record['name'] === 'string' &&
    typeof record['email'] === 'string' &&
    isRole(record['role'])
  );
}

function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly usersSubject = new BehaviorSubject<User[]>(SEED_USERS);

  readonly users$ = this.usersSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    const storedUsers = this.readUsersFromStorage();
    if (storedUsers) {
      this.usersSubject.next(storedUsers);
    }
  }

  addUser(user: User): void {
    const updated = [...this.usersSubject.value, user];
    this.usersSubject.next(updated);
    this.writeUsersToStorage(updated);
  }

  getUsers(): User[] {
    return [...this.usersSubject.value];
  }

  private readUsersFromStorage(): User[] | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!isUserArray(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private writeUsersToStorage(users: readonly User[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Ignore storage errors (e.g., quota exceeded, disabled storage).
    }
  }
}

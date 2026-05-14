import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';

import { User } from '../../shared/models/user.model';

const USERS_STORAGE_KEY = 'user-dashboard.users.v1';

const SEED_USERS: User[] = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Admin', idx: 0 },
  { name: 'Isha Mehta', email: 'isha.mehta@example.com', role: 'Editor', idx: 1 },
  { name: 'Rohan Kapoor', email: 'rohan.kapoor@example.com', role: 'Viewer', idx: 2 },
  { name: 'Neha Verma', email: 'neha.verma@example.com', role: 'Editor', idx: 3 },
  { name: 'Kabir Singh', email: 'kabir.singh@example.com', role: 'Viewer', idx: 4 },
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
  private allUser: User[] = SEED_USERS;
  private readonly usersSubject = new BehaviorSubject<User[]>(SEED_USERS);

  readonly users$ = this.usersSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    const storedUsers = this.readUsersFromStorage();
    if (storedUsers) {
      this.usersSubject.next(storedUsers);
    }
  }

  addUser(user: User): void {
    const findSame = this.usersSubject.value.find((use) => use.email === user.email);
    if (findSame) {
      throw new Error('User with this email already exists');
    }

    const nextIdx = this.allUser.length > 0 ? Math.max(...this.allUser.map((u) => u.idx)) + 1 : 0;
    const updated = [...this.usersSubject.value, { ...user, idx: nextIdx }];
    this.usersSubject.next(updated);
    this.allUser = updated;
    this.writeUsersToStorage(updated);
  }

  updateUser(user: User): void {
    const current = this.usersSubject.value;
    const index = current.findIndex((u) => u.idx === user.idx);
    if (index === -1) {
      throw new Error('User not found');
    }

    const otherWithEmail = current.find((u) => u.email === user.email && u.idx !== user.idx);
    if (otherWithEmail) {
      throw new Error('Another user with this email already exists');
    }

    const updated = [...current];
    updated[index] = { ...user };
    this.usersSubject.next(updated);
    this.allUser = updated;
    this.writeUsersToStorage(updated);
  }

  deleteUser(userIdx: number) {
    const current = this.usersSubject.value;
    const index = current.findIndex((u) => u.idx === userIdx);
    if (index === -1) {
      return;
    }

    const updated = [...current];
    updated.splice(index, 1);
    this.usersSubject.next(updated);
    this.allUser = updated;
    this.writeUsersToStorage(updated);
  }

  search(search: string) {
    const updated = this.allUser.filter(
      (se) => se.name.includes(search) || se.email.includes(search),
    );
    this.usersSubject.next(updated)
    // this.writeUsersToStorage(updated);
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

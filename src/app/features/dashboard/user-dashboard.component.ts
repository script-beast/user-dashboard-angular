import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/user.model';

type PieChart = import('chart.js').Chart<'pie', number[], string>;

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  standalone: false,
  styleUrl: './user-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private static chartJsRegistered = false;

  searchTerm: string = '';

  users: readonly User[] = [];
  currentPage = 1;
  readonly pageSize = 5;

  @ViewChild('roleChart', { static: true })
  chartRef!: ElementRef<HTMLCanvasElement>;

  private readonly destroy$ = new Subject<void>();
  private chart: PieChart | null = null;

  isUserFormOpen = false;
  currentEditUser: User | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get totalPages(): number {
    const pages = Math.ceil(this.users.length / this.pageSize);
    return Math.max(pages, 1);
  }

  get pagedUsers(): readonly User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.userService.users$.pipe(takeUntil(this.destroy$)).subscribe((users) => {
      this.users = users;
      this.ensureValidPage();
      this.updateChart();
      this.cdr.markForCheck();
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initChart();
  }

  trackByEmail(_index: number, user: User): string {
    return user.email;
  }

  prevPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.cdr.markForCheck();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.cdr.markForCheck();
  }

  onUserAdded(user: User, isEdit: boolean = false): void {
    console.log(user);
    try {
      if (isEdit) this.userService.updateUser(user);
      else this.userService.addUser(user);
    } catch (error) {
      alert((error as Error).message);
    }
  }

  openUserForm(): void {
    if (this.isUserFormOpen) {
      return;
    }
    this.currentEditUser = null;
    this.isUserFormOpen = true;
  }

  openUserEditForm(user: User): void {
    if (this.isUserFormOpen) {
      return;
    }
    this.currentEditUser = user;
    this.isUserFormOpen = true;
  }

  async filterUsers(): Promise<void> {
    console.log(this.searchTerm);
    this.userService.search(this.searchTerm);
  }

  async deleteUser(userIdx: number): Promise<void> {
    this.userService.deleteUser(userIdx);
  }

  closeUserForm(): void {
    this.isUserFormOpen = false;
    this.currentEditUser = null;
  }

  onUserFormSubmit(user: User): void {
    try {
      if (this.currentEditUser) {
        console.log(user);
        this.userService.updateUser(user);
      } else {
        this.userService.addUser(user);
      }
    } catch (error) {
      alert((error as Error).message);
    }
    this.closeUserForm();
  }

  onUserFormClose(): void {
    this.closeUserForm();
  }

  private ensureValidPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private async initChart(): Promise<void> {
    const { Chart, registerables } = await import('chart.js');
    if (!UserDashboardComponent.chartJsRegistered) {
      Chart.register(...registerables);
      UserDashboardComponent.chartJsRegistered = true;
    }

    const canvas = this.chartRef.nativeElement;
    this.chart = new Chart<'pie', number[], string>(canvas, {
      type: 'pie',
      data: {
        labels: ['Admin', 'Editor', 'Viewer'],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ['#1c4980', '#4a90d9', '#a0c4f1'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 250,
        },
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart) {
      return;
    }

    const counts: Record<User['role'], number> = {
      Admin: 0,
      Editor: 0,
      Viewer: 0,
    };

    for (const user of this.users) {
      counts[user.role] += 1;
    }

    this.chart.data.datasets[0].data = [counts.Admin, counts.Editor, counts.Viewer];
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.chart?.destroy();
    this.chart = null;
  }
}

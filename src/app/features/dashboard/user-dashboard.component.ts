import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/user.model';

type PieChart = import('chart.js').Chart<'pie', number[], string>;

interface UserFormComponentContract {
  userAdded: EventEmitter<User>;
  close: EventEmitter<void>;
}

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  standalone: false,
  styleUrl: './user-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private static chartJsRegistered = false;

  users: readonly User[] = [];
  currentPage = 1;
  readonly pageSize = 5;

  isLoadingUserForm = false;

  @ViewChild('roleChart', { static: true })
  chartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('modalHost', { read: ViewContainerRef, static: true })
  modalHost!: ViewContainerRef;

  private readonly destroy$ = new Subject<void>();
  private readonly userFormDestroy$ = new Subject<void>();
  private chart: PieChart | null = null;
  private userFormRef: ComponentRef<UserFormComponentContract> | null = null;

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

  get isUserFormOpen(): boolean {
    return this.userFormRef !== null;
  }

  ngOnInit(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
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

  async openUserForm(): Promise<void> {
    if (this.isLoadingUserForm || this.userFormRef) {
      return;
    }

    this.isLoadingUserForm = true;
    this.cdr.markForCheck();

    try {
      const { UserFormComponent } = await import('../user-form/user-form.module');

      this.userFormDestroy$.next();
      this.modalHost.clear();

      const componentRef = this.modalHost.createComponent(
        UserFormComponent as Type<UserFormComponentContract>,
      );
      this.userFormRef = componentRef;

      componentRef.onDestroy(() => {
        this.userFormDestroy$.next();
      });

      componentRef.instance.userAdded
        .pipe(takeUntil(this.destroy$), takeUntil(this.userFormDestroy$))
        .subscribe((user) => {
          this.userService.addUser(user);
          this.closeUserForm();
        });

      componentRef.instance.close
        .pipe(takeUntil(this.destroy$), takeUntil(this.userFormDestroy$))
        .subscribe(() => {
          this.closeUserForm();
        });
    } finally {
      this.isLoadingUserForm = false;
      this.cdr.markForCheck();
    }
  }

  closeUserForm(): void {
    if (!this.userFormRef) {
      return;
    }

    this.userFormRef.destroy();
    this.userFormRef = null;
    this.modalHost.clear();
    this.cdr.markForCheck();
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

    this.chart.data.datasets[0].data = [
      counts.Admin,
      counts.Editor,
      counts.Viewer,
    ];
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.userFormDestroy$.next();
    this.userFormDestroy$.complete();

    this.chart?.destroy();
    this.chart = null;
  }
}

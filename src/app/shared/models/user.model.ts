export interface User {
  idx: number
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

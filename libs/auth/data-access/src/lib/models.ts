export interface User {
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'User' | 'Admin';
  Division?: 'PG' | 'Mackenzie' | 'All';
  Token?: string;
  RefreshToken?: string;
}

export interface AuthResponse {
  User: User;
  AccessToken: string;
  RefreshToken: string;
}


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
  UserId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'User' | 'Admin';
  Division?: 'PG' | 'Mackenzie' | 'All';
  Created: string;
  Updated: string | null;
  IsVerified: boolean;
  JwtToken: string;
  RefreshToken: string;
}


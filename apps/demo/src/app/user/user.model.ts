// User entity model
// NOTE: 'id' field added for DataService compatibility (aliases UserId)
export interface User {
  id: string;          // Required by DataService interface (same as UserId)
  UserId: string;      // Primary key in IDB
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'User' | 'Admin';
  Division?: 'PG' | 'Mackenzie' | 'All';
  Password?: string;   // Optional, for create/update
}

// Default blank user for create forms
export const createBlankUser = (): Omit<User, 'UserId' | 'id'> => ({
  Email: '',
  FirstName: '',
  LastName: '',
  Role: 'User',
  Division: 'All',
  Password: '',
});

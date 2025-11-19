import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { User } from '../models';

let users: User[] = [
  {
    UserId: '550e8400-e29b-41d4-a716-446655440001',
    Email: 'steve@wbenterprises.ca',
    FirstName: 'Steve',
    LastName: 'Admin',
    Role: 'Admin',
    Division: 'All',
  },
  {
    UserId: '550e8400-e29b-41d4-a716-446655440002',
    Email: 'user@test.com',
    FirstName: 'Test',
    LastName: 'User',
    Role: 'User',
    Division: 'Mackenzie',
  },
];

export const fakeBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const { url, method, body } = req;

  return handleRoute();

  function handleRoute() {
    // Pass through to real backend
    // console.log('FakeBackend:', method, url);
    switch (true) {
      case url.endsWith('/api/auth/login') && method === 'POST':
        // console.log('FakeBackend: Handling Login');
        return login();
      case url.endsWith('/api/auth/refresh-token') && method === 'POST':
        return refreshToken();
      case url.endsWith('/api/auth/revoke-token') && method === 'POST':
        return revokeToken();
      case url.endsWith('/api/users') && method === 'GET':
        return getUsers();
      case url.endsWith('/api/users') && method === 'POST':
        return createUser();
      case url.match(/\/api\/users\/\w+$/) && method === 'PUT':
        return updateUser();
      case url.match(/\/api\/users\/\w+$/) && method === 'DELETE':
        return deleteUser();
      default:
        return next(req);
    }
  }

  function login() {
    const { email, password } = body as any;
    const user = users.find((x) => x.Email === email);

    if (!user || password !== 'DevilsOffline!2025') {
      return error('Email or password is incorrect');
    }

    return ok({
      User: user,
      AccessToken: 'fake-jwt-token',
      RefreshToken: 'fake-refresh-token',
    });
  }

  function refreshToken() {
    return ok({
      User: users[0],
      AccessToken: 'fake-new-jwt-token',
      RefreshToken: 'fake-new-refresh-token',
    });
  }

  function revokeToken() {
    return ok({});
  }

  function getUsers() {
    return ok(users);
  }

  function createUser() {
    const user = body as any;
    user.UserId = user.UserId || (users.length + 1).toString();
    users.push(user);
    return ok(user);
  }

  function updateUser() {
    const params = url.split('/');
    const id = params[params.length - 1];
    const userIndex = users.findIndex(x => x.UserId === id);
    if (userIndex === -1) return error('User not found');
    
    const updatedUser = { ...users[userIndex], ...body as any };
    users[userIndex] = updatedUser;
    return ok(updatedUser);
  }

  function deleteUser() {
    const params = url.split('/');
    const id = params[params.length - 1];
    users = users.filter(x => x.UserId !== id);
    return ok();
  }

  function ok(body?: any) {
    return of(new HttpResponse({ status: 200, body })).pipe(delay(500));
  }

  function error(message: string) {
    return throwError(() => ({ error: { message } })).pipe(delay(500));
  }
};

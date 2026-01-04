import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root'
})
export class UserStorageService {

  constructor() { }

  public saveToken(token: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = window.localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  public getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  public signOut(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../authentication/services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject AuthService
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // If there is a token...
  if (authToken) {
    // Clone the current request and add the Authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
    // Send the new request with the header
    return next(authReq);
  }

  // If there is no token, send the original request without modification
  return next(req);
};

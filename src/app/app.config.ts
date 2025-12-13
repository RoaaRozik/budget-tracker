import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { inMemoryInterceptor } from './interceptors/in-memory.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Configure HTTP client with our custom in-memory interceptor
    provideHttpClient(
      withInterceptors([inMemoryInterceptor])
    ),
    provideAnimations()
  ]
};

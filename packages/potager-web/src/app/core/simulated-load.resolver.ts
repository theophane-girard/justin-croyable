import { type ResolveFn } from '@angular/router';
import { map, timer } from 'rxjs';

export const SIMULATED_RESOLVER_MS = 700;

export const simulatedLoadResolver: ResolveFn<boolean> = () =>
  timer(SIMULATED_RESOLVER_MS).pipe(map(() => true));

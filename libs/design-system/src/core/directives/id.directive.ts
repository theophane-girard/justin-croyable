import { Directive, inject, Injectable, input, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
class IdInternalService {
  private counter = 0;
  generate(prefix: string) {
    return `${prefix}-${++this.counter}`;
  }
}

@Directive({
  selector: '[appId]',
  exportAs: 'appId',
})
export class IdDirective {
  private idService = inject(IdInternalService);

  readonly idPrefix = input('ssr', { alias: 'appId' });

  readonly id = computed(() => this.idService.generate(this.idPrefix()));
}

import { ChangeDetectionStrategy, Component, computed, contentChildren, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { layoutVariants, type LayoutVariants } from './layout.variants';
import { SidebarComponent } from './sidebar.component';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-layout',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class LayoutComponent {
  readonly class = input<ClassValue>('');
  readonly direction = input<LayoutVariants>('auto');

  // Query for direct sidebar children to auto-detect layout direction
  private readonly sidebars = contentChildren(SidebarComponent, { descendants: false });

  private readonly detectedDirection = computed(() => {
    if (this.direction() !== 'auto') {
      return this.direction();
    }

    // Auto-detection: Check if there are any sidebar children
    const hasSidebar = this.sidebars().length > 0;
    return hasSidebar ? 'horizontal' : 'vertical';
  });

  protected readonly classes = computed(() =>
    mergeClasses(
      layoutVariants({
        direction: this.detectedDirection(),
      }),
      this.class(),
    ),
  );
}

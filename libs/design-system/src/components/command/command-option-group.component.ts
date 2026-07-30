import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { CommandOptionComponent } from './command-option.component';
import { CommandComponent } from './command.component';
import { commandGroupHeadingVariants, commandGroupVariants } from './command.variants';
import { mergeClasses } from '../../utils/merge-classes';

export abstract class CommandOptionGroup {
  abstract registerOption(option: CommandOptionComponent): void;
  abstract unregisterOption(option: CommandOptionComponent): void;
}

@Component({
  selector: 'app-command-option-group',
  template: `
    @if (isGroupVisible()) {
      <div [class]="classes()" role="group">
        @if (label()) {
          <div [class]="headingClasses()" role="presentation">
            {{ label() }}
          </div>
        }
        <div role="group">
          <ng-content />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'commandOptionGroup',
})
export class CommandOptionGroupComponent implements CommandOptionGroup {
  private readonly commandComponent = inject(CommandComponent, { optional: true });
  private readonly optionComponentsAsChildren = contentChildren(CommandOptionComponent, { descendants: true });
  private readonly registeredOptionComponents = signal<CommandOptionComponent[]>([]);

  readonly label = input.required<string>();
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(commandGroupVariants({}), this.class()));
  protected readonly headingClasses = computed(() => mergeClasses(commandGroupHeadingVariants({})));
  private readonly optionComponents = computed(() =>
    this.optionComponentsAsChildren().length ? this.optionComponentsAsChildren() : this.registeredOptionComponents(),
  );

  protected readonly isGroupVisible = computed(() => {
    if (!this.commandComponent || !this.optionComponents().length) {
      return true;
    }

    const searchTerm = this.commandComponent.searchTerm();
    // If no search term, show all groups
    if (!searchTerm) {
      return true;
    }

    const filteredOptions = this.commandComponent.filteredOptions();
    // Check if any option in this group is in the filtered list
    return this.optionComponents().some(option => filteredOptions.includes(option));
  });

  registerOption(option: CommandOptionComponent) {
    this.registeredOptionComponents.update(current => [...current, option]);
  }

  unregisterOption(option: CommandOptionComponent) {
    this.registeredOptionComponents.update(current => current.filter(o => o !== option));
  }
}

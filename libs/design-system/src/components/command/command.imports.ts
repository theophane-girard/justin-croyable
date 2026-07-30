import { CommandDividerComponent } from './command-divider.component';
import { CommandEmptyComponent } from './command-empty.component';
import { CommandInputComponent } from './command-input.component';
import { CommandListComponent } from './command-list.component';
import { CommandOptionGroupComponent } from './command-option-group.component';
import { CommandOptionComponent } from './command-option.component';
import { CommandComponent } from './command.component';

export const CommandImports = [
  CommandComponent,
  CommandInputComponent,
  CommandListComponent,
  CommandEmptyComponent,
  CommandOptionComponent,
  CommandOptionGroupComponent,
  CommandDividerComponent,
] as const;

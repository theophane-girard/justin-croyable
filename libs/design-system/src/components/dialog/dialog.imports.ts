import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { ButtonComponent } from '../button';
import { DialogComponent } from './dialog.component';

export const DialogImports = [ButtonComponent, DialogComponent, OverlayModule, PortalModule] as const;

import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

import { SheetComponent } from './sheet.component';

export const SheetImports = [SheetComponent, OverlayModule, PortalModule] as const;

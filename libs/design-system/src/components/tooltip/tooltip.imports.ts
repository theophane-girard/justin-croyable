import { OverlayModule } from '@angular/cdk/overlay';

import { TooltipComponent, TooltipDirective } from './tooltip';

export const TooltipImports = [TooltipComponent, TooltipDirective, OverlayModule] as const;

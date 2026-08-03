import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ResumePageComponent } from './resume-page.component';

@Component({
  selector: 'app-resume-root',
  imports: [ResumePageComponent],
  template: `<app-resume-page />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

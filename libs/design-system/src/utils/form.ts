import { InjectionToken } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

export const PARENT_FORM = new InjectionToken<FieldTree<unknown>>('PARENT_FORM');

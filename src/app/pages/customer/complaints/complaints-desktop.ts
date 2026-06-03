import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintsPage } from './complaints';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-complaints-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './complaints-desktop.html'
})
export class ComplaintsDesktopComponent {
  parent = input.required<ComplaintsPage>();
}

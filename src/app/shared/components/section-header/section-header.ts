import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './section-header.html'
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description = '';
  @Input() actionText = '';
  @Input() actionLink = '';
  @Input() actionParams: any = null;
}

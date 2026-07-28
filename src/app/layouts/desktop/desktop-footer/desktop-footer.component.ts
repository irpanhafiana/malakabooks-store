import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-desktop-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './desktop-footer.component.html',
  styleUrl: './desktop-footer.component.css'
})
export class DesktopFooterComponent {
  currentYear = new Date().getFullYear();
}

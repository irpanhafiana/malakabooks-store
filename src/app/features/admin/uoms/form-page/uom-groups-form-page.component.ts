import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { UomGroupStore } from '../../../../store/uom-group.store';
import { UomGroup } from '../../../../core/models';
import { UomGroupsFormComponent } from '../form/uom-groups-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

@Component({
  selector: 'app-uom-groups-form-page',
  standalone: true,
  imports: [UomGroupsFormComponent, IconComponent, AdminButtonComponent],
  templateUrl: './uom-groups-form-page.component.html'
})
export class UomGroupsFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly uomGroupStore = inject(UomGroupStore);

  @ViewChild(UomGroupsFormComponent) uomGroupsForm!: UomGroupsFormComponent;

  editUomGroup = signal<UomGroup | null>(null);
  pageTitle = signal<string>('Tambah Master UoM');

  ngOnInit() {
    this.uomGroupStore.loadUomGroups();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.pageTitle.set('Edit Master UoM');
        const group = this.uomGroupStore.uomGroups()?.find(g => g.id === id);
        if (group) {
          this.editUomGroup.set(group);
        } else {
          setTimeout(() => {
            const loadedGroup = this.uomGroupStore.uomGroups()?.find(g => g.id === id);
            if (loadedGroup) this.editUomGroup.set(loadedGroup);
          }, 500);
        }
      } else {
        this.pageTitle.set('Tambah Master UoM');
        this.editUomGroup.set(null);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/uoms']);
  }

  onSave() {
    this.router.navigate(['/admin/uoms']);
  }
}

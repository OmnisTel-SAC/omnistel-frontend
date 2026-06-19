import { Component, input } from '@angular/core';
import { ImageModule } from 'primeng/image';
import type { AttachmentResponse } from '../../../core/models/attachment';

@Component({
  selector: 'app-file-attachment',
  imports: [ImageModule],
  template: `
    @if (isImage()) {
      <p-image [src]="attachment().fileUrl" [preview]="true" width="150" />
    } @else {
      <a [href]="attachment().fileUrl" target="_blank">
        <i class="pi pi-file-pdf"></i> {{ attachment().fileName }}
      </a>
    }
  `,
  styles: [`
    a { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: var(--color-dark); }
    a:hover { background: #f5f5f5; }
  `]
})
export class FileAttachmentComponent {
  readonly attachment = input.required<AttachmentResponse>();
  readonly isImage = () => /\.(jpg|jpeg|png|gif|webp)$/i.test(this.attachment().fileName);
}

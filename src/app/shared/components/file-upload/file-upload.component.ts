import { Component, input, output } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-file-upload',
  imports: [FileUploadModule],
  template: `
    <p-fileUpload
      mode="basic"
      name="file"
      [accept]="accept()"
      [maxFileSize]="maxFileSize()"
      (onSelect)="onSelect.emit($event)">
    </p-fileUpload>
  `
})
export class FileUploadComponent {
  readonly accept = input('image/jpeg,image/png,image/gif,image/webp,application/pdf,.txt,.csv');
  readonly maxFileSize = input(10485760);
  readonly onSelect = output<any>();
}

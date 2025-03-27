import { Component, OnDestroy } from '@angular/core';
import { FileUploadService } from '../Services/file-upload.service';
import { Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload-template.html',
  styleUrls: ['./file-upload-styles.scss']
})
export class FileUploadComponent implements OnDestroy {
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  fileName = '';
  uploadStatus: 'initial' | 'uploading' | 'success' | 'error' = 'initial';
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(private fileUploadService: FileUploadService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0]);
    }
  }

   
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  private handleFileSelection(file: File) {
    if (!file.name.endsWith('.csv')) {
      this.errorMessage = 'Por favor, seleccione un archivo CSV válido';
      this.uploadStatus = 'error';
      return;
    }

    this.fileName = file.name;
    this.uploadStatus = 'uploading';
    this.isUploading = true;
    this.errorMessage = '';

    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.fileUploadService.uploadRawFile(file,'/api/EmpleadoDesempenoes/upload')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          clearInterval(progressInterval);
          this.isUploading = false;
          this.uploadProgress = 100;
        })
      )
      .subscribe({
        next: (response) => {
          this.uploadStatus = 'success';
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        },
        error: (error) => {
          this.uploadStatus = 'error';
          this.errorMessage = 'Error al cargar el archivo. Por favor, intente nuevamente.';
        }
      });
  }

  resetForm() {
    this.uploadStatus = 'initial';
    this.uploadProgress = 0;
    this.fileName = '';
    this.errorMessage = '';
  }
}

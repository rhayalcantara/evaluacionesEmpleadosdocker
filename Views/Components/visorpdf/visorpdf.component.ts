import { Component,  Inject,  OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-visorpdf',
  templateUrl: './visorpdf.component.html',
  styleUrls: ['./visorpdf.component.css']
})
export class VisorpdfComponent implements OnInit {
  url:any
  constructor(      @Inject(MAT_DIALOG_DATA) public data:any,
  public dialogRef: MatDialogRef<VisorpdfComponent>,) { }

  ngOnInit(): void {
    const targetElement =  document.querySelector('iframe')
    console.log('targetElement',targetElement,'url',this.data.url)
    if (targetElement != null){
      targetElement.src=this.data.url  
    }

  }
  close(){
    this.dialogRef.close();
  }
}

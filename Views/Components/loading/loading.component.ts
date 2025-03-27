import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone:true,
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit,AfterContentChecked {

  constructor(private dialogRef: MatDialogRef<LoadingComponent>) { }
  ngAfterContentChecked(): void {
  //   let top:number =document.getElementById('loadingdiv')?.getBoundingClientRect().top ?? 0
  //   if(top<=0){     
  //     this.dialogRef.updatePosition({top:`-300px`,left:`350px`})
  //   }else{
  //     if(top>500)
  //     this.dialogRef.updatePosition({top:`-${top}px`,left:`350px`})
  //   }
  // 
}

  ngOnInit() {

    //this.dialogRef.updateSize('15%','190px')
  }
    
}

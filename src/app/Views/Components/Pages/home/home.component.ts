import { Component, OnInit } from '@angular/core';
import { TableResponse } from 'src/app/Helpers/Interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  
  public term: string='';
  public campos:string[]=[
    '#',
    'Descripcion',
    'Cantidad   ',
    'Unidad     '
    
  ]
  public arraydatos:any[]=
  [
    {
      '#':1,
      'Descripcion':'Papel',
      'Cantidad':1,
      'Unidad':'Faldo'
    },
    {
      '#':2,
      'Descripcion':'Cafe',
      'Cantidad':1,
      'Unidad':'Sobre'
    },
    {
      '#':3,
      'Descripcion':'Azucar',
      'Cantidad':1,
      'Unidad':'Libras'
    },
    {
      '#':4,
      'Descripcion':'Agua',
      'Cantidad':1,
      'Unidad':'Botellon'
    }
  ]
  constructor() { }

  ngOnInit(): void {

  }
  onPageChange(event:any){}
  opcion(event:TableResponse){
    console.log(event)
  }
  filter(){
    console.log(this.term)
  }
}

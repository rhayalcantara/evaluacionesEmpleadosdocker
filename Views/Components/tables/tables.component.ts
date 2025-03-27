import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TableResponse, TipoCampo } from 'src/app/Helpers/Interfaces';
import { UtilsService } from 'src/app/Helpers/utils.service';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';

@Component({
  standalone:true,
  imports:[NgIf,NgFor,NgxPaginationModule,CommonModule,ReactiveFormsModule ],
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.css']
})
export class TablesComponent implements OnInit {

  @Input() config:any;
  public labels: any;
  public ancho:string=''
  public totalr :number=0;
  id:string=''
  @Input() campos:string[] =[]
  @Input() tipocampo:TipoCampo[]=[]
  @Input() titulos:string[]=[]
  @Input() arraydatos:any[]=[]
  @Input() campokey:string=''
  @Input() term:string=''
  @Input() selected:boolean=false
  @Input() deleted:boolean=false
  @Input() currentPage:number=0
  @Input() totalregistros:number=0
  @Output() accion = new EventEmitter<TableResponse>();
  @Output() paginacambio = new EventEmitter<number>();
  @Output() idtable = new EventEmitter<string>();
  @Output() botoncampo = new EventEmitter<TableResponse>();

  // New properties for sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private cd: ChangeDetectorRef, 
    private ServiceComunicacion:ComunicacionService,) { 
    this.id =UtilsService.generaNss()
    this.config= {
      id:this.id,
       itemsPerPage: 5,
       currentPage: 1,
       totalItems: 0
     };
    this.labels = {
      previousLabel: "<",
      nextLabel: ">",
      screenReaderPaginationLabel: "paginacion",
      screenReaderPageLabel: "paginacion1",
      screenReaderCurrentLabel: "paginacion2"
    };
    this.ServiceComunicacion.enviarMensajeObservable.subscribe({next:(mensaje:any)=>{
      this.actualizaelconfig(mensaje)   
    }})
  }

  actualizaelconfig(tt:any){
    this.calculaancho()
    if(tt.id==this.id){
      this.config.totalItems=tt.totalItems
      this.config.itemsPerPage=tt.itemsPerPage
      console.log('itemsPerPage',this.config.itemsPerPage)
      this.cd.detectChanges();
    }
  }

  ngOnInit(): void {
    this.calculaancho()
    this.config.id = this.id
    this.idtable.emit(this.id)        
    this.cd.detectChanges(); 
  }

  calculaancho(){
    if (this.campos.length>0){
      this.ancho=(90/this.campos.length+1).toFixed(2)+'%'
    }else{
      this.ancho='50.00%'
    }
  }

  onPageChange(event:any){
    this.config.currentPage = event;
    this.currentPage = event
    this.paginacambio.emit(this.currentPage)
  }

  opcion(row:object,acc:string){
    let tr:TableResponse ={
      key: row,
      option: acc
    }
    this.accion.emit(tr);
  }

  // New method to handle sorting
  sort(column: string) {
    if (this.sortColumn === column) {
      // If the same column is clicked, reverse the sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If a new column is clicked, set it as the sort column and default to ascending order
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Sort the array
    this.arraydatos.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // Trigger change detection
    this.cd.detectChanges();
  }
}

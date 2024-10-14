import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatosServiceService } from '../Services/datos-service.service';
import * as pdfMake from "pdfmake/build/pdfmake"; 
import * as pdfFonts from "pdfmake/build/vfs_fonts";
// import { IProductDts } from '../Models/Product/IProduct';
import { MatDialog } from '@angular/material/dialog';


(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(private tool:DatosServiceService){}

  static  formatDateForInput(d: string): string {
    let date = new Date(d)
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript van de 0-11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  static automappesimple<T>(obj_source:any,obj_destiny:any){
    
    let campos:string[]=Object.keys(obj_destiny)
    campos.map(ele=>{
      if (typeof(obj_destiny[ele])=='object' && 
        Object.prototype.toString.call(obj_destiny[ele])!='[object Date]' )
      {
        
        if (!Array.isArray(obj_source[ele]))
        {
          let incampos = Object.keys(obj_destiny[ele])
          for (let incontrol of incampos){
            obj_destiny[ele][incontrol]=obj_source[ele][incontrol]
          }
        }
      }
      else
      {
        obj_destiny[ele] = obj_source[ele]
      }    
            
    })
  }

static  generaNss() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < charactersLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
 static downloadAsPDF(pagos:any[],titulo:string,titulos:any[],Orientacion:string):any {
      let result:string=''
      let campos:string[]=[]
    
      titulos.map(x=>{        
        campos.push(...Object.keys(x))
      })
     
      let titulos1:any[]=[];
      let titulos2:any[]=[]; 
      let titulos3:any[]=[];
      let conwhit:string[]=[];
      //let porciento:string=(125/campos.length).toFixed(2);
      let n:number=0;

      titulos.forEach(x=>{
        n++;        
  
        if (n==1){
          titulos2.push({text:titulo, style: 'subheader',colSpan:campos.length, alignment: 'center'})
          conwhit.push(`*`);
        }else{
          titulos2.push({text:''})
          conwhit.push(`auto`);      
        }
        //console.log(Object.keys(x)[0])
       titulos3.push({text: x[Object.keys(x)[0]],style: 'tableHeader', alignment: 'center' })
        
      })
  
    var array :any[][] = []
  
    pagos.map(p=>{
      let rww:any[]=[]
      campos.map(x=>{
        rww.push({text:`${p[x]}`,fontSize:8}) 
      })
      array.push(rww)
    })    
  
    const documentDefinition:any = { 
        pageSize: 'LETTER',
        pageMargins: [ 40, 60, 10, 60 ],
        //pageOrientation: 'landscape',
        pageOrientation:Orientacion,
        footer: function(currentPage:number) { 
          return [
              {text: 'Rhay Alcantara Programador (809-303-8210)',fontSize:8 ,alignment:  'center' },
              {text: 'Pag:'+currentPage.toString() ,alignment:  'right',margin: [ 0, 0, 50, 0 ] }  ]
        },
        content:[{
          text: 'CoopAspire',
          fontSize: 16,
          alignment: 'center',
          color: '#047886'
        },
        {
          text: titulo,
          fontSize: 14,
          alignment: 'center',
          margin:[0,0,0,10]
        },
        {
          layout: 'lightHorizontalLines',
          style:'tableExample',
          table:{
          widths: [...conwhit],
          headerRows: 1,        
          body: [ titulos3,
          ...array]
          }
        }
   ],	styles: {
		header: {
			fontSize: 18,
			bold: true,
			margin: [0, 0, 0, 10]
		},
		subheader: {
			fontSize: 16,
			bold: true,
			margin: [0, 10, 0, 5]
		},
		tableExample: {
			margin: [10, 5, 10, 15]
		},
		tableHeader: {
			bold: true,
			fontSize: 13,
			color: 'black'
		}
	},
	defaultStyle: {
		// alignment: 'justify'
	}
    };    
 
    console.log(documentDefinition)
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    // return null
    return pdfDocGenerator
      
      // pdfMake.createPdf(documentDefinition).open();
      //.download(); 
      // pdfMake.createPdf(documentDefinition).getDataUrl().then((dataUrl) => {
      //   console.log(dataUrl);
      //   const dialogRef = this.toastr.open(VisorpdfComponent,{width:"85%" ,height:"70%" ,data:{url:dataUrl}});
      //   dialogRef.afterClosed().subscribe(result => {
      //     console.log(result);
      //   })
      // }, err => {
      //   console.error(err);
      // });
       
    }
  static  capitalizeFirstLetter(texto:string):string {
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

/*
    static generatePDF(action = 'open',invoice:IProductDts[]) {
      let campos:string[] = Object.keys(invoice[0])
      let i:number = 0
      let docDefinition:any = {
        content: [
          {
            text: 'CoopAspire',
            fontSize: 16,
            alignment: 'center',
            color: '#047886'
          },
          {
            text: 'Productos de Inventario',
            fontSize: 20,
            bold: true,
            alignment: 'center',
            decoration: 'underline',
            color: 'skyblue'
          },
          
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto','auto', 'auto', 'auto'],
              body: [
                ['Product', 'Tipo', 'Modelo','Marca','Serial','Referencia', 'Existencia'],
                ...invoice.map(p => ([p.descripcion,p.product_Type,p.modelo,p.marca,p.serial,p.referencia,p.existencia_actual])),
                [{text: 'Total ', colSpan: 7}, {}, {},{}, {},{}, invoice.reduce((sum, p)=> sum + (1), 0).toFixed(2)]
              ]
            }
          },
        ],
        styles: {
          sectionHeader: {
            bold: true,
            decoration: 'underline',
            fontSize: 14,
            margin: [0, 15,0, 15]          
          }
        }
      };
      console.log(docDefinition)
      if(action==='download'){
       // pdfMake.createPdf(docDefinition).download();
      }else if(action === 'print'){
      //  pdfMake.createPdf(docDefinition).print();      
      }else{
      //  pdfMake.createPdf(docDefinition).open();      
      }
  
    }
*/


    private message = new BehaviorSubject<string>('');
    public customMessage = this.message.asObservable();
    
    public changeMessage(msg: string): void {
      this.message.next(msg);
    }


}

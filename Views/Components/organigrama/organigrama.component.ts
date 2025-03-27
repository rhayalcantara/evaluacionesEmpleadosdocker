import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { IEmpleado } from '../../../Models/Empleado/IEmpleado';
import { Empleados } from '../../../Controllers/Empleados';
import { IPeriodo } from '../../../Models/Periodos/IPeriodo';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organigrama',
  templateUrl: './organigrama.component.html',
  styleUrls: ['./organigrama.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class OrganigramaComponent implements OnInit, OnDestroy {
  @ViewChild('organigramaContainer') organigramaContainer!: ElementRef;
  
  empleados: IEmpleado[] = [];
  empleadosFiltrados: IEmpleado[] = [];
  searchTerm: string = '';
  searchField: 'nombre' | 'cargo' = 'nombre';
  subordinados: IEmpleado[] = [];
  jerarquia: IEmpleado[] = []; // Track navigation path
  isLoading = new BehaviorSubject<boolean>(false);
  error = new BehaviorSubject<string | null>(null);
  selectedEmpleado: IEmpleado | null = null;
  private destroy$ = new Subject<void>();
  
  periodoActual: IPeriodo = {
    id: 0,
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    activa: true,
    estadoid: 1
  };

  constructor(private empleadosService: Empleados) {}

  ngOnInit() {
    this.loadEmpleados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmpleados() {
    this.isLoading.next(true);
    this.error.next(null);
    
    try {
      this.empleadosService.TRegistros
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // Filter active employees and get highest level
          const activeEmployees = this.empleadosService.arraymodel
            .filter((emp: IEmpleado) => emp.codigoestado === 'A');
          
          if (activeEmployees.length > 0) {
            // Find highest level
            const maxLevel = Math.max(...activeEmployees.map(emp => emp.nivel));
            // Get employees with highest level
            this.empleados = activeEmployees
              .filter(emp => emp.nivel === maxLevel)
              .sort((a, b) => a.nombreunido.localeCompare(b.nombreunido));
            
            this.filterEmpleados();
          }
          
          this.isLoading.next(false);
        });

      this.empleadosService.getdatos();
    } catch (err) {
      this.error.next('Error al cargar los empleados');
      this.isLoading.next(false);
    }
  }

  mostrarSubordinados(empleado: IEmpleado) {
    this.isLoading.next(true);
    this.error.next(null);
    this.selectedEmpleado = empleado;

    try {
      this.empleadosService.model = empleado;
      // Use Getsub to get subordinates
      this.empleadosService.Getsub(empleado.secuencial.toString(), 
        this.periodoActual.fechaFin.toISOString().split('T')[0])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.subordinados = response.data
              .filter((emp: IEmpleado) => emp.codigoestado === 'A')
              .sort((a: IEmpleado, b: IEmpleado) => a.nombreunido.localeCompare(b.nombreunido));
            
            // Add to navigation path if not already present
            if (!this.jerarquia.find(emp => emp.secuencial === empleado.secuencial)) {
              this.jerarquia.push(empleado);
            }
            
            this.isLoading.next(false);
          },
          error: (err) => {
            this.error.next('Error al cargar subordinados');
            this.isLoading.next(false);
          }
        });
    } catch (err) {
      this.error.next('Error al cargar subordinados');
      this.isLoading.next(false);
    }
  }

  navegarA(empleado: IEmpleado) {
    const index = this.jerarquia.findIndex(emp => emp.secuencial === empleado.secuencial);
    if (index !== -1) {
      this.jerarquia = this.jerarquia.slice(0, index + 1);
      this.mostrarSubordinados(empleado);
    }
  }

  subirNivel() {
    if (this.jerarquia.length > 1) {
      this.jerarquia.pop(); // Remove current level
      const empleadoAnterior = this.jerarquia[this.jerarquia.length - 1];
      this.mostrarSubordinados(empleadoAnterior);
    } else {
      this.jerarquia = [];
      this.subordinados = [];
      this.selectedEmpleado = null;
      this.loadEmpleados();
    }
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/user.png';
    }
  }

  filterEmpleados() {
    if (!this.searchTerm) {
      this.empleadosFiltrados = this.empleados;
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter(emp => {
      if (this.searchField === 'nombre') {
        return emp.nombreunido.toLowerCase().includes(searchTermLower);
      } else {
        return emp.cargo.toLowerCase().includes(searchTermLower);
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.filterEmpleados();
  }

  onSearchFieldChange(field: 'nombre' | 'cargo') {
    this.searchField = field;
    this.filterEmpleados();
  }

  exportarSVG() {
    if (!this.organigramaContainer) return;

    // Crear el SVG con fondo blanco
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('width', '1600');
    svg.setAttribute('height', '1000');
    svg.setAttribute('viewBox', '0 0 1600 1000');
    svg.setAttribute('style', 'background-color: white;');

    // Definir estilos
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      text {
        font-family: Arial, sans-serif;
      }
      .empleado-group {
        cursor: pointer;
      }
      .empleado-group:hover .hexagon {
        stroke: #3b5998;
        stroke-width: 3;
      }
      .nombre-text {
        font-weight: bold;
        font-size: 14px;
        fill: #333;
      }
      .cargo-text {
        font-size: 12px;
        fill: #666;
      }
      .linea {
        stroke: #e6e9f0;
        stroke-width: 2;
      }
    `;
    defs.appendChild(style);
    svg.appendChild(defs);

    // Función para crear un empleado en SVG
    const crearEmpleadoSVG = (empleado: IEmpleado, x: number, y: number) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${x}, ${y})`);
      g.setAttribute('class', 'empleado-group');

      // Fondo hexagonal
      const hex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hex.setAttribute('class', 'hexagon');
      hex.setAttribute('d', 'M60 0 L120 30 L120 90 L60 120 L0 90 L0 30 Z');
      hex.setAttribute('fill', 'white');
      hex.setAttribute('stroke', '#e6e9f0');
      hex.setAttribute('stroke-width', '2');
      g.appendChild(hex);

      // Definir el clipPath para la imagen
      const clipPathId = `hexClip_${Math.random().toString(36).substr(2, 9)}`;
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipPathId);
      const clipPathHex = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      clipPathHex.setAttribute('d', 'M60 0 L120 30 L120 90 L60 120 L0 90 L0 30 Z');
      clipPath.appendChild(clipPathHex);
      defs.appendChild(clipPath);

      // Imagen con ruta absoluta
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      const absolutePath = window.location.origin + '/evaluacionesEmpleados/assets/user.png';
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', absolutePath);
      image.setAttribute('x', '0');
      image.setAttribute('y', '0');
      image.setAttribute('width', '120');
      image.setAttribute('height', '120');
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      image.setAttribute('clip-path', `url(#${clipPathId})`);
      g.appendChild(image);

      // Nombre
      const nombre = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nombre.setAttribute('class', 'nombre-text');
      nombre.setAttribute('x', '60');
      nombre.setAttribute('y', '150');
      nombre.setAttribute('text-anchor', 'middle');
      nombre.textContent = empleado.nombreunido;
      g.appendChild(nombre);

      // Cargo
      const cargo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cargo.setAttribute('class', 'cargo-text');
      cargo.setAttribute('x', '60');
      cargo.setAttribute('y', '170');
      cargo.setAttribute('text-anchor', 'middle');
      cargo.textContent = empleado.cargo;
      g.appendChild(cargo);

      return g;
    };

    // Dibujar el organigrama
    let yOffset = 50;
    
    if (this.selectedEmpleado) {
      // Jefe seleccionado
      const jefe = crearEmpleadoSVG(this.selectedEmpleado, 740, yOffset);
      svg.appendChild(jefe);
      yOffset += 250;

      // Línea conectora vertical
      if (this.subordinados.length > 0) {
        const lineaVertical = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineaVertical.setAttribute('class', 'linea');
        lineaVertical.setAttribute('x1', '800');
        lineaVertical.setAttribute('y1', `${yOffset - 80}`);
        lineaVertical.setAttribute('x2', '800');
        lineaVertical.setAttribute('y2', `${yOffset - 30}`);
        svg.appendChild(lineaVertical);
      }

      // Subordinados
      if (this.subordinados.length > 0) {
        const spacing = 200;
        const startX = 800 - ((this.subordinados.length - 1) * spacing) / 2;
        
        // Línea horizontal
        if (this.subordinados.length > 1) {
          const lineaHorizontal = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          lineaHorizontal.setAttribute('class', 'linea');
          lineaHorizontal.setAttribute('x1', `${startX}`);
          lineaHorizontal.setAttribute('y1', `${yOffset - 30}`);
          lineaHorizontal.setAttribute('x2', `${startX + ((this.subordinados.length - 1) * spacing)}`);
          lineaHorizontal.setAttribute('y2', `${yOffset - 30}`);
          svg.appendChild(lineaHorizontal);
        }

        // Dibujar subordinados
        this.subordinados.forEach((sub, index) => {
          const x = startX + (index * spacing);
          const empleado = crearEmpleadoSVG(sub, x - 60, yOffset);
          svg.appendChild(empleado);
        });
      }
    } else if (this.empleadosFiltrados.length > 0) {
      // Vista inicial con todos los empleados
      const spacing = 200;
      const startX = 800 - ((this.empleadosFiltrados.length - 1) * spacing) / 2;
      
      this.empleadosFiltrados.forEach((emp, index) => {
        const x = startX + (index * spacing);
        const empleado = crearEmpleadoSVG(emp, x - 60, yOffset);
        svg.appendChild(empleado);
      });
    }

    // Convertir a string y descargar
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'organigrama.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }
}

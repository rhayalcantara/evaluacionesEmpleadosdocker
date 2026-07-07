import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { SegurityService } from './segurity.service';
import { DatosServiceService } from './datos-service.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private segurityService: SegurityService,
    private datos: DatosServiceService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const rolesPermitidos: number[] = route.data['roles'] || [];
    if (rolesPermitidos.length === 0) {
      return true;
    }

    const rolId = this.segurityService.getRolId();
    if (rolesPermitidos.includes(rolId)) {
      return true;
    }

    this.datos.showMessage('No tiene permisos para acceder a esta página.', 'Acceso Denegado', 'error');
    this.router.navigate(['/Home']);
    return false;
  }
}

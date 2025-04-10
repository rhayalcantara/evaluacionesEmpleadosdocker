import { IEmpleado } from '../Empleado/IEmpleado';

// Interfaz para representar la clase Consejal_team
export interface IConsejalTeam {
  id: number;
  consejalId: number;
  empleadoSecuencial: number;
  Empleado: IEmpleado;
}


// Interfaz para representar la clase Consejal
export interface IConsejal {
  id: number;
  identificacion?: string | null; // string opcional o que puede ser null
  nombreunido?: string | null;    // string opcional o que puede ser null
  consejal_Team: IConsejalTeam[];  // Array de IConsejalTeam (equivalente a List<>)
}

// --- Explicación ---
// 1. Clases a Interfaces: En TypeScript, para definir la "forma" de un objeto (especialmente datos), se suelen usar interfaces. El prefijo 'I' es una convención común.
// 2. Tipos:
//    - `int` en C# se convierte en `number` en TypeScript.
//    - `string?` en C# (string nullable) se puede representar como `string | null` (puede ser string o null) o como una propiedad opcional `identificacion?: string` (puede ser string o undefined). Usar `string | null` es a menudo más explícito si la API realmente puede devolver `null`. Usar `?: string` es común si la propiedad podría simplemente no estar presente. He incluido ambas opciones comunes (`?: string | null`) para cubrir ambos casos, pero puedes elegir la que mejor se adapte a tu API.
//    - `List<T>` en C# se convierte en un array `T[]` en TypeScript.
// 3. Nomenclatura: Las propiedades en TypeScript suelen usar `camelCase` (ej. `nombreunido`, `consejalTeam`) en lugar de `PascalCase` (ej. `NombreUnido`, `Consejal_Team`) que es más común en C#. He ajustado `ConsejalId` a `consejalId`, `EmpleadoSecuencial` a `empleadoSecuencial` y `Consejal_Team` a `consejalTeam`.
// 4. Inicialización: La inicialización `= new List<Consejal_team>()` en C# no se traduce directamente a la interfaz, ya que la interfaz solo define la estructura. Cuando crees un objeto que implemente `IConsejal`, te asegurarás de que `consejalTeam` sea un array (puede ser vacío `[]`).
// 5. `export`: Se añade `export` para que estas interfaces puedan ser importadas y usadas en otros archivos TypeScript de tu proyecto.

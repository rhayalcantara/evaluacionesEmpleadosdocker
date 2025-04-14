import { IEmpleado } from '../Empleado/IEmpleado';

// Interfaz para representar la clase Consejal_team
export interface IConsejalTeam {
  id: number;
  consejalId: number;
  empleadoSecuencial: number;
  empleado: IEmpleado;
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

/**
 * Interface representing the Consejal_Clave entity.
 */
export interface IConsejalClave {
  /**
   * Primary key identifier.
   * Corresponds to C# [Key] public int id
   */
  id: number;

  /**
   * Foreign key referencing the Consejal.
   * Corresponds to C# [Required] public int ConsejalId
   */
  consejalId: number;

  /**
   * Username associated with the Consejal.
   * Corresponds to C# public string usuario
   */
  usuario: string;

  /**
   * Password associated with the Consejal.
   * Corresponds to C# public string password
   * NOTE: Storing plain text passwords is a security risk. Consider hashing.
   */
  password: string;

  /**
   * Navigation property to the related Consejal.
   * Corresponds to C# public virtual Consejal? Consejal
   * It's optional (?) because it might not always be loaded/included.
   * It can be IConsejal or null, matching the C# nullable reference type Consejal?
   */
  consejal?: IConsejal | null;
}

// --- Explanation ---
// 1.  `export interface IConsejalClave`: Defines a TypeScript interface named `IConsejalClave`. The `export` keyword makes it available for import in other files. The `I` prefix is a common convention for interfaces.
// 2.  `id: number;`: C# `int` becomes `number` in TypeScript. The `[Key]` attribute is specific to data persistence frameworks (like Entity Framework) and doesn't have a direct structural equivalent in the interface itself.
// 3.  `consejalId: number;`: C# `int ConsejalId` becomes `consejalId: number;`. The `[Required]` attribute implies it's non-nullable, which is the default for `number` unless `| null` or `| undefined` is added. Naming convention changed from PascalCase (`ConsejalId`) to camelCase (`consejalId`).
// 4.  `usuario: string;`: C# `string` becomes `string`. The default initializer (`= ""`) in C# doesn't translate to the interface definition but suggests the property is expected to be a non-null string.
// 5.  `password: string;`: Same as `usuario`.
// 6.  `consejal?: IConsejal | null;`:
//     *   `Consejal? Consejal`: This is a nullable navigation property in C#.
//     *   `IConsejal`: Assumes you have an `IConsejal` interface defined (like the one in your context). You need to import it.
//     *   `| null`: Represents the C# `?` (nullable), meaning the value can explicitly be `null`.
//     *   `?`: The property name suffix `?` makes the property *optional* in the TypeScript interface. This means the property might not be present on the object at all (i.e., it could be `undefined`). This is often useful for navigation properties that might not be loaded or sent in every API response.
//     *   `virtual` and `[ForeignKey]` attributes are ORM/framework-specific and don't translate to the TypeScript interface structure.
export interface IPerspectiva{
    id: number;
    planExtrategicoModelId: number;
    nombre: string;
    peso: number;
    planExtrategicoModel?: any; // Propiedad de navegación EF Core - siempre null en requests
}
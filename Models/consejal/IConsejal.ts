import { IConsejalTeam } from "./IConsejalTeam"; // Import the related interface

export interface IConsejal {
  id: number;
  identificacion: string;
  nombreunido: string;
  consejal_Team: IConsejalTeam[]; // Use the imported interface
}

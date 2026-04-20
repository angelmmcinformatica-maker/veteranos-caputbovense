/**
 * Datos de la tabla de Deportividad (Fair Play) de la liga Caputbovense.
 *
 * REGLA DE ORO: El equipo con mayor puntuación de deportividad gana el factor cancha
 * en las eliminatorias de Play-off a partido único.
 *
 * Volcar / actualizar los datos aquí. La tabla se ordenará automáticamente
 * por totalPoints descendente en la vista.
 */

export interface FairPlayEntry {
  team: string;
  yellowCards: number;
  redCards: number;
  /** Puntos de sanción acumulados (negativos sobre el total). */
  sanctionPoints: number;
  /** Puntos totales de deportividad (mayor = mejor). */
  totalPoints: number;
}

export const deportividadData: FairPlayEntry[] = [
  { team: 'Vulebar Texeira Don Benito', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 86 },
  { team: 'Meson Los Barros Don Benito', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 79 },
  { team: 'Santa Amalia Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 72 },
  { team: 'Amazonia Orellana', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 71 },
  { team: 'AD Caputbovense', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 70 },
  { team: 'Inter Don Benito Polo Opuesto', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 67 },
  { team: 'CD Gargaligas', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 62 },
  { team: 'Valdivia Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 59 },
  { team: 'Agricola Merchan Vva.', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 58 },
  { team: 'Campanario Atletico', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 56 },
  { team: 'Campanario Interserena', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 55 },
  { team: 'Transtello Miajadas', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 51 },
  { team: 'Sporting Don Benito', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 51 },
  { team: 'Valdehornillos Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 51 },
  { team: 'AD Alcuescar', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 49 },
  { team: 'Hernan Cortes Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 49 },
  { team: 'CD Veteranos Ruecas', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 47 },
  { team: 'Zalamea Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 47 },
  { team: 'San Bartolome Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 46 },
  { team: 'Talarrubias Veteranos', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 44 },
  { team: 'Palazuelo Santa Teresa', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 44 },
  { team: 'Docenario Atletico', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 41 },
  { team: 'V. Bar La Tasca Miajadas', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 30 },
  { team: 'CP Rena', yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 16 },
];

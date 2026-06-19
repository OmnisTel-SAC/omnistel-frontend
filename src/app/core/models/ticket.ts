export type TicketStatus =
  | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS'
  | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketCategory =
  | 'SIN_CONEXION' | 'VELOCIDAD_LENTA' | 'PROBLEMAS_CON_EL_ROUTER'
  | 'INSTALACION_TECNICA' | 'CAMBIO_DE_PLAN' | 'FACTURACION_Y_PAGOS'
  | 'PROBLEMAS_DE_TELEFONIA' | 'MANTENIMIENTOS' | 'OTROS';

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  clientId: number;
  agentId: number | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface TicketStatusUpdateRequest {
  status: TicketStatus;
  agentId?: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  timestamp: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    byRole: {
      admin: number;
      veterinarian: number;
      petOwner: number;
    };
  };
  pets: {
    total: number;
    bySpecies: {
      species: string;
      count: number;
    }[];
  };
  security: {
    totalLogs: number;
    loginsSuccessToday: number;
    loginsFailedToday: number;
    totalSecurityAlerts: number;
    recentLogs: AuditLog[];
  };
  system: {
    status: string;
    database: string;
    uptime: string;
    uptimeSeconds: number;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    nodeVersion: string;
    platform: string;
    environment: string;
  };
}

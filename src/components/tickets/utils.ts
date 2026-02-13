export function getStatusLabel(status: string) {
  switch (status) {
    case "OPEN": return "Aberto"
    case "IN_PROGRESS": return "Em Andamento"
    case "DONE": return "Concluído"
    case "CANCELLED": return "Cancelado"
    default: return status
  }
}

export function getStatusVariant(status: string) {
  switch (status) {
    case "OPEN": return "soft-warning"
    case "IN_PROGRESS": return "soft-info"
    case "DONE": return "soft-success"
    case "CANCELLED": return "soft-destructive"
    default: return "secondary"
  }
}

export function getPriorityVariant(priority: string) {
  switch (priority) {
    case "LOW": return "soft-success"
    case "MEDIUM": return "soft-info"
    case "HIGH": return "soft-warning"
    case "CRITICAL": return "soft-destructive"
    default: return "secondary"
  }
}

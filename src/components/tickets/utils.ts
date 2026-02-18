export function getStatusLabel(status: string) {
  switch (status) {
    case "OPEN": return "Aberto"
    case "IN_PROGRESS": return "Em Andamento"
    case "WAITING": return "Em Espera"
    case "DONE": return "Concluído"
    case "CLOSED": return "Fechado"
    case "CANCELLED": return "Cancelado"
    default: return status
  }
}

export function getPriorityLabel(priority: string) {
  switch (priority) {
    case "LOW": return "Baixa"
    case "MEDIUM": return "Média"
    case "HIGH": return "Alta"
    case "CRITICAL": return "Crítica"
    default: return priority
  }
}

export function getStatusVariant(status: string) {
  switch (status) {
    case "OPEN": return "soft-warning"
    case "IN_PROGRESS": return "soft-info"
    case "WAITING": return "soft-warning"
    case "DONE": return "soft-success"
    case "CLOSED": return "secondary"
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

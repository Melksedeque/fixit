export function getUserInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]!)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}


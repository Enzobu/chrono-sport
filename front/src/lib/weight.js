const LB_PER_KG = 2.2046226218

export function toDisplayWeight(weightKg, unit = 'kg') {
  const kg = Number(weightKg) || 0
  const value = unit === 'lb' ? kg * LB_PER_KG : kg
  return Math.round(value * 10) / 10
}

export function fromDisplayWeight(value, unit = 'kg') {
  const parsed = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(parsed)) return 0
  return unit === 'lb' ? parsed / LB_PER_KG : parsed
}

export function formatWeight(weightKg, unit = 'kg') {
  const value = toDisplayWeight(weightKg, unit)
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`
}

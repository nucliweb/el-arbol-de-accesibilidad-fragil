export interface RingtoneOption {
  readonly value: RingtoneId
  readonly label: string
}

export const RINGTONE_OPTIONS = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

export type RingtoneId = (typeof RINGTONE_OPTIONS)[number]['value']

export const DEFAULT_RINGTONE: RingtoneId = 'calisto'

const STORAGE_KEY = 'settings:ringtone'

export function isRingtoneId(value: string): value is RingtoneId {
  return RINGTONE_OPTIONS.some((option) => option.value === value)
}

export function getRingtoneLabel(id: RingtoneId): string {
  return RINGTONE_OPTIONS.find((option) => option.value === id)?.label ?? RINGTONE_OPTIONS[0].label
}

export function loadSavedRingtone(): RingtoneId {
  if (typeof window === 'undefined') {
    return DEFAULT_RINGTONE
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors (e.g., restricted browsing contexts)
  }
  return DEFAULT_RINGTONE
}

export function saveRingtone(id: RingtoneId): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ignore storage access errors
  }
}

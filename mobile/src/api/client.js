import { Platform } from 'react-native'

const normalizeApiUrl = (url) => url?.trim().replace(/\/+$/, '')

const fallbackApiUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:38746' : 'http://localhost:38746'

export const API_URL =
  normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) ?? fallbackApiUrl

export async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:38746'

export async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

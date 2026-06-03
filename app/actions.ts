'use server'
import { revalidatePath } from 'next/cache'

export async function revalidateClient(clientId: string) {
  // Invalida layout inteiro para forçar re-fetch do Google Sheets
  revalidatePath('/', 'layout')
  revalidatePath(`/clients/${clientId}`, 'layout')
}

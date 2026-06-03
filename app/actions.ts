'use server'
import { revalidatePath } from 'next/cache'

export async function revalidateClient(clientId: string) {
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/')
}

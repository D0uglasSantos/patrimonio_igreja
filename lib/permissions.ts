import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Verifica se o usuário é administrador
 * @returns true se o usuário é ADM
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.tipo_user === 'ADM'
}

/**
 * Verifica se o usuário está autenticado
 * @returns true se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return !!session?.user
}

/**
 * Obtém a sessão do usuário atual
 * @returns Sessão do usuário ou null
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}


import bcrypt from 'bcrypt'

/**
 * Hash de senha usando bcrypt
 * @param password - Senha em texto plano
 * @returns Senha hasheada
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

/**
 * Verifica se a senha corresponde ao hash
 * @param password - Senha em texto plano
 * @param hash - Hash armazenado
 * @returns true se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}


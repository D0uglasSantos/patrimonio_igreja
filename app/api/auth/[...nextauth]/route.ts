import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) {
            console.error('[NextAuth] Email e senha são obrigatórios')
            return null
          }

          console.log(`[NextAuth] Tentativa de login para: ${credentials.email}`)

          // Verificar conexão com banco
          try {
            await prisma.$connect()
          } catch (dbError) {
            console.error('[NextAuth] Erro ao conectar com o banco de dados:', dbError)
            throw new Error('Erro de conexão com o banco de dados')
          }

          const usuario = await prisma.usuario.findUnique({
            where: { email: credentials.email },
          })

          if (!usuario) {
            console.error(`[NextAuth] Usuário não encontrado: ${credentials.email}`)
            return null
          }

          console.log(`[NextAuth] Usuário encontrado: ${usuario.email}`)

          const senhaValida = await verifyPassword(credentials.senha, usuario.senha)

          if (!senhaValida) {
            console.error(`[NextAuth] Senha inválida para usuário: ${credentials.email}`)
            return null
          }

          console.log(`[NextAuth] Autenticação bem-sucedida para: ${usuario.email}`)

          return {
            id: usuario.id_user,
            nome: usuario.nome,
            email: usuario.email,
            tipo_user: usuario.tipo_user,
          }
        } catch (error) {
          console.error('[NextAuth] Erro na autenticação:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as number
        token.nome = user.nome
        token.email = user.email
        token.tipo_user = user.tipo_user
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.nome = token.nome
        session.user.email = token.email
        session.user.tipo_user = token.tipo_user
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }


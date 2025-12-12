import 'next-auth'

type TipoUser = 'ADM' | 'COMUM'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      nome: string
      email: string
      tipo_user: TipoUser
    }
  }

  interface User {
    id: number
    nome: string
    email: string
    tipo_user: TipoUser
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number
    nome: string
    email: string
    tipo_user: TipoUser
  }
}


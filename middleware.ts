import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas que requerem privilégios de administrador
    const adminRoutes = [
      '/dashboard/bens/novo',
      '/dashboard/bens/editar',
      '/dashboard/usuarios',
      '/dashboard/pastorais',
    ]

    // Verifica se a rota requer admin
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

    if (isAdminRoute && token?.tipo_user !== 'ADM') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Configurar quais rotas devem ser protegidas
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/bens/:path*',
    '/api/emprestimos/:path*',
    '/api/usuarios/:path*',
    '/api/pastorais/:path*',
    '/api/relatorios/:path*',
  ],
}


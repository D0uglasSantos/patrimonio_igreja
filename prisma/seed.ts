import { PrismaClient, TipoUser, EstadoBem } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (opcional - comentar em produção)
  await prisma.retiradaEmprestimo.deleteMany()
  await prisma.bem.deleteMany()
  await prisma.pastoral.deleteMany()
  await prisma.usuario.deleteMany()

  // Criar usuário administrador
  const senhaHashAdmin = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@paroquia.com',
      senha: senhaHashAdmin,
      tipo_user: TipoUser.ADM,
    },
  })
  console.log('✅ Usuário administrador criado:', admin.email)

  // Criar usuário comum
  const senhaHashComum = await bcrypt.hash('usuario123', 10)
  const usuarioComum = await prisma.usuario.create({
    data: {
      nome: 'João Silva',
      email: 'joao@paroquia.com',
      senha: senhaHashComum,
      tipo_user: TipoUser.COMUM,
    },
  })
  console.log('✅ Usuário comum criado:', usuarioComum.email)

  // Criar pastorais
  const pastoralJuventude = await prisma.pastoral.create({
    data: {
      nome_pastoral: 'Pastoral da Juventude',
      coordenador: 'Maria Santos',
      vice_coordenador: 'Pedro Oliveira',
    },
  })

  const pastoralCaridade = await prisma.pastoral.create({
    data: {
      nome_pastoral: 'Pastoral da Caridade',
      coordenador: 'Ana Costa',
      vice_coordenador: 'José Ferreira',
    },
  })

  const pastoralLiturgia = await prisma.pastoral.create({
    data: {
      nome_pastoral: 'Pastoral da Liturgia',
      coordenador: 'Carlos Almeida',
      vice_coordenador: null,
    },
  })

  console.log('✅ 3 Pastorais criadas')

  // Criar bens
  const bem1 = await prisma.bem.create({
    data: {
      nome_bem: 'Projetor Multimídia',
      estado: EstadoBem.NOVO,
      valor: 2500.00,
      codigo: 'PROJ-001',
      foto: '/images/projetor.jpg',
    },
  })

  const bem2 = await prisma.bem.create({
    data: {
      nome_bem: 'Caixa de Som Portátil',
      estado: EstadoBem.USADO,
      valor: 800.00,
      codigo: 'AUDIO-001',
      foto: '/images/caixa-som.jpg',
    },
  })

  const bem3 = await prisma.bem.create({
    data: {
      nome_bem: 'Mesa Dobrável',
      estado: EstadoBem.USADO,
      valor: 150.00,
      codigo: 'MOB-001',
      foto: null,
    },
  })

  const bem4 = await prisma.bem.create({
    data: {
      nome_bem: 'Cadeira Plástica (Kit 10 unidades)',
      estado: EstadoBem.NOVO,
      valor: 300.00,
      codigo: 'MOB-002',
      foto: null,
    },
  })

  const bem5 = await prisma.bem.create({
    data: {
      nome_bem: 'Microfone sem Fio',
      estado: EstadoBem.QUEBRADO,
      valor: 450.00,
      codigo: 'AUDIO-002',
      foto: null,
    },
  })

  console.log('✅ 5 Bens cadastrados')

  // Criar alguns empréstimos de exemplo
  const emprestimo1 = await prisma.retiradaEmprestimo.create({
    data: {
      id_bem: bem1.id_bem,
      id_retirante: usuarioComum.id_user,
      id_pastoral: pastoralJuventude.id_pastoral,
      data_retirada: new Date('2024-11-01T10:00:00'),
      data_entrega: new Date('2024-11-05T16:30:00'),
      estado_retirada: EstadoBem.NOVO,
      estado_devolucao: EstadoBem.NOVO,
      descricao_motivo_retirada: 'Apresentação para o grupo de jovens',
      email_retirante: usuarioComum.email,
      id_recebedor: admin.id_user,
    },
  })

  const emprestimo2 = await prisma.retiradaEmprestimo.create({
    data: {
      id_bem: bem2.id_bem,
      id_retirante: usuarioComum.id_user,
      id_pastoral: pastoralCaridade.id_pastoral,
      data_retirada: new Date('2024-11-10T14:00:00'),
      estado_retirada: EstadoBem.USADO,
      descricao_motivo_retirada: 'Evento beneficente no salão',
      email_retirante: usuarioComum.email,
      // Empréstimo ainda ativo (sem data_entrega)
    },
  })

  console.log('✅ 2 Empréstimos criados (1 devolvido, 1 ativo)')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📝 Credenciais de acesso:')
  console.log('   Admin: admin@paroquia.com / admin123')
  console.log('   Usuário: joao@paroquia.com / usuario123')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


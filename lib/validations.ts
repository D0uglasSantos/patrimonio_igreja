import { z } from 'zod'

// Validação de Login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// Validação de Usuário
export const usuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  tipo_user: z.enum(['ADM', 'COMUM']).default('COMUM'),
  id_pastoral: z.number().int().positive('ID da pastoral é obrigatório'),
  funcao_pastoral: z.enum(['COORDENADOR', 'VICE_COORDENADOR']),
})

export const usuarioUpdateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  tipo_user: z.enum(['ADM', 'COMUM']).optional(),
  id_pastoral: z.number().int().positive('ID da pastoral é obrigatório'),
  funcao_pastoral: z.enum(['COORDENADOR', 'VICE_COORDENADOR']),
})

// Validação de Bem
export const bemSchema = z.object({
  nome_bem: z.string().min(3, 'Nome do bem deve ter no mínimo 3 caracteres'),
  estado: z.enum(['NOVO', 'USADO', 'QUEBRADO', 'EM_MANUTENCAO']).default('USADO'),
  foto: z.string().url('URL da foto inválida').optional().nullable(),
  valor: z.number().positive('Valor deve ser positivo').optional().nullable(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  local: z.enum(['MATRIZ', 'CAPELA']).default('MATRIZ'),
})

export const bemUpdateSchema = z.object({
  nome_bem: z.string().min(3, 'Nome do bem deve ter no mínimo 3 caracteres').optional(),
  estado: z.enum(['NOVO', 'USADO', 'QUEBRADO', 'EM_MANUTENCAO']).optional(),
  foto: z.string().url('URL da foto inválida').optional().nullable(),
  valor: z.number().positive('Valor deve ser positivo').optional().nullable(),
  codigo: z.string().min(1, 'Código é obrigatório').optional(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  local: z.enum(['MATRIZ', 'CAPELA']).optional(),
})

// Validação de Pastoral
export const pastoralSchema = z.object({
  nome_pastoral: z.string().min(3, 'Nome da pastoral deve ter no mínimo 3 caracteres'),
})

export const pastoralUpdateSchema = z.object({
  nome_pastoral: z.string().min(3, 'Nome da pastoral deve ter no mínimo 3 caracteres').optional(),
})

// Validação de Retirada/Empréstimo
export const retiradaSchema = z.object({
  id_bem: z.number().int().positive('ID do bem é obrigatório'),
  id_retirante: z.number().int().positive('ID do retirante é obrigatório'),
  id_entregador: z.number().int().positive('ID do entregador é obrigatório'),
  id_pastoral: z.number().int().positive('ID da pastoral é obrigatório'),
  estado_retirada: z.enum(['NOVO', 'USADO', 'QUEBRADO', 'EM_MANUTENCAO']),
  descricao_motivo_retirada: z.string().optional().nullable(),
  nome_retirante: z.string().optional().nullable(),
  email_retirante: z.string().email('Email inválido'),
  finalidade_uso: z.enum(['MATRIZ', 'CAPELA', 'PESSOAL']),
  data_estimada_devolucao: z.coerce.date().optional().nullable(),
})

// Validação de Devolução
export const devolucaoSchema = z.object({
  id_recebedor: z.number().int().positive('ID do recebedor é obrigatório'),
  estado_devolucao: z.enum(['NOVO', 'USADO', 'QUEBRADO', 'EM_MANUTENCAO']),
  justificativa_avaria: z.string().optional().nullable(),
  nome_responsavel_devolucao: z.string().optional().nullable(),
  email_responsavel_devolucao: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Se o email foi preenchido, deve ser válido
  if (data.email_responsavel_devolucao && data.email_responsavel_devolucao.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email_responsavel_devolucao)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email inválido',
        path: ['email_responsavel_devolucao'],
      })
    }
  }
}).refine(
  (data) => {
    // Se o estado for QUEBRADO, justificativa é obrigatória
    if (data.estado_devolucao === 'QUEBRADO') {
      return data.justificativa_avaria && data.justificativa_avaria.trim().length > 0
    }
    return true
  },
  {
    message: 'Justificativa da avaria é obrigatória quando o bem está quebrado',
    path: ['justificativa_avaria'],
  }
)

// Tipos TypeScript inferidos dos schemas
export type LoginInput = z.infer<typeof loginSchema>
export type UsuarioInput = z.infer<typeof usuarioSchema>
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>
export type BemInput = z.infer<typeof bemSchema>
export type BemUpdateInput = z.infer<typeof bemUpdateSchema>
export type PastoralInput = z.infer<typeof pastoralSchema>
export type PastoralUpdateInput = z.infer<typeof pastoralUpdateSchema>
export type RetiradaInput = z.infer<typeof retiradaSchema>
export type DevolucaoInput = z.infer<typeof devolucaoSchema>


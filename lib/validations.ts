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
})

export const usuarioUpdateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  tipo_user: z.enum(['ADM', 'COMUM']).optional(),
})

// Validação de Bem
export const bemSchema = z.object({
  nome_bem: z.string().min(3, 'Nome do bem deve ter no mínimo 3 caracteres'),
  estado: z.enum(['NOVO', 'USADO', 'QUEBRADO']).default('USADO'),
  foto: z.string().url('URL da foto inválida').optional().nullable(),
  valor: z.number().positive('Valor deve ser positivo').optional().nullable(),
  codigo: z.string().min(1, 'Código é obrigatório'),
})

export const bemUpdateSchema = z.object({
  nome_bem: z.string().min(3, 'Nome do bem deve ter no mínimo 3 caracteres').optional(),
  estado: z.enum(['NOVO', 'USADO', 'QUEBRADO']).optional(),
  foto: z.string().url('URL da foto inválida').optional().nullable(),
  valor: z.number().positive('Valor deve ser positivo').optional().nullable(),
  codigo: z.string().min(1, 'Código é obrigatório').optional(),
})

// Validação de Pastoral
export const pastoralSchema = z.object({
  nome_pastoral: z.string().min(3, 'Nome da pastoral deve ter no mínimo 3 caracteres'),
  coordenador: z.string().min(3, 'Nome do coordenador deve ter no mínimo 3 caracteres'),
  vice_coordenador: z.string().min(3, 'Nome do vice-coordenador deve ter no mínimo 3 caracteres').optional().nullable(),
})

export const pastoralUpdateSchema = z.object({
  nome_pastoral: z.string().min(3, 'Nome da pastoral deve ter no mínimo 3 caracteres').optional(),
  coordenador: z.string().min(3, 'Nome do coordenador deve ter no mínimo 3 caracteres').optional(),
  vice_coordenador: z.string().min(3, 'Nome do vice-coordenador deve ter no mínimo 3 caracteres').optional().nullable(),
})

// Validação de Retirada/Empréstimo
export const retiradaSchema = z.object({
  id_bem: z.number().int().positive('ID do bem é obrigatório'),
  id_retirante: z.number().int().positive('ID do retirante é obrigatório'),
  id_pastoral: z.number().int().positive('ID da pastoral é obrigatório'),
  estado_retirada: z.enum(['NOVO', 'USADO', 'QUEBRADO']),
  descricao_motivo_retirada: z.string().optional().nullable(),
  email_retirante: z.string().email('Email inválido'),
})

// Validação de Devolução
export const devolucaoSchema = z.object({
  id_recebedor: z.number().int().positive('ID do recebedor é obrigatório'),
  estado_devolucao: z.enum(['NOVO', 'USADO', 'QUEBRADO']),
})

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


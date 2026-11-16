import type { TFunction } from 'i18next'
import {
  validateBookingEmailDomain,
  validateEmail,
  validateIdNumber,
  validateMinLength,
  validateRequired,
  validateSafeText,
} from './validators.ts'
import type { ReferralSource } from '../types/appointment.ts'

export type BookingField =
  | 'childName'
  | 'reason'
  | 'referralSource'
  | 'referralOtherDetail'
  | 'fullName'
  | 'idType'
  | 'idNumber'
  | 'email'
  | 'phone'
  | 'occupation'

export interface BookingFormValues {
  childName: string
  reason: string
  referralSource: ReferralSource | ''
  referralOtherDetail: string
  fullName: string
  idType: string
  idNumber: string
  email: string
  phone: string
  occupation: string
}

export interface ExtractedBookingData {
  childName?: string
  reason?: string
  referralSource?: string
  referralOtherDetail?: string
  fullName?: string
  idType?: string
  idNumber?: string
  email?: string
  phone?: string
  occupation?: string
}

export interface BookingValidationResult {
  errors: string[]
  fields: BookingField[]
}

export function buildBookingTemplate(
  form: BookingFormValues,
  invalidFields: BookingField[],
  template: string,
  referralLabel: string,
): string {
  const referral = form.referralSource === 'OTHER'
    ? `${referralLabel}: ${form.referralOtherDetail}`
    : referralLabel
  const fields: BookingField[] = [
    'childName', 'reason', 'referralSource', 'fullName', 'idType',
    'idNumber', 'email', 'phone', 'occupation',
  ]
  return template.split('\n').map((line, index) => {
    const field = fields[index]
    const invalid = invalidFields.includes(field)
      || (field === 'referralSource' && invalidFields.includes('referralOtherDetail'))
    const value = invalid ? '' : field === 'referralSource' ? referral : form[field]
    return `${line.slice(0, line.indexOf(':') + 1)} ${value}`
  }).join('\n')
}

const FIELD_ALIASES: Array<[BookingField, string[]]> = [
  ['childName', [
    'nino', 'nina', 'nombre del nino', 'nombre del nino o nina', 'nombre del nino nina',
    'nombre del estudiante', 'student name', 'child', 'child name', "child's name",
    'enfant', "nom de l'enfant", "nom de l enfant",
  ]],
  ['reason', [
    'motivo', 'motivo de la cita', 'razon', 'reason', 'reason for appointment',
    'motif', 'raison',
  ]],
  ['referralSource', [
    'como nos conocio', 'como nos conociste', 'como se entero', 'referencia', 'referral',
    'referral source', 'how did you hear about us', 'source',
    'comment nous avez vous connu', 'comment nous avez-vous connu',
  ]],
  ['referralOtherDetail', [
    'detalle', 'detalle de referencia', 'otro detalle', 'other detail', 'detail', 'details',
    'precision', 'precisions',
  ]],
  ['fullName', [
    'encargado', 'nombre del encargado', 'nombre del encargado legal', 'nombre completo', 'nombre del padre',
    'nombre del tutor', 'parent', 'parent name', 'guardian', 'guardian name',
    'guardian s name', 'legal guardian', 'full name',
    'responsable', 'nom du responsable', 'nom complet',
  ]],
  ['idType', [
    'tipo de id', 'tipo de identificacion', 'tipo de cedula', 'id type', 'type of id',
    'identification type', "type de piece d'identite", "type de piece d identite",
    "type d'identification", "type d identification",
  ]],
  ['idNumber', [
    'numero de id', 'numero de identificacion', 'numero de cedula', 'identificacion',
    'cedula', 'id number', 'identification number', "numero de piece d'identite",
    "numero de piece d identite", "numero d'identification", "numero d identification",
  ]],
  ['email', [
    'correo', 'correo electronico', 'email', 'e mail', 'mail', 'courriel',
    'adresse e mail', 'adresse email', 'adresse mail',
  ]],
  ['phone', [
    'telefono', 'numero telefonico', 'telefono celular', 'celular', 'phone',
    'phone number', 'telephone', 'telephone number',
    'numero de telephone', 'numero telephone',
  ]],
  ['occupation', [
    'ocupacion', 'profesion', 'oficio', 'occupation', 'profession', 'job',
    'metier', 'profession',
  ]],
]

const REFERRAL_CHOICES: Array<[ReferralSource, string[]]> = [
  ['FRIEND', [
    '1', 'amigo', 'familiar', 'amigo o familiar', 'de un amigo o familiar',
    'friend', 'family', 'friend or family', 'ami', 'famille', 'un ami ou un proche',
  ]],
  ['SOCIAL_MEDIA', [
    '2', 'redes sociales', 'redes', 'social media', 'social networks',
    'reseaux sociaux', 'reseaux',
  ]],
  ['GOOGLE_SEARCH', [
    '3', 'google', 'busqueda en google', 'google search', 'recherche google',
  ]],
  ['FLYER_OR_AD', [
    '4', 'afiche', 'publicidad', 'afiche o publicidad', 'flyer', 'ad',
    'flyer or ad', 'affiche', 'publicite', 'affiche ou publicite',
  ]],
  ['OTHER', [
    '5', 'otro', 'otra', 'other', 'autre',
  ]],
]

const ID_TYPE_CHOICES: Array<[string, string[]]> = [
  ['Costarricense', [
    '1', 'costarricense', 'costa rica', 'costa rican', 'costarrican', 'costaricain',
    'costaricienne', 'costaricien',
  ]],
  ['Extranjero', [
    '2', 'extranjero', 'extranjera', 'foreign', 'foreigner', 'etranger', 'etrangere',
  ]],
]

export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function stripLineDecoration(line: string): string {
  return line
    .replace(/^\s*(?:[-*•]|\d{1,2}\s*[.)-])\s*/, '')
    .trim()
}

function choiceMatches(value: string, aliases: string[]): boolean {
  const key = normalizeKey(value)
  return aliases.some((alias) => {
    const normalized = normalizeKey(alias)
    return key === normalized || key.startsWith(`${normalized} `)
  })
}

export function parseReferralSource(value: string): ReferralSource | null {
  for (const [source, aliases] of REFERRAL_CHOICES) {
    if (choiceMatches(value, aliases)) return source
  }
  return null
}

export function parseReferral(value: string): { source: ReferralSource | null; detail: string } {
  const separator = value.search(/[:;,-]/)
  const sourcePart = separator >= 0 ? value.slice(0, separator) : value
  const detail = separator >= 0 ? value.slice(separator + 1).trim() : ''
  const source = parseReferralSource(sourcePart)
  if (!source && value.trim()) {
    return { source: 'OTHER', detail: value.trim() }
  }
  return { source, detail }
}

export function parseIdType(value: string): string | null {
  for (const [type, aliases] of ID_TYPE_CHOICES) {
    if (choiceMatches(value, aliases)) return type
  }
  return null
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (/^506\d{8}$/.test(digits)) return `+${digits}`
  if (/^\d{8}$/.test(digits)) return `+506${digits}`
  return `+${digits}`
}

function extractLabeled(lines: string[]): ExtractedBookingData | null {
  const result: ExtractedBookingData = {}
  let found = 0

  for (const rawLine of lines) {
    const line = stripLineDecoration(rawLine)
    const separator = line.search(/[:=]/)
    if (separator <= 0) continue
    const prefix = normalizeKey(line.slice(0, separator))
    const value = line.slice(separator + 1).trim()
    const field = FIELD_ALIASES.find(([, aliases]) =>
      aliases.some((alias) => {
        const normalized = normalizeKey(alias)
        return prefix === normalized || prefix.startsWith(`${normalized} `)
      }))?.[0]
    if (!field) continue
    result[field] = value
    found += 1
  }

  return found > 0 ? result : null
}

function extractInlineLabeled(text: string): ExtractedBookingData | null {
  const accents: Record<string, string> = {
    a: '[aáàâäã]', e: '[eéèêë]', i: '[iíìîï]',
    o: '[oóòôöõ]', u: '[uúùûü]', n: '[nñ]', c: '[cç]',
  }
  const aliases = FIELD_ALIASES.flatMap(([, names]) => names)
    .sort((a, b) => b.length - a.length)
    .map((alias) => normalizeKey(alias).split(' ').map((word) =>
      [...word].map((letter) => accents[letter] ?? letter).join(''),
    ).join("[\\s'’?-]+"))
  const pattern = new RegExp(`(?:^|[\\s|]+)(?:\\d{1,2}\\s*[.)-]\\s*)?(${aliases.join('|')})\\s*[:=]`, 'giu')
  const matches = [...text.matchAll(pattern)]
  if (matches.length < 2) return null

  const result: ExtractedBookingData = {}
  matches.forEach((match, index) => {
    const key = normalizeKey(match[1])
    const field = FIELD_ALIASES.find(([, names]) =>
      names.some((name) => normalizeKey(name) === key))?.[0]
    if (field) {
      result[field] = text.slice(match.index! + match[0].length, matches[index + 1]?.index).trim()
    }
  })
  return result
}

function extractOrdered(lines: string[]): ExtractedBookingData {
  const values = lines.map(stripLineDecoration).filter(Boolean)
  if (values.length === 0) return {}

  const result: ExtractedBookingData = {
    childName: values[0],
    reason: values[1],
    referralSource: values[2],
  }
  if (!values[1] || !values[2]) return result

  let index = 3
  if (parseReferralSource(values[2]) === 'OTHER' && values.length >= 10) {
    result.referralOtherDetail = values[index]
    index += 1
  }

  const orderedFields: Array<
    'fullName' | 'idType' | 'idNumber' | 'email' | 'phone' | 'occupation'
  > = ['fullName', 'idType', 'idNumber', 'email', 'phone', 'occupation']
  for (const field of orderedFields) {
    const value = values[index]
    index += 1
    if (value !== undefined) result[field] = value
  }

  return result
}

export function extractBookingData(text: string): ExtractedBookingData {
  const normalizedText = text.replace(/\r\n?/g, '\n').trim()
  if (!normalizedText) return {}

  const inline = extractInlineLabeled(normalizedText)
  if (inline) return inline

  const singleLine = !normalizedText.includes('\n')
  const lines = singleLine && normalizedText.includes('|')
    ? normalizedText.split('|')
    : normalizedText.split('\n')

  return extractLabeled(lines) ?? extractOrdered(lines)
}

export function validateBookingForm(
  form: BookingFormValues,
  t: TFunction,
): Promise<BookingValidationResult> {
  const labels: Record<BookingField, string> = {
    childName: t('booking.childName'),
    reason: t('booking.reason'),
    referralSource: t('booking.referral.label'),
    referralOtherDetail: t('booking.referral.otherDetail'),
    fullName: t('booking.fullName'),
    idType: t('booking.idType'),
    idNumber: t('booking.idNumber'),
    email: t('booking.email'),
    phone: t('booking.phone'),
    occupation: t('booking.occupation'),
  }

  const errors: string[] = []
  const fields: BookingField[] = []
  const fieldNumbers: Record<BookingField, number> = {
    childName: 1,
    reason: 2,
    referralSource: 3,
    referralOtherDetail: 3,
    fullName: 4,
    idType: 5,
    idNumber: 6,
    email: 7,
    phone: 8,
    occupation: 9,
  }
  const add = (field: BookingField, message: string | null) => {
    if (!message) return
    errors.push(`${fieldNumbers[field]}. ${labels[field]}: ${message}`)
    if (!fields.includes(field)) fields.push(field)
  }
  const maxLength = (field: BookingField, value: string, max: number) =>
    value.trim().length > max ? t('validation.maxLength', { field: labels[field], max }) : null

  add('childName', validateRequired(form.childName, labels.childName, t))
  add('childName', validateSafeText(form.childName, t))
  add('childName', maxLength('childName', form.childName, 150))

  add('reason', validateRequired(form.reason, labels.reason, t))
  add('reason', validateSafeText(form.reason, t))
  add('reason', maxLength('reason', form.reason, 2000))

  add('referralSource', validateRequired(form.referralSource, labels.referralSource, t))

  if (form.referralSource === 'OTHER') {
    add('referralOtherDetail', validateRequired(form.referralOtherDetail, labels.referralOtherDetail, t))
    add('referralOtherDetail', validateSafeText(form.referralOtherDetail, t))
    add('referralOtherDetail', maxLength('referralOtherDetail', form.referralOtherDetail, 255))
  }

  add('fullName', validateRequired(form.fullName, labels.fullName, t))
  add('fullName', validateSafeText(form.fullName, t))
  if (form.fullName.trim()) add('fullName', validateMinLength(form.fullName, 2, t))
  add('fullName', maxLength('fullName', form.fullName, 150))

  const idTypeError = validateRequired(form.idType, labels.idType, t)
  add('idType', idTypeError
    ? `${idTypeError} (${t('booking.idTypeOptions.costarricense')} / ${t('booking.idTypeOptions.extranjero')})`
    : null)
  add('idNumber', validateRequired(form.idNumber, labels.idNumber, t))
  add('idNumber', validateIdNumber(form.idNumber, form.idType, t))

  add('email', validateRequired(form.email, labels.email, t)
    ?? validateEmail(form.email, t)
    ?? validateBookingEmailDomain(form.email, t))
  add('email', maxLength('email', form.email, 255))

  add('occupation', validateRequired(form.occupation, labels.occupation, t))
  add('occupation', validateSafeText(form.occupation, t))
  add('occupation', maxLength('occupation', form.occupation, 150))

  const phoneRequired = validateRequired(form.phone, labels.phone, t)
  add('phone', phoneRequired)
  if (!phoneRequired) {
    const phoneLengthError = maxLength('phone', form.phone, 35)
    add('phone', phoneLengthError)
    if (!phoneLengthError) {
      return import('./phoneValidators.ts').then(({ validatePhoneNumber }) => {
        add('phone', validatePhoneNumber(form.phone, t))
        return { errors, fields }
      })
    }
  }

  return Promise.resolve({ errors, fields })
}

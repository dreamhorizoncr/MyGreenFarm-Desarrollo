import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { validateEmail, validateRequired } from '../utils/validators.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ApplicationInput } from '../types/curriculum.ts'
import type { Vacancy } from '../types/vacancy.ts'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_CERTIFICATES = 5
const CERTIFICATE_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

export function useVacancyApplicationForm(vacancy: Vacancy, onSubmit: (data: ApplicationInput) => Promise<void>) {
  const { t } = useTranslation()

  const showPhone = vacancy.requiredFields.includes('applicantPhone')
  const showFile = vacancy.requiredFields.includes('file')
  const showCertificates = vacancy.requiredFields.includes('certificates')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [certificates, setCertificates] = useState<File[]>([])

  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [certificatesError, setCertificatesError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    if (nameError) setNameError(null)
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) setEmailError(null)
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (phoneError) setPhoneError(null)
  }

  const handleFileChange = (selected: File | null) => {
    if (!selected) {
      setFile(null)
      return
    }

    if (selected.type !== 'application/pdf') {
      setFile(null)
      setFileError(t('vacancies.invalidFileType'))
      return
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null)
      setFileError(t('vacancies.fileTooLarge'))
      return
    }

    setFileError(null)
    setFile(selected)
  }

  const handleCertificatesChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return

    const files = Array.from(selected)

    if (files.length > MAX_CERTIFICATES) {
      setCertificatesError(t('vacancies.tooManyCertificates', { max: MAX_CERTIFICATES }))
      return
    }

    if (files.some((f) => !CERTIFICATE_TYPES.includes(f.type))) {
      setCertificatesError(t('vacancies.invalidCertificateType'))
      return
    }

    if (files.some((f) => f.size > MAX_FILE_SIZE_BYTES)) {
      setCertificatesError(t('vacancies.certificateTooLarge'))
      return
    }

    setCertificatesError(null)
    setCertificates(files)
  }

  const handleRemoveCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (): Promise<boolean> => {
    const nameErrorMessage = validateRequired(name, t('vacancies.applicantName'), t)
    const emailErrorMessage = validateRequired(email, t('vacancies.applicantEmail'), t) ?? validateEmail(email, t)
    const phoneErrorMessage = showPhone ? validateRequired(phone, t('vacancies.applicantPhone'), t) : null
    const fileErrorMessage = showFile && !file ? t('vacancies.fileRequired') : null
    const certificatesErrorMessage = showCertificates && certificates.length === 0 ? t('vacancies.certificatesRequired') : null

    setNameError(nameErrorMessage)
    setEmailError(emailErrorMessage)
    setPhoneError(phoneErrorMessage)
    setFileError(fileErrorMessage)
    setCertificatesError(certificatesErrorMessage)

    if (nameErrorMessage || emailErrorMessage || phoneErrorMessage || fileErrorMessage || certificatesErrorMessage) return false

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        vacancyId: vacancy.id,
        applicantName: name.trim(),
        applicantEmail: email.trim(),
        applicantPhone: showPhone ? phone.trim() : null,
        file: showFile ? file : null,
        certificates: showCertificates ? certificates : [],
      })
      return true
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    name,
    email,
    phone,
    file,
    certificates,
    nameError,
    emailError,
    phoneError,
    fileError,
    certificatesError,
    submitting,
    submitError,
    showPhone,
    showFile,
    showCertificates,
    handleNameChange,
    handleEmailChange,
    handlePhoneChange,
    handleFileChange,
    handleCertificatesChange,
    handleRemoveCertificate,
    handleSubmit,
  }
}

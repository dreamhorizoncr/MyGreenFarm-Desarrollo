import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { validateEmail, validateRequired } from '../utils/validators.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ApplicationInput } from '../types/curriculum.ts'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export function useVacancyApplicationForm(vacancyId: string, onSubmit: (data: ApplicationInput) => Promise<void>) {
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

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

  const handleSubmit = async (): Promise<boolean> => {
    const nameErrorMessage = validateRequired(name, t('vacancies.applicantName'), t)
    const emailErrorMessage = validateRequired(email, t('vacancies.applicantEmail'), t) ?? validateEmail(email, t)
    const phoneErrorMessage = validateRequired(phone, t('vacancies.applicantPhone'), t)
    const fileErrorMessage = file ? null : t('vacancies.fileRequired')

    setNameError(nameErrorMessage)
    setEmailError(emailErrorMessage)
    setPhoneError(phoneErrorMessage)
    setFileError(fileErrorMessage)

    if (nameErrorMessage || emailErrorMessage || phoneErrorMessage || fileErrorMessage || !file) return false

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        vacancyId,
        applicantName: name.trim(),
        applicantEmail: email.trim(),
        applicantPhone: phone.trim(),
        file,
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
    nameError,
    emailError,
    phoneError,
    fileError,
    submitting,
    submitError,
    handleNameChange,
    handleEmailChange,
    handlePhoneChange,
    handleFileChange,
    handleSubmit,
  }
}

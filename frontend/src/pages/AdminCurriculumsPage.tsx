import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'
import VacancyManagementSection from '../components/VacancyManagementSection.tsx'
import ApplicationsSection from '../components/ApplicationsSection.tsx'
import { useVacancies } from '../hooks/useVacancies.ts'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import { notify } from '../utils/notifications.ts'
import type { Curriculum } from '../types/curriculum.ts'
import type { VacancyInput } from '../types/vacancy.ts'

type Tab = 'vacancies' | 'applications'

function AdminCurriculumsPage() {
  const { t } = useTranslation()
  const {
    vacancies,
    loading: loadingVacancies,
    error: vacanciesError,
    fetchVacancies,
    createVacancy,
    setVacancyOpen,
    setVacancyFilledBy,
    deleteVacancy,
  } = useVacancies()
  const {
    curriculums,
    loading: loadingCurriculums,
    error: curriculumsError,
    fetchCurriculums,
    setCurriculumStatus,
    deleteCurriculum,
  } = useCurriculums()

  const [activeTab, setActiveTab] = useState<Tab>('vacancies')

  useEffect(() => {
    fetchVacancies()
    fetchCurriculums()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applicantNameById = new Map(curriculums.map((c) => [c.id, c.applicantName]))

  const handleApprove = async (application: Curriculum) => {
    try {
      await setCurriculumStatus(application.id, 'APPROVED')
      if (application.vacancyId) await setVacancyFilledBy(application.vacancyId, application.id)
      notify.success(t('admin.curriculums.approvedToastTitle'))
    } catch {
      notify.error(t('admin.curriculums.approveErrorToastTitle'))
    }
  }

  const handleReject = async (application: Curriculum) => {
    try {
      await setCurriculumStatus(application.id, 'REJECTED')
      const filledVacancy = vacancies.find((v) => v.filledByApplicationId === application.id)
      if (filledVacancy) await setVacancyFilledBy(filledVacancy.id, null)
      notify.success(t('admin.curriculums.rejectedToastTitle'))
    } catch {
      notify.error(t('admin.curriculums.rejectErrorToastTitle'))
    }
  }

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteCurriculum(id)
      const filledVacancy = vacancies.find((v) => v.filledByApplicationId === id)
      if (filledVacancy) await setVacancyFilledBy(filledVacancy.id, null)
      notify.success(t('admin.curriculums.deletedToastTitle'))
    } catch (err) {
      notify.error(t('admin.curriculums.deleteErrorToastTitle'))
      throw err
    }
  }

  const handleCreateVacancy = async (data: VacancyInput) => {
    try {
      await createVacancy(data)
      notify.success({
        title: t('vacancies.createdToastTitle'),
        description: t('vacancies.createdToastDescription'),
      })
    } catch (err) {
      notify.error(t('vacancies.createErrorToastTitle'))
      throw err
    }
  }

  const handleSetVacancyOpen = async (id: string, isOpen: boolean) => {
    try {
      await setVacancyOpen(id, isOpen)
      notify.success(isOpen ? t('vacancies.openedToastTitle') : t('vacancies.closedToastTitle'))
    } catch {
      notify.error(t('vacancies.statusErrorToastTitle'))
    }
  }

  const handleReleaseVacancy = async (id: string) => {
    try {
      await setVacancyFilledBy(id, null)
      notify.success(t('vacancies.releasedToastTitle'))
    } catch {
      notify.error(t('vacancies.releaseErrorToastTitle'))
    }
  }

  const handleDeleteVacancy = async (id: string) => {
    try {
      await deleteVacancy(id)
      notify.success(t('vacancies.deletedToastTitle'))
    } catch {
      notify.error(t('vacancies.deleteErrorToastTitle'))
    }
  }

  const tabClassName = (tab: Tab) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      activeTab === tab ? 'bg-green-500 text-white' : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  return (
    <div id="admin-curriculums">
      <AdminLayout>
        <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
          {t('admin.curriculums.title')}
        </h1>
        <p className="mt-2 font-body text-base text-neutral-500">
          {t('admin.curriculums.subtitle')}
        </p>

        <div className="mt-xl mb-lg flex gap-sm" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vacancies'}
            onClick={() => setActiveTab('vacancies')}
            className={tabClassName('vacancies')}
          >
            {t('vacancies.title')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'applications'}
            onClick={() => setActiveTab('applications')}
            className={tabClassName('applications')}
          >
            {t('admin.curriculums.applicationsTab')}
          </button>
        </div>

        {activeTab === 'vacancies' ? (
          <VacancyManagementSection
            vacancies={vacancies}
            loading={loadingVacancies}
            error={vacanciesError}
            applicantNameById={applicantNameById}
            onCreate={handleCreateVacancy}
            onSetOpen={handleSetVacancyOpen}
            onRelease={handleReleaseVacancy}
            onDelete={handleDeleteVacancy}
          />
        ) : (
          <ApplicationsSection
            curriculums={curriculums}
            vacancies={vacancies}
            loading={loadingCurriculums}
            error={curriculumsError}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDeleteApplication}
          />
        )}
      </AdminLayout>
    </div>
  )
}

export default AdminCurriculumsPage

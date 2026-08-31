import type { ReactNode } from 'react'
import illustration from '../assets/imgs/IlustrationAuth.png'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'

interface AuthLayoutProps {
  overtitle: string
  rightPanelClassName?: string
  contentClassName?: string
  children: ReactNode
}

function AuthLayout({
  overtitle,
  rightPanelClassName = 'px-[70px] py-[55px]',
  contentClassName = 'max-w-[430px]',
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-10">
      {/*Contenedor Principal*/}
      <section className="relative flex h-[650px] w-full max-w-[1180px] overflow-hidden rounded-2xl bg-bg-card shadow">
        {/*Panel Izquierdo*/}
        <div className="relative hidden w-1/2 overflow-hidden md:block">
          {/*Ilustración*/}
          <img
            src={illustration}
            alt="My Green Farm"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/*Welcome*/}
          <div className="absolute left-0 top-[9%] z-10 w-full text-center">
            <h1 className="m-0 font-heading text-[45px] leading-none tracking-wide text-white">
              {overtitle}
            </h1>
          </div>
        </div>

        {/*Panel Derecho*/}
        <div
          className={`relative flex w-full flex-col bg-bg-card ${rightPanelClassName} md:w-1/2`}
        >
          {/*Selector de idioma*/}
          <div className="absolute right-[30px] top-[25px] z-20">
            <LanguageSwitcher />
          </div>

          {/*Contenido*/}
          <div
            className={`mx-auto flex h-full w-full ${contentClassName} flex-col justify-center`}
          >
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
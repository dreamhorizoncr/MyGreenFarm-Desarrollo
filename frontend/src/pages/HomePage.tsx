import Navbar from '../components/Navbar.tsx'
import Footer from '../layout/Footer.tsx'
import HeaderSection from './home/HeaderSection.tsx'
import PhilosophySection from './home/PhilosophySection.tsx'
import TestimonialsSection from './home/TestimonialsSection.tsx'
import MultimediaSection from './home/MultimediaSection.tsx'
import JoinSection from './home/JoinSection.tsx'

function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex flex-col">
        <HeaderSection />
        <PhilosophySection />
        <TestimonialsSection />
        <MultimediaSection />
        <JoinSection />
      </main>

      <Footer />
    </>
  )
}

export default HomePage
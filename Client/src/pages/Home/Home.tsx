import { useState } from 'react';
import AllGamesSection from '../../components/single/AllGamesSection'
import PopularSection from '../../components/single/PopularSection'
import { WelcomeModal } from '../../components/modals/WelcomeModal';
import { useAuth } from '../../context/AuthContext';

function Home() {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
  const { user } = useAuth()

  console.log("user", user)


  return (
    <div className='font-boogaloo'>
      <PopularSection />
      <AllGamesSection />
      <WelcomeModal
        open={isWelcomeModalOpen}
        onOpenChange={setIsWelcomeModalOpen}
      />
    </div>
  )
}

export default Home

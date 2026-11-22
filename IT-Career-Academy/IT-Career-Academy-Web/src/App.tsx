import Header from './components/Header';
import Hero from './components/Hero';
import Audience from './components/Audience';
import Testimonials from './components/Testimonials';
import Training from './components/Training';
import Programs from './components/Programs';
import Benefits from './components/Benefits';
import Consultation from './components/Consultation';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Audience />
        <Testimonials />
        <Training />
        <Programs />
        <Benefits />
        <Consultation />
      </main>
      <Footer />
    </>
  );
}

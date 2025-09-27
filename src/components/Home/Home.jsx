import Hero from "../../components/Home/Hero";
import HowItWorks from "../../components/Home/HowItWorks";
import ExploreFeatures from "../../components/Home/ExploreFeatures";
import Testimonials from "../../components/Home/Testimonials";   

export default function Home() {
  return (
    <>
      <section id="hero">
        <Hero />
      </section>

      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* Quan trọng: thêm id="features" để react-scroll nhận diện */}
      <section id="features">
        <ExploreFeatures />
      </section>

      <section id="testimonials">
        <Testimonials />
      </section>
    </>
  );
}

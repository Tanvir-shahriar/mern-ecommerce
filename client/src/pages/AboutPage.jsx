import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '../components/Seo.jsx';

import img1 from '../assets/images/about-laham.webp';
import img2 from '../assets/images/about-sourav.webp';
import img3 from '../assets/images/about-tushar.webp';

const teamMembers = [
  {
    name: 'Laham Islam Tamim',
    displayName: 'Laham',
    role: 'Founder',
    image: img1,
    bio: 'I feel that life is too short to stay in one place, inspiring others to explore the world and confront a challenge head-on.'
  },
  {
    name: 'Sourav Kantee Roy',
    displayName: 'Sourav',
    role: 'Co-founder',
    image: img2,
    bio: 'I know deep down that life is a beautiful gift, and every day is a fresh blessing to honor with humility, joy, and awe.'
  },
  {
    name: 'Tushar Ahammad',
    displayName: 'Tushar',
    role: 'Co-founder',
    image: img3,
    bio: 'I believe truthfulness is the real path, and choosing your own route is how meaningful journeys are built.'
  }
];

export const AboutPage = () => (
  <>
    <Seo
      title="About LahVenture | Founder & Team"
      description="Meet LahVenture founder Laham Islam Tamim and the team behind Bangladesh's curated watch and lifestyle shopping experience."
    />

    <main className="about-page">
      <section className="about-founder-hero" aria-labelledby="about-founder-title">
        <div className="about-founder-intro">
          <p className="about-eyebrow">Welcome to LahVenture</p>
          <h1 id="about-founder-title">
            <span>Hello, I Am</span>
            <em>Laham!</em>
          </h1>
          <p className="about-founder-role">Founder</p>
        </div>

        <div className="about-founder-portrait" aria-hidden="true">
          <img src={img1} alt="" fetchPriority="high" />
        </div>

        <div className="about-founder-message">
          <p className="about-founder-welcome">Welcome to our website</p>
          <p>
            I am Laham Islam Tamim, I feel that life is too short to stay in one
            place, inspiring others to explore the world and confront a challenge head-on.
          </p>
        </div>
      </section>

      <section className="about-story-section" aria-labelledby="about-story-title">
        <div className="about-story-copy">
          <p className="about-eyebrow">Our direction</p>
          <h2 id="about-story-title">Built for people who choose the journey and the watch that goes with it.</h2>
          <p>
            LahVenture brings together curated timepieces, practical buying guidance, and
            a service-first shopping experience for customers across Bangladesh. Every
            collection is shaped around clarity, authenticity, and the confidence to move forward.
          </p>
          <Link className="about-link-button" to="/products">
            Explore watches <ArrowRight size={16} />
          </Link>
        </div>

        <div className="about-story-panel" aria-label="LahVenture commitments">
          <div>
            <span>01</span>
            <strong>Authentic selections</strong>
            <p>Clear product details, direct brand grouping, and focused collections.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Customer-first support</strong>
            <p>Simple communication from product discovery to delivery.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Bangladesh focused</strong>
            <p>Curated for local watch buyers, collectors, and everyday explorers.</p>
          </div>
        </div>
      </section>

      <section className="about-team-section" aria-labelledby="about-team-title">
        <div className="about-section-heading">
          <p className="about-eyebrow">The team</p>
          <h2 id="about-team-title">The people behind LahVenture</h2>
        </div>

        <div className="about-team-grid">
          {teamMembers.map((member) => (
            <article className="about-team-card" key={member.name}>
              <div className="about-team-image">
                <img src={member.image} alt={`${member.name}, ${member.role}`} loading={member.role === 'Founder' ? 'eager' : 'lazy'} />
              </div>
              <div className="about-team-copy">
                <span>{member.role}</span>
                <h3>{member.displayName}</h3>
                <p>{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-thanks-section" aria-labelledby="about-thanks-title">
        <p className="about-eyebrow">Thank you</p>
        <h2 id="about-thanks-title">For visiting our website.</h2>
        <p>Explore our collections, discover brands, and choose the piece that fits your next chapter.</p>
        <Link className="about-link-button light" to="/brands">
          View brands <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  </>
);

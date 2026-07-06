import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '../components/Seo.jsx';

import img1 from '../assets/images/1.png';
import img2 from '../assets/images/2.png';
import img3 from '../assets/images/3.png';

export const AboutPage = () => {
  useEffect(() => {
    // 1. Add scroll-snap styles to html and body dynamically
    const originalHtmlScrollSnapType = document.documentElement.style.scrollSnapType;
    const originalHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyMargin = document.body.style.margin;
    const originalBodyPadding = document.body.style.padding;
    const originalBodyBgColor = document.body.style.backgroundColor;
    const originalBodyOverflowX = document.body.style.overflowX;
    const originalBodyHeight = document.body.style.height;

    document.documentElement.style.scrollSnapType = 'y mandatory';
    document.documentElement.style.scrollBehavior = 'smooth';
    document.documentElement.style.height = '100%';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#EAEAEA';
    document.body.style.overflowX = 'hidden';
    document.body.style.height = 'auto';

    // 2. Load Tailwind CDN script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.id = 'tailwind-cdn-script';
    
    // Set Tailwind config before script loads
    window.tailwind = {
      config: {
        theme: {
          extend: {
            colors: {
              maroon: '#7A0000',
              bglight: '#EAEAEA'
            },
            fontFamily: {
              serif: ['"Playfair Display"', 'serif'],
              sans: ['Inter', 'sans-serif']
            }
          }
        }
      }
    };

    document.head.appendChild(script);

    // 3. Scroll Snap Intersection Observer
    const triggers = document.querySelectorAll('.section-trigger');
    const slides = document.querySelectorAll('.slide');
    let currentIndex = -1;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Trigger when a section is 50% within the viewport
    };

    function activateSlide(newIndex) {
      if (newIndex === currentIndex) return;

      // Handle Exit phase for the outgoing slide
      if (currentIndex >= 0) {
        const currentSlide = slides[currentIndex];
        if (currentSlide) {
          currentSlide.classList.remove('active');

          if (newIndex > currentIndex) {
            // Scrolling down - Exits upward
            currentSlide.classList.add('exit-up');
            currentSlide.classList.remove('exit-down');
          } else {
            // Scrolling up - Exits downward
            currentSlide.classList.add('exit-down');
            currentSlide.classList.remove('exit-up');
          }
        }
      }

      // Handle Entry phase for incoming slide
      const nextSlide = slides[newIndex];
      if (nextSlide) {
        nextSlide.classList.remove('exit-up', 'exit-down');

        // Slight delay ensures CSS display blocks register before appending active classes
        setTimeout(() => {
          nextSlide.classList.add('active');
        }, 10);
      }

      currentIndex = newIndex;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetIndex = parseInt(entry.target.getAttribute('data-index'), 10);
          activateSlide(targetIndex);
        }
      });
    }, observerOptions);

    triggers.forEach(trigger => observer.observe(trigger));

    // Cleanup
    return () => {
      // Restore html and body styles
      document.documentElement.style.scrollSnapType = originalHtmlScrollSnapType;
      document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
      document.documentElement.style.height = originalHtmlHeight;

      document.body.style.margin = originalBodyMargin;
      document.body.style.padding = originalBodyPadding;
      document.body.style.backgroundColor = originalBodyBgColor;
      document.body.style.overflowX = originalBodyOverflowX;
      document.body.style.height = originalBodyHeight;

      // Disconnect observer
      observer.disconnect();

      // Remove Tailwind script
      const tailwindScript = document.getElementById('tailwind-cdn-script');
      if (tailwindScript) {
        tailwindScript.remove();
      }

      // Remove tailwind style tags added dynamically
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach(tag => {
        if (tag.textContent && (tag.textContent.includes('--tw-') || tag.textContent.includes('tailwind'))) {
          tag.remove();
        }
      });

      delete window.tailwind;
    };
  }, []);

  return (
    <>
      <Seo title="Lahventure - Team Profiles" />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

        .section-trigger {
            scroll-snap-align: start;
            scroll-snap-stop: always;
            height: 100vh;
            width: 100%;
        }

        .slides-container {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 40;
        }

        /* Slide Base States */
        .slide {
            position: absolute;
            inset: 0;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            z-index: 1;
        }

        .slide.active {
            opacity: 1;
            visibility: visible;
            pointer-events: none;
            z-index: 10;
        }

        .slide.exit-up {
            opacity: 1;
            visibility: visible;
            z-index: 5;
        }

        .slide.exit-down {
            opacity: 1;
            visibility: visible;
            z-index: 5;
        }

        /* Animation Blueprint Elements Initial State */
        .profile-img {
            transform: translateY(100%);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s ease;
        }

        @media (min-width: 768px) {
            .profile-img {
                transform: translate(-50%, 100%);
            }
        }

        .dynamic-text {
            transform: translateY(30px);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1) 0.1s, opacity 1s ease 0.1s;
        }

        .bio-text {
            opacity: 0;
            transition: opacity 1s ease 0.4s;
        }

        /* Phase 1 & 2: Entry and Rest (Active Class) */
        .slide.active .profile-img {
            transform: translateY(0%);
            opacity: 1;
        }

        @media (min-width: 768px) {
            .slide.active .profile-img {
                transform: translate(-50%, 0%);
            }
        }

        .slide.active .dynamic-text {
            transform: translateY(0%);
            opacity: 1;
        }

        .slide.active .bio-text {
            opacity: 1;
        }

        /* Phase 3: Slide Exit (Exit-Up Class) */
        .slide.exit-up .profile-img {
            transform: translateY(-120%);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease 0.1s;
        }

        @media (min-width: 768px) {
            .slide.exit-up .profile-img {
                transform: translate(-50%, -120%);
            }
        }

        .slide.exit-up .dynamic-text {
            transform: translateY(-80px);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        .slide.exit-up .bio-text {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        /* Reverse Scroll Exit (Exit-Down Class) */
        .slide.exit-down .profile-img {
            transform: translateY(100%);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        @media (min-width: 768px) {
            .slide.exit-down .profile-img {
                transform: translate(-50%, 100%);
            }
        }

        .slide.exit-down .dynamic-text {
            transform: translateY(50px);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        .slide.exit-down .bio-text {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        /* Thank You Screen Text Scale Animation */
        #slide-3.active .thank-you-text {
            animation: scaleUp 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes scaleUp {
            from {
                transform: scale(0.9);
                opacity: 0;
            }

            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Hide scrollbar for cleaner presentation */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
      `}</style>

      <div className="slides-container fixed inset-0 w-full h-full pointer-events-none z-40">

        <div className="slide bg-bglight" id="slide-0">
          <div className="flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Laham !</h1>
              <p className="text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Founder</p>
            </div>

            <img src={img1} alt="Laham"
              className="profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="relative md:absolute md:left-auto md:right-[10%] md:bottom-[20%] w-full md:w-80 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Laham Islam Tamim, I <br className="hidden md:inline" />feel that life is too <br className="hidden md:inline" />short to stay in one <br className="hidden md:inline" />place, inspiring others <br className="hidden md:inline" />to explore the world <br className="hidden md:inline" />and confront a <br className="hidden md:inline" />challenge head-on.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight" id="slide-1">
          <div className="flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Sourav!</h1>
              <p className="text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Co-founder</p>
            </div>

            <img src={img2} alt="Sourav"
              className="profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="relative md:absolute md:left-auto md:right-[10%] md:bottom-[15%] w-full md:w-96 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Sourav Kantee Roy, I <br className="hidden md:inline" />knows deep down that "life <br className="hidden md:inline" />is a beautiful gift" and every <br className="hidden md:inline" />day is a fresh blessing. and <br className="hidden md:inline" />there's no better way to <br className="hidden md:inline" />honor that gift than to <br className="hidden md:inline" />"love the creator's <br className="hidden md:inline" />creation," exploring its <br className="hidden md:inline" />wonders with humility, joy, <br className="hidden md:inline" />and awe.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight" id="slide-2">
          <div className="flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Tushar!</h1>
              <p className="text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Co-founder</p>
            </div>

            <img src={img3} alt="Tushar"
              className="profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="relative md:absolute md:left-auto md:right-[10%] md:bottom-[20%] w-full md:w-80 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Tushar Ahammad, and I <br className="hidden md:inline" />firmly believe that "win the <br className="hidden md:inline" />world with being truthful" <br className="hidden md:inline" />is the real path. chooses to <br className="hidden md:inline" />"break the rules" and forge <br className="hidden md:inline" />your own route.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight flex flex-col items-center justify-center" id="slide-3">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden bio-text opacity-30">
            <div className="absolute w-[30vw] h-[30vw] rounded-full border border-maroon/20 animate-[ping_4s_ease-out_infinite]"></div>
            <div className="absolute w-[50vw] h-[50vw] rounded-full border border-maroon/30 animate-[ping_6s_ease-out_infinite_1s]"></div>
            <div className="absolute w-[70vw] h-[70vw] rounded-full border border-maroon/10"></div>
          </div>

          <div className="text-center thank-you-text opacity-0 z-10">
            <h1 className="text-6xl md:text-9xl font-serif font-bold text-maroon uppercase tracking-widest">Thank You</h1>
            <h2 className="text-2xl md:text-4xl font-sans font-medium text-maroon mt-6 uppercase tracking-wider">For Visiting</h2>
            <h3 className="text-4xl md:text-6xl font-serif italic text-maroon mt-4">Our Website</h3>
          </div>
        </div>

      </div>

      <div id="scroll-track" className="relative w-full z-0">
        <section className="h-screen w-full section-trigger" data-index="0"></section>
        <section className="h-screen w-full section-trigger" data-index="1"></section>
        <section className="h-screen w-full section-trigger" data-index="2"></section>
        <section className="h-screen w-full section-trigger" data-index="3"></section>
      </div>
    </>
  );
};

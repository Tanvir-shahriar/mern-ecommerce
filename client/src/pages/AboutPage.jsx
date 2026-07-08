import { useEffect } from 'react';
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
    const originalHtmlOverscrollBehaviorY = document.documentElement.style.overscrollBehaviorY;
    const originalHtmlOverflowAnchor = document.documentElement.style.overflowAnchor;
    const originalBodyMargin = document.body.style.margin;
    const originalBodyPadding = document.body.style.padding;
    const originalBodyBgColor = document.body.style.backgroundColor;
    const originalBodyOverflowX = document.body.style.overflowX;
    const originalBodyHeight = document.body.style.height;
    const originalBodyOverscrollBehaviorY = document.body.style.overscrollBehaviorY;

    document.documentElement.style.scrollSnapType = 'y proximity';
    document.documentElement.style.scrollBehavior = 'smooth';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overscrollBehaviorY = 'contain';
    document.documentElement.style.overflowAnchor = 'none';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#EAEAEA';
    document.body.style.overflowX = 'hidden';
    document.body.style.height = 'auto';
    document.body.style.overscrollBehaviorY = 'contain';

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
              maroon: '#6b000b',
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
    let activationFrame = null;
    const triggerRatios = new Map();

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: [0.25, 0.4, 0.55, 0.7] // Track more scroll progress for smoother handoff
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

        requestAnimationFrame(() => {
          nextSlide.classList.add('active');
        });
      }

      currentIndex = newIndex;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        triggerRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      if (activationFrame) {
        cancelAnimationFrame(activationFrame);
      }

      activationFrame = requestAnimationFrame(() => {
        let bestIndex = currentIndex;
        let bestRatio = 0.34;

        triggerRatios.forEach((ratio, trigger) => {
          const targetIndex = parseInt(trigger.getAttribute('data-index'), 10);
          if (ratio > bestRatio && Number.isFinite(targetIndex)) {
            bestRatio = ratio;
            bestIndex = targetIndex;
          }
        });

        if (bestIndex >= 0) {
          activateSlide(bestIndex);
        }
      });
    }, observerOptions);

    triggers.forEach(trigger => observer.observe(trigger));
    requestAnimationFrame(() => activateSlide(0));

    // Cleanup
    return () => {
      if (activationFrame) {
        cancelAnimationFrame(activationFrame);
      }

      // Restore html and body styles
      document.documentElement.style.scrollSnapType = originalHtmlScrollSnapType;
      document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
      document.documentElement.style.height = originalHtmlHeight;
      document.documentElement.style.overscrollBehaviorY = originalHtmlOverscrollBehaviorY;
      document.documentElement.style.overflowAnchor = originalHtmlOverflowAnchor;

      document.body.style.margin = originalBodyMargin;
      document.body.style.padding = originalBodyPadding;
      document.body.style.backgroundColor = originalBodyBgColor;
      document.body.style.overflowX = originalBodyOverflowX;
      document.body.style.height = originalBodyHeight;
      document.body.style.overscrollBehaviorY = originalBodyOverscrollBehaviorY;

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

        /* Keep navbar fixed above slides during scroll-snap */
        .site-header {
            position: fixed !important;
            top: 0;
            left: 0;
            right: 0;
            z-index: 200 !important;
        }

        .section-trigger {
            scroll-snap-align: start;
            scroll-snap-stop: always;
            height: 100vh !important;
            min-height: 100vh;
            width: 100%;
        }

        .slides-container {
            --about-theme-red: #6b000b;
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100vh !important;
            min-height: 100vh;
            color: var(--about-theme-red);
            pointer-events: auto !important;
            z-index: 40;
            overflow: hidden;
            contain: layout paint;
        }

        .slides-container :is(h1, h2, h3, p) {
            color: var(--about-theme-red) !important;
        }

        @supports (height: 100svh) {
            .section-trigger,
            .slides-container,
            .about-slide-content {
                height: 100svh !important;
                min-height: 100svh;
            }
        }

        @supports (height: 100dvh) {
            .section-trigger,
            .slides-container,
            .about-slide-content {
                height: 100dvh !important;
                min-height: 100dvh;
            }
        }

        /* Slide Base States */
        .slide {
            position: absolute;
            inset: 0;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
            transform: translateZ(0);
            backface-visibility: hidden;
            contain: paint;
        }

        .about-slide-content {
            gap: clamp(1rem, 3vh, 1.5rem);
            padding-top: clamp(5.75rem, 12svh, 7rem);
            padding-bottom: clamp(1rem, 4svh, 2.5rem);
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
            transform: translate3d(0, 100%, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s ease;
            will-change: transform, opacity;
            backface-visibility: hidden;
        }

        @media (min-width: 768px) {
            .profile-img {
                transform: translate3d(-50%, 100%, 0);
            }
        }

        .dynamic-text {
            transform: translate3d(0, 30px, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1) 0.1s, opacity 1s ease 0.1s;
            will-change: transform, opacity;
            backface-visibility: hidden;
        }

        .bio-text {
            opacity: 0;
            transition: opacity 1s ease 0.4s;
            will-change: opacity;
            backface-visibility: hidden;
        }

        .slide .about-kicker {
            font-size: clamp(1.875rem, 7.4vw, 3.75rem) !important;
            line-height: 1;
        }

        .slide .about-name {
            font-size: clamp(3rem, 13vw, 3.75rem) !important;
            line-height: 0.98;
        }

        .slide .about-role {
            font-size: clamp(1.125rem, 4vw, 1.875rem) !important;
        }

        .slide .about-profile-img {
            height: clamp(15rem, 36svh, 26rem) !important;
            max-height: calc(100svh - 18rem);
        }

        .slide .about-bio-copy {
            font-size: clamp(0.68rem, 2.8vw, 0.75rem) !important;
        }

        .slide .about-thank-title {
            font-size: clamp(3.25rem, 14vw, 5rem) !important;
            line-height: 0.95;
        }

        .slide .about-thank-subtitle {
            font-size: clamp(1.5rem, 6vw, 2.25rem) !important;
        }

        .slide .about-thank-script {
            font-size: clamp(2.5rem, 9vw, 4rem) !important;
        }

        #slide-3 .ring-1 {
            width: clamp(12rem, 30vw, 30rem) !important;
            height: clamp(12rem, 30vw, 30rem) !important;
        }

        #slide-3 .ring-2 {
            width: clamp(18rem, 50vw, 46rem) !important;
            height: clamp(18rem, 50vw, 46rem) !important;
        }

        #slide-3 .ring-3 {
            width: clamp(24rem, 70vw, 62rem) !important;
            height: clamp(24rem, 70vw, 62rem) !important;
        }

        @media (min-width: 768px) {
            .about-slide-content {
                padding: 0;
            }

            .slide .about-intro {
                left: clamp(2rem, 10vw, 9rem) !important;
                top: clamp(9rem, 28svh, 18rem) !important;
            }

            .slide .about-kicker {
                font-size: clamp(4rem, 5vw, 4.5rem) !important;
            }

            .slide .about-name {
                font-size: clamp(5.5rem, 8.8vw, 8rem) !important;
            }

            .slide .about-role {
                margin-top: clamp(4.5rem, 14svh, 8rem) !important;
            }

            .slide .about-profile-img {
                height: clamp(30rem, 80svh, 52rem) !important;
                max-height: 88svh;
            }

            .slide .about-bio {
                right: clamp(2rem, 10vw, 9rem) !important;
                bottom: clamp(4rem, 20svh, 10rem) !important;
            }

            .slide .about-bio-sourav {
                bottom: clamp(3rem, 15svh, 8.5rem) !important;
            }

            .slide .about-bio-copy {
                font-size: clamp(0.78rem, 0.95vw, 0.875rem) !important;
            }

            .slide .about-thank-title {
                font-size: clamp(5rem, 8.8vw, 8rem) !important;
            }

            .slide .about-thank-subtitle {
                font-size: clamp(2rem, 2.8vw, 2.25rem) !important;
            }

            .slide .about-thank-script {
                font-size: clamp(3.25rem, 4.5vw, 4rem) !important;
            }
        }

        @media (min-width: 1024px) {
            .slide .about-profile-img {
                height: clamp(34rem, 85svh, 56rem) !important;
            }
        }

        /* Phase 1 & 2: Entry and Rest (Active Class) */
        .slide.active .profile-img {
            transform: translate3d(0, 0%, 0);
            opacity: 1;
        }

        @media (min-width: 768px) {
            .slide.active .profile-img {
                transform: translate3d(-50%, 0%, 0);
            }
        }

        .slide.active .dynamic-text {
            transform: translate3d(0, 0%, 0);
            opacity: 1;
        }

        .slide.active .bio-text {
            opacity: 1;
        }

        /* Phase 3: Slide Exit (Exit-Up Class) */
        .slide.exit-up .profile-img {
            transform: translate3d(0, -120%, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease 0.1s;
        }

        @media (min-width: 768px) {
            .slide.exit-up .profile-img {
                transform: translate3d(-50%, -120%, 0);
            }
        }

        .slide.exit-up .dynamic-text {
            transform: translate3d(0, -80px, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        .slide.exit-up .bio-text {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        /* Reverse Scroll Exit (Exit-Down Class) */
        .slide.exit-down .profile-img {
            transform: translate3d(0, 100%, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        @media (min-width: 768px) {
            .slide.exit-down .profile-img {
                transform: translate3d(-50%, 100%, 0);
            }
        }

        .slide.exit-down .dynamic-text {
            transform: translate3d(0, 50px, 0);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.4s ease;
        }

        .slide.exit-down .bio-text {
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        /* Thank You Pulsing Ring Animations */
        @keyframes pulseRing {
            0% {
                transform: scale(0.85);
                opacity: 0.6;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.15;
            }
            100% {
                transform: scale(0.85);
                opacity: 0.6;
            }
        }

        @keyframes pulseRingSlow {
            0% {
                transform: scale(0.9);
                opacity: 0.4;
            }
            50% {
                transform: scale(1.08);
                opacity: 0.08;
            }
            100% {
                transform: scale(0.9);
                opacity: 0.4;
            }
        }

        @keyframes pulseRingOuter {
            0% {
                transform: scale(0.95);
                opacity: 0.2;
            }
            50% {
                transform: scale(1.03);
                opacity: 0.05;
            }
            100% {
                transform: scale(0.95);
                opacity: 0.2;
            }
        }

        .ring-1 {
            animation: pulseRing 4s ease-in-out infinite;
        }

        .ring-2 {
            animation: pulseRingSlow 6s ease-in-out infinite 1s;
        }

        .ring-3 {
            animation: pulseRingOuter 8s ease-in-out infinite 2s;
        }

        #slide-3 .ring-1,
        #slide-3 .ring-2,
        #slide-3 .ring-3 {
            opacity: 0;
        }

        #slide-3.active .ring-1,
        #slide-3.active .ring-2,
        #slide-3.active .ring-3 {
            opacity: 1;
        }

        /* Thank You Screen Text Scale Animation */
        #slide-3.active .thank-you-text {
            animation: scaleUp 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        #slide-3.active .thank-you-line-1 {
            animation: fadeSlideUp 1s cubic-bezier(0.25, 1, 0.5, 1) 0.2s forwards;
        }

        #slide-3.active .thank-you-line-2 {
            animation: fadeSlideUp 1s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards;
        }

        #slide-3.active .thank-you-line-3 {
            animation: fadeSlideUp 1s cubic-bezier(0.25, 1, 0.5, 1) 0.8s forwards;
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

        @keyframes fadeSlideUp {
            from {
                transform: translateY(25px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* Hide scrollbar for cleaner presentation */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
            .profile-img,
            .dynamic-text,
            .bio-text,
            .thank-you-text,
            .thank-you-line-1,
            .thank-you-line-2,
            .thank-you-line-3,
            .ring-1,
            .ring-2,
            .ring-3 {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
      `}</style>

      <div className="slides-container fixed inset-0 w-full h-full pointer-events-none z-40">

        <div className="slide bg-bglight" id="slide-0">
          <div className="about-slide-content flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="about-intro relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="about-kicker text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="about-name text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Laham !</h1>
              <p className="about-role text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Founder</p>
            </div>

            <img src={img1} alt="Laham"
              className="about-profile-img profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="about-bio relative md:absolute md:left-auto md:right-[10%] md:bottom-[20%] w-full md:w-80 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="about-bio-copy text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Laham Islam Tamim, I <br className="hidden md:inline" />feel that life is too <br className="hidden md:inline" />short to stay in one <br className="hidden md:inline" />place, inspiring others <br className="hidden md:inline" />to explore the world <br className="hidden md:inline" />and confront a <br className="hidden md:inline" />challenge head-on.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight" id="slide-1">
          <div className="about-slide-content flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="about-intro relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="about-kicker text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="about-name text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Sourav!</h1>
              <p className="about-role text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Co-founder</p>
            </div>

            <img src={img2} alt="Sourav"
              className="about-profile-img profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="about-bio about-bio-sourav relative md:absolute md:left-auto md:right-[10%] md:bottom-[15%] w-full md:w-96 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="about-bio-copy text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Sourav Kantee Roy, I <br className="hidden md:inline" />knows deep down that "life <br className="hidden md:inline" />is a beautiful gift" and every <br className="hidden md:inline" />day is a fresh blessing. and <br className="hidden md:inline" />there's no better way to <br className="hidden md:inline" />honor that gift than to <br className="hidden md:inline" />"love the creator's <br className="hidden md:inline" />creation," exploring its <br className="hidden md:inline" />wonders with humility, joy, <br className="hidden md:inline" />and awe.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight" id="slide-2">
          <div className="about-slide-content flex flex-col justify-center gap-6 md:gap-0 items-center h-full w-full px-6 pt-24 pb-4 md:block md:p-0">
            <div className="about-intro relative md:absolute md:left-[10%] md:top-[28%] text-center md:text-left dynamic-text">
              <h2 className="about-kicker text-3xl sm:text-4xl md:text-7xl font-serif text-maroon mb-1 md:mb-2">Hello, I Am</h2>
              <h1 className="about-name text-5xl sm:text-6xl md:text-9xl font-serif italic text-maroon ml-0 md:ml-12 lg:ml-24">Tushar!</h1>
              <p className="about-role text-lg sm:text-xl md:text-3xl font-serif text-maroon mt-2 md:mt-32">Co-founder</p>
            </div>

            <img src={img3} alt="Tushar"
              className="about-profile-img profile-img relative md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 h-[35vh] sm:h-[40vh] md:h-[80vh] lg:h-[85vh] w-auto object-contain object-bottom drop-shadow-2xl" />

            <div className="about-bio relative md:absolute md:left-auto md:right-[10%] md:bottom-[20%] w-full md:w-80 bio-text">
              <h3 className="text-[10px] md:text-sm font-sans font-bold text-maroon uppercase mb-2 md:mb-6 tracking-wider text-center md:text-right">Welcome To <br className="hidden md:inline" />Our Website</h3>
              <p className="about-bio-copy text-[11px] sm:text-xs md:text-sm font-sans text-maroon uppercase leading-relaxed font-semibold text-center md:text-right">
                I am Tushar Ahammad, and I <br className="hidden md:inline" />firmly believe that "win the <br className="hidden md:inline" />world with being truthful" <br className="hidden md:inline" />is the real path. chooses to <br className="hidden md:inline" />"break the rules" and forge <br className="hidden md:inline" />your own route.
              </p>
            </div>
          </div>
        </div>

        <div className="slide bg-bglight flex flex-col items-center justify-center" id="slide-3">
          {/* Pulsing ring background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="ring-1 absolute rounded-full" style={{ width: '30vw', height: '30vw', border: '1px solid rgba(107, 0, 11, 0.2)' }}></div>
            <div className="ring-2 absolute rounded-full" style={{ width: '50vw', height: '50vw', border: '1px solid rgba(107, 0, 11, 0.15)' }}></div>
            <div className="ring-3 absolute rounded-full" style={{ width: '70vw', height: '70vw', border: '1px solid rgba(107, 0, 11, 0.08)' }}></div>
          </div>

          <div className="text-center thank-you-text opacity-0 z-10 px-6">
            <h1 className="about-thank-title thank-you-line-1 text-6xl md:text-9xl font-serif font-bold text-maroon uppercase tracking-widest" style={{ opacity: 0 }}>Thank You</h1>
            <h2 className="about-thank-subtitle thank-you-line-2 text-2xl md:text-4xl font-sans font-medium text-maroon mt-6 uppercase tracking-wider" style={{ opacity: 0 }}>For Visiting</h2>
            <h3 className="about-thank-script thank-you-line-3 text-4xl md:text-6xl font-serif italic text-maroon mt-4" style={{ opacity: 0 }}>Our Website</h3>
          </div>
        </div>

      </div>

      <div id="scroll-track" className="relative w-full z-0">
        <section id="section-laham" className="h-screen w-full section-trigger" data-index="0"></section>
        <section id="section-sourav" className="h-screen w-full section-trigger" data-index="1"></section>
        <section id="section-tushar" className="h-screen w-full section-trigger" data-index="2"></section>
        <section id="section-thankyou" className="h-screen w-full section-trigger" data-index="3"></section>
      </div>
    </>
  );
};

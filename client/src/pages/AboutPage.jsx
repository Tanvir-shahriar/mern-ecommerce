import { useLayoutEffect } from 'react';
import { Seo } from '../components/Seo.jsx';

import img1 from '../assets/images/1.png';
import img2 from '../assets/images/2.png';
import img3 from '../assets/images/3.png';

export const AboutPage = () => {
  useLayoutEffect(() => {
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.documentElement.style.scrollSnapType = 'y mandatory';
    document.documentElement.style.scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overscrollBehaviorY = 'contain';
    document.documentElement.style.overflowAnchor = 'none';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#EAEAEA';
    document.body.style.overflowX = 'hidden';
    document.body.style.height = 'auto';
    document.body.style.overscrollBehaviorY = 'contain';

    // 2. Drive the fixed slides from the scroll-snap sections. The reference
    // completes the outgoing animation before it starts the next entrance.
    const triggers = [...document.querySelectorAll('.section-trigger')];
    const slides = [...document.querySelectorAll('.slide')];
    const exitDuration = prefersReducedMotion ? 0 : 900;
    let activeIndex = -1;
    let requestedIndex = -1;
    let isTransitioning = false;
    let scrollFrame = null;
    let entryFrame = null;
    let transitionTimer = null;

    const clearSlideState = (slide) => {
      slide.classList.remove('active', 'exit-up', 'exit-down', 'enter-from-top', 'enter-from-bottom');
      slide.setAttribute('aria-hidden', 'true');
    };

    const cancelPendingEntry = () => {
      if (entryFrame !== null) {
        cancelAnimationFrame(entryFrame);
        entryFrame = null;
      }
    };

    slides.forEach(clearSlideState);

    const enterSlide = (index, direction) => {
      cancelPendingEntry();

      const slide = slides[index];
      activeIndex = index;

      // The extra end trigger intentionally resolves to no slide, letting the
      // final screen leave just like it does in the reference.
      if (!slide) return;

      clearSlideState(slide);
      slide.classList.add(direction < 0 ? 'enter-from-top' : 'enter-from-bottom');
      slide.setAttribute('aria-hidden', 'false');

      // Keep the starting pose on screen for one paint so every entrance,
      // including the first one, reliably animates.
      entryFrame = requestAnimationFrame(() => {
        entryFrame = requestAnimationFrame(() => {
          if (activeIndex === index && !isTransitioning) {
            slide.classList.add('active');
          }
          entryFrame = null;
        });
      });
    };

    const finishTransition = (fromIndex) => {
      const outgoingSlide = slides[fromIndex];
      if (outgoingSlide) clearSlideState(outgoingSlide);

      isTransitioning = false;
      transitionTimer = null;

      const targetIndex = requestedIndex;
      enterSlide(targetIndex, targetIndex < fromIndex ? -1 : 1);
    };

    const requestSlide = (nextIndex) => {
      if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= triggers.length) return;

      requestedIndex = nextIndex;

      if (isTransitioning) {
        // If the user reverses before the exit has completed, restore the
        // outgoing slide from its current position instead of flashing blank.
        if (nextIndex === activeIndex) {
          window.clearTimeout(transitionTimer);
          transitionTimer = null;
          isTransitioning = false;

          const interruptedSlide = slides[activeIndex];
          if (interruptedSlide) {
            interruptedSlide.classList.remove('exit-up', 'exit-down');
            interruptedSlide.classList.add('active');
            interruptedSlide.setAttribute('aria-hidden', 'false');
          }
        }
        return;
      }

      if (nextIndex === activeIndex) return;

      const fromIndex = activeIndex;
      const outgoingSlide = slides[fromIndex];

      if (!outgoingSlide) {
        enterSlide(nextIndex, nextIndex < fromIndex ? -1 : 1);
        return;
      }

      const direction = nextIndex > fromIndex ? 1 : -1;
      isTransitioning = true;
      cancelPendingEntry();
      outgoingSlide.classList.remove('active', 'enter-from-top', 'enter-from-bottom');
      outgoingSlide.classList.add(direction > 0 ? 'exit-up' : 'exit-down');

      transitionTimer = window.setTimeout(() => finishTransition(fromIndex), exitDuration);
    };

    const getNearestTriggerIndex = () => {
      const viewportCenter = window.innerHeight / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      triggers.forEach((trigger) => {
        const rect = trigger.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        const index = Number.parseInt(trigger.dataset.index, 10);

        if (distance < nearestDistance && Number.isFinite(index)) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      return nearestIndex;
    };

    const syncSlideToScroll = () => {
      scrollFrame = null;
      requestSlide(getNearestTriggerIndex());
    };

    const queueScrollSync = () => {
      if (scrollFrame === null) {
        scrollFrame = requestAnimationFrame(syncSlideToScroll);
      }
    };

    window.addEventListener('scroll', queueScrollSync, { passive: true });
    window.addEventListener('resize', queueScrollSync);
    queueScrollSync();

    // Cleanup
    return () => {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      cancelPendingEntry();
      if (transitionTimer !== null) window.clearTimeout(transitionTimer);
      window.removeEventListener('scroll', queueScrollSync);
      window.removeEventListener('resize', queueScrollSync);
      slides.forEach(clearSlideState);

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
            opacity: 1 !important;
            visibility: visible !important;
            transform: translate3d(0, 0, 0) !important;
        }

        /* The reference keeps this page presentation completely unobstructed. */
        .scroll-to-top-button {
            display: none !important;
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
            background: #EAEAEA;
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
            background: #EAEAEA;
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100vh;
            gap: clamp(1rem, 3vh, 1.5rem);
            padding: 5.75rem 1.5rem 1rem;
            padding-top: clamp(5.75rem, 12svh, 7rem);
            padding-bottom: clamp(1rem, 4svh, 2.5rem);
        }

        .slides-container :is(h1, h2, h3, p) {
            margin: 0;
        }

        .about-intro {
            position: relative;
            z-index: 30;
            text-align: center;
        }

        .slide .about-kicker,
        .slide .about-name,
        .slide .about-role,
        .slide .about-thank-title,
        .slide .about-thank-script {
            font-family: "Playfair Display", Georgia, serif;
        }

        .slide .about-kicker {
            margin-bottom: 0.25rem;
        }

        .slide .about-name {
            margin-left: 0;
            font-style: italic;
        }

        .slide .about-role {
            margin-top: 0.5rem;
        }

        .about-profile-img {
            position: relative;
            z-index: 10;
            width: auto;
            object-fit: contain;
            object-position: bottom;
            filter: drop-shadow(0 25px 25px rgb(0 0 0 / 0.15));
        }

        .about-bio {
            position: relative;
            z-index: 30;
            width: 100%;
            font-family: Inter, sans-serif;
            text-align: center;
        }

        .about-bio h3 {
            margin-bottom: 0.5rem;
            font-size: 0.625rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            line-height: 1.25;
            text-transform: uppercase;
        }

        .about-bio-copy {
            font-weight: 600;
            line-height: 1.625;
            text-transform: uppercase;
        }

        .about-bio br {
            display: none;
        }

        #slide-3 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .about-rings {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            pointer-events: none;
        }

        .about-rings > div {
            position: absolute;
            border-radius: 9999px;
        }

        .thank-you-text {
            z-index: 10;
            padding: 0 1.5rem;
            text-align: center;
            opacity: 0;
        }

        .slide .about-thank-title {
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }

        .slide .about-thank-subtitle {
            margin-top: 1.5rem;
            font-family: Inter, sans-serif;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .slide .about-thank-script {
            margin-top: 1rem;
            font-style: italic;
        }

        #scroll-track {
            position: relative;
            z-index: 0;
            width: 100%;
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
            z-index: 20;
        }

        .slide.exit-down {
            opacity: 1;
            visibility: visible;
            z-index: 20;
        }

        /* Profile slides: staged entry poses */
        .profile-img {
            transform: translate3d(0, 115%, 0);
            opacity: 1;
            transition: transform 860ms cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform;
            backface-visibility: hidden;
        }

        @media (min-width: 768px) {
            .profile-img {
                transform: translate3d(-50%, 115%, 0);
            }
        }

        .slide .about-kicker,
        .slide .about-name,
        .slide .about-role,
        .slide .about-bio h3,
        .slide .about-bio-copy {
            opacity: 0;
            transform: translate3d(0, 28px, 0);
            will-change: transform, opacity;
            backface-visibility: hidden;
        }

        .slide .about-kicker {
            transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1) 180ms,
                        opacity 420ms ease 180ms;
        }

        .slide .about-bio h3 {
            transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1) 360ms,
                        opacity 400ms ease 360ms;
        }

        .slide .about-name {
            transition: transform 620ms cubic-bezier(0.16, 1, 0.3, 1) 500ms,
                        opacity 460ms ease 500ms;
        }

        .slide .about-bio-copy {
            transition: transform 640ms cubic-bezier(0.16, 1, 0.3, 1) 720ms,
                        opacity 480ms ease 720ms;
        }

        .slide .about-role {
            transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 920ms,
                        opacity 380ms ease 920ms;
        }

        .slide.enter-from-top .profile-img {
            transform: translate3d(0, -115%, 0);
        }

        .slide.enter-from-top :is(.about-kicker, .about-name, .about-role, .about-bio h3, .about-bio-copy) {
            transform: translate3d(0, -28px, 0);
        }

        @media (min-width: 768px) {
            .slide.enter-from-top .profile-img {
                transform: translate3d(-50%, -115%, 0);
            }
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
            height: clamp(15rem, 36vh, 26rem) !important;
            height: clamp(15rem, 36svh, 26rem) !important;
            max-height: calc(100vh - 18rem);
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
                display: block;
                padding: 0;
            }

            .slide .about-intro {
                position: absolute;
                left: clamp(2rem, 10vw, 9rem) !important;
                top: clamp(9rem, 28vh, 18rem) !important;
                left: clamp(2rem, 10vw, 9rem) !important;
                top: clamp(9rem, 28svh, 18rem) !important;
                text-align: left;
            }

            .slide .about-kicker {
                font-size: clamp(4rem, 5vw, 4.5rem) !important;
            }

            .slide .about-name {
                font-size: clamp(5.5rem, 8.8vw, 8rem) !important;
                margin-left: 3rem;
            }

            .slide .about-role {
                margin-top: clamp(4.5rem, 14vh, 8rem) !important;
                margin-top: clamp(4.5rem, 14svh, 8rem) !important;
            }

            .slide .about-profile-img {
                position: absolute;
                bottom: 0;
                left: 50%;
                height: clamp(30rem, 80vh, 52rem) !important;
                height: clamp(30rem, 80svh, 52rem) !important;
                max-height: 88svh;
            }

            .slide .about-bio {
                position: absolute;
                right: clamp(2rem, 10vw, 9rem) !important;
                bottom: clamp(4rem, 20vh, 10rem) !important;
                bottom: clamp(4rem, 20svh, 10rem) !important;
                width: 20rem;
                text-align: right;
            }

            .slide .about-bio-sourav {
                bottom: clamp(3rem, 15vh, 8.5rem) !important;
                bottom: clamp(3rem, 15svh, 8.5rem) !important;
                width: 24rem;
            }

            .about-bio h3 {
                margin-bottom: 1.5rem;
                font-size: 0.875rem;
            }

            .about-bio br {
                display: inline;
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
            .slide .about-name {
                margin-left: 6rem;
            }

            .slide .about-profile-img {
                height: clamp(34rem, 85vh, 56rem) !important;
                height: clamp(34rem, 85svh, 56rem) !important;
            }
        }

        /* Entry and rest */
        .slide.active .profile-img {
            transform: translate3d(0, 0%, 0);
        }

        @media (min-width: 768px) {
            .slide.active .profile-img {
                transform: translate3d(-50%, 0%, 0);
            }
        }

        .slide.active :is(.about-kicker, .about-name, .about-role, .about-bio h3, .about-bio-copy) {
            transform: translate3d(0, 0, 0);
            opacity: 1;
        }

        /* Downward page movement: portrait leaves first, supporting copy trails. */
        .slide.exit-up .profile-img {
            transform: translate3d(0, -115%, 0);
            transition: transform 680ms cubic-bezier(0.7, 0, 0.84, 0);
        }

        @media (min-width: 768px) {
            .slide.exit-up .profile-img {
                transform: translate3d(-50%, -115%, 0);
            }
        }

        .slide.exit-up .about-kicker {
            transform: translate3d(0, -46px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 100ms,
                        opacity 280ms ease 100ms;
        }

        .slide.exit-up .about-bio h3 {
            transform: translate3d(0, -32px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 160ms,
                        opacity 280ms ease 160ms;
        }

        .slide.exit-up .about-name {
            transform: translate3d(0, -54px, 0);
            opacity: 0;
            transition: transform 420ms cubic-bezier(0.7, 0, 0.84, 0) 330ms,
                        opacity 300ms ease 330ms;
        }

        .slide.exit-up .about-bio-copy {
            transform: translate3d(0, -30px, 0);
            opacity: 0;
            transition: transform 420ms cubic-bezier(0.7, 0, 0.84, 0) 420ms,
                        opacity 300ms ease 420ms;
        }

        .slide.exit-up .about-role {
            transform: translate3d(0, -38px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 500ms,
                        opacity 280ms ease 500ms;
        }

        /* Reverse scrolling mirrors the choreography. */
        .slide.exit-down .profile-img {
            transform: translate3d(0, 115%, 0);
            transition: transform 680ms cubic-bezier(0.7, 0, 0.84, 0);
        }

        @media (min-width: 768px) {
            .slide.exit-down .profile-img {
                transform: translate3d(-50%, 115%, 0);
            }
        }

        .slide.exit-down .about-kicker {
            transform: translate3d(0, 46px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 100ms,
                        opacity 280ms ease 100ms;
        }

        .slide.exit-down .about-bio h3 {
            transform: translate3d(0, 32px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 160ms,
                        opacity 280ms ease 160ms;
        }

        .slide.exit-down .about-name {
            transform: translate3d(0, 54px, 0);
            opacity: 0;
            transition: transform 420ms cubic-bezier(0.7, 0, 0.84, 0) 330ms,
                        opacity 300ms ease 330ms;
        }

        .slide.exit-down .about-bio-copy {
            transform: translate3d(0, 30px, 0);
            opacity: 0;
            transition: transform 420ms cubic-bezier(0.7, 0, 0.84, 0) 420ms,
                        opacity 300ms ease 420ms;
        }

        .slide.exit-down .about-role {
            transform: translate3d(0, 38px, 0);
            opacity: 0;
            transition: transform 380ms cubic-bezier(0.7, 0, 0.84, 0) 500ms,
                        opacity 280ms ease 500ms;
        }

        /* Thank You Pulsing Ring Animations */
        @keyframes pulseRing {
            0% {
                transform: scale(0.85);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(0.85);
            }
        }

        @keyframes pulseRingSlow {
            0% {
                transform: scale(0.9);
            }
            50% {
                transform: scale(1.08);
            }
            100% {
                transform: scale(0.9);
            }
        }

        @keyframes pulseRingOuter {
            0% {
                transform: scale(0.95);
            }
            50% {
                transform: scale(1.03);
            }
            100% {
                transform: scale(0.95);
            }
        }

        #slide-3 .ring-1,
        #slide-3 .ring-2,
        #slide-3 .ring-3 {
            opacity: 0;
            transition: opacity 480ms ease;
            will-change: transform, opacity;
        }

        #slide-3.active .ring-1 {
            opacity: 0.6;
            animation: pulseRing 4s ease-in-out infinite;
        }

        #slide-3.active .ring-2 {
            opacity: 0.4;
            animation: pulseRingSlow 6s ease-in-out 100ms infinite;
        }

        #slide-3.active .ring-3 {
            opacity: 0.2;
            animation: pulseRingOuter 8s ease-in-out 200ms infinite;
        }

        #slide-3:is(.exit-up, .exit-down) :is(.ring-1, .ring-2, .ring-3) {
            opacity: 0;
        }

        /* The reference resolves the title from a soft overscale, then adds
           the two supporting lines in sequence. */
        #slide-3:is(.active, .exit-up, .exit-down) .thank-you-text {
            opacity: 1;
        }

        #slide-3.active .thank-you-line-1 {
            animation: thankTitleIn 680ms cubic-bezier(0.16, 1, 0.3, 1) 80ms forwards;
        }

        #slide-3.active .thank-you-line-2 {
            animation: fadeSlideUp 560ms cubic-bezier(0.16, 1, 0.3, 1) 360ms forwards;
        }

        #slide-3.active .thank-you-line-3 {
            animation: fadeSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 620ms forwards;
        }

        #slide-3.exit-up .thank-you-line-1 {
            animation: thankLineOutUp 360ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }

        #slide-3.exit-up .thank-you-line-2 {
            animation: thankLineOutUp 360ms cubic-bezier(0.7, 0, 0.84, 0) 120ms forwards;
        }

        #slide-3.exit-up .thank-you-line-3 {
            animation: thankLineOutUp 360ms cubic-bezier(0.7, 0, 0.84, 0) 220ms forwards;
        }

        #slide-3.exit-down .thank-you-line-1 {
            animation: thankLineOutDown 360ms cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }

        #slide-3.exit-down .thank-you-line-2 {
            animation: thankLineOutDown 360ms cubic-bezier(0.7, 0, 0.84, 0) 120ms forwards;
        }

        #slide-3.exit-down .thank-you-line-3 {
            animation: thankLineOutDown 360ms cubic-bezier(0.7, 0, 0.84, 0) 220ms forwards;
        }

        @keyframes thankTitleIn {
            from {
                transform: translateY(14px) scale(1.08);
                filter: blur(10px);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                filter: blur(0);
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

        @keyframes thankLineOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-28px);
                opacity: 0;
            }
        }

        @keyframes thankLineOutDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(28px);
                opacity: 0;
            }
        }

        /* Hide scrollbar for cleaner presentation */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
            .profile-img,
            .slide .about-kicker,
            .slide .about-name,
            .slide .about-role,
            .slide .about-bio h3,
            .slide .about-bio-copy,
            .thank-you-text,
            .thank-you-line-1,
            .thank-you-line-2,
            .thank-you-line-3,
            .ring-1,
            .ring-2,
            .ring-3 {
                animation-duration: 0.01ms !important;
                animation-delay: 0ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0ms !important;
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
          <div className="about-rings absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
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
        <section id="section-about-exit" className="h-screen w-full section-trigger" data-index="4" aria-hidden="true"></section>
      </div>
    </>
  );
};

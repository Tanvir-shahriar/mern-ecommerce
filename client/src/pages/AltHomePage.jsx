import { ArrowRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import heroFinalFrame from '../assets/images/hero-female-model-final.avif';
import heroMotionFrame from '../assets/images/hero-female-model-motion.avif';
import heroOpeningFrame from '../assets/images/hero-female-model-opening.avif';
import { LiquidHoverCanvas } from '../components/LiquidHoverCanvas.jsx';
import { Seo } from '../components/Seo.jsx';

const WORDMARK = 'LAHVENTURE';
const HERO_FRAMES = [
  heroOpeningFrame,
  heroMotionFrame,
  heroFinalFrame
];
const DESKTOP_FOCAL_POINTS = [
  [0.5, 0.1],
  [0.5, 0.1],
  [0.5, 0.42]
];
const MOBILE_FOCAL_POINTS = [
  [0.38, 0.08],
  [0.38, 0.08],
  [0.5, 0.45]
];
const MARQUEE_ITEMS = [
  'Outerwear',
  'Knitwear',
  'Dresses',
  'Accessories',
  'New arrivals'
];

const clamp = (value, minimum = 0, maximum = 1) => (
  Math.min(maximum, Math.max(minimum, value))
);

const easeInOutQuad = (value) => (
  value < 0.5
    ? 2 * value * value
    : 1 - ((-2 * value + 2) ** 2) / 2
);

export const AltHomePage = () => {
  const trackRef = useRef(null);
  const pinnedRef = useRef(null);
  const liquidProgressRef = useRef(0);
  const eyebrowRef = useRef(null);
  const wordmarkRef = useRef(null);
  const copyRef = useRef(null);
  const scrollHintRef = useRef(null);
  const frameRefs = useRef([]);
  const letterRefs = useRef([]);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 809px)').matches
      : false
  ));
  const [reduceMotion, setReduceMotion] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ));

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 809px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMediaPreferences = () => {
      setIsMobile(mobileQuery.matches);
      setReduceMotion(motionQuery.matches);
    };

    syncMediaPreferences();
    mobileQuery.addEventListener?.('change', syncMediaPreferences);
    motionQuery.addEventListener?.('change', syncMediaPreferences);

    return () => {
      mobileQuery.removeEventListener?.('change', syncMediaPreferences);
      motionQuery.removeEventListener?.('change', syncMediaPreferences);
    };
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pinned = pinnedRef.current;
    if (!track || !pinned) return undefined;

    let animationFrame = 0;
    const letters = Array.from(WORDMARK);

    const applyProgress = (progress) => {
      liquidProgressRef.current = progress;
      const frameCount = frameRefs.current.length;
      if (frameCount) {
        const frameProgress = progress * (frameCount - 1);
        const activeFrame = clamp(Math.floor(frameProgress), 0, frameCount - 1);
        const blend = easeInOutQuad(clamp(frameProgress - activeFrame));
        const scale = (isMobile ? 1.035 : 1.055)
          - (isMobile ? 0.023 : 0.037) * progress;

        frameRefs.current.forEach((frame, index) => {
          if (!frame) return;
          frame.style.opacity = String(
            index <= activeFrame ? 1 : index === activeFrame + 1 ? blend : 0
          );
          frame.style.transform = `scale(${scale.toFixed(4)})`;
        });
      }

      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(
          1 - clamp((progress - 0.72) / 0.13)
        );
      }

      const letterStep = 0.36 / Math.max(1, letters.length);
      letterRefs.current.forEach((letter, index) => {
        if (!letter) return;
        const reveal = clamp(
          (progress - (0.05 + index * letterStep)) / 0.13
        );
        letter.style.opacity = String(reveal);
        letter.style.transform = `translateY(${(1 - reveal) * 100}%)`;
      });

      if (wordmarkRef.current) {
        const wordmarkProgress = clamp((progress - 0.42) / 0.4);
        wordmarkRef.current.style.transform = [
          `translateY(${-wordmarkProgress * 70}px)`,
          `scale(${1 - wordmarkProgress * 0.07})`
        ].join(' ');
        wordmarkRef.current.style.opacity = String(
          1 - wordmarkProgress * 0.15
        );
      }

      if (copyRef.current) {
        const copyProgress = clamp((progress - 0.5) / 0.22);
        copyRef.current.style.opacity = String(copyProgress);
        copyRef.current.style.transform = `translateY(${(1 - copyProgress) * 26}px)`;
        copyRef.current.style.pointerEvents = copyProgress > 0.8 ? 'auto' : 'none';
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(
          1 - clamp(progress / 0.1)
        );
      }
    };

    const applyReducedMotionState = () => {
      liquidProgressRef.current = 1;
      frameRefs.current.forEach((frame, index) => {
        if (!frame) return;
        frame.style.opacity = String(index === frameRefs.current.length - 1 ? 1 : 0);
        frame.style.transform = 'scale(1.018)';
      });
      letterRefs.current.forEach((letter) => {
        if (!letter) return;
        letter.style.opacity = '1';
        letter.style.transform = 'translateY(0)';
      });
      if (eyebrowRef.current) eyebrowRef.current.style.opacity = '1';
      if (wordmarkRef.current) {
        wordmarkRef.current.style.opacity = '1';
        wordmarkRef.current.style.transform = 'none';
      }
      if (copyRef.current) {
        copyRef.current.style.opacity = '1';
        copyRef.current.style.transform = 'none';
        copyRef.current.style.pointerEvents = 'auto';
      }
      if (scrollHintRef.current) scrollHintRef.current.style.opacity = '0';
    };

    const update = () => {
      animationFrame = 0;
      const header = document.querySelector('.site-header');
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const visibleHeight = Math.max(1, window.innerHeight - headerHeight);

      pinned.style.height = `${visibleHeight}px`;
      pinned.style.minHeight = `${Math.min(620, visibleHeight)}px`;

      if (reduceMotion) {
        pinned.style.position = 'absolute';
        pinned.style.top = '0px';
        pinned.style.bottom = 'auto';
        applyReducedMotionState();
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - visibleHeight);
      const distanceFromPinStart = headerHeight - trackRect.top;
      let progress = 0;

      if (distanceFromPinStart <= 0) {
        pinned.style.position = 'absolute';
        pinned.style.top = '0px';
        pinned.style.bottom = 'auto';
      } else if (distanceFromPinStart <= travel) {
        pinned.style.position = 'fixed';
        pinned.style.top = `${headerHeight}px`;
        pinned.style.bottom = 'auto';
        progress = distanceFromPinStart / travel;
      } else {
        pinned.style.position = 'absolute';
        pinned.style.top = 'auto';
        pinned.style.bottom = '0px';
        progress = 1;
      }

      applyProgress(clamp(progress));
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [isMobile, reduceMotion]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return undefined;

    let wheelAnimationFrame = 0;
    let wheelTarget = window.scrollY;
    let previousFrameTime = 0;

    const cancelWheelMomentum = () => {
      if (wheelAnimationFrame) {
        window.cancelAnimationFrame(wheelAnimationFrame);
        wheelAnimationFrame = 0;
      }
      wheelTarget = window.scrollY;
      previousFrameTime = 0;
    };

    const animateWheelMomentum = (time) => {
      const elapsed = previousFrameTime
        ? Math.min(32, time - previousFrameTime)
        : 16.67;
      previousFrameTime = time;

      const currentScroll = window.scrollY;
      const distance = wheelTarget - currentScroll;

      if (Math.abs(distance) < 0.5) {
        window.scrollTo({ top: wheelTarget, left: 0, behavior: 'instant' });
        wheelAnimationFrame = 0;
        previousFrameTime = 0;
        return;
      }

      const damping = 1 - Math.exp(-14 * (elapsed / 1000));
      window.scrollTo({
        top: currentScroll + distance * damping,
        left: 0,
        behavior: 'instant'
      });
      wheelAnimationFrame = window.requestAnimationFrame(animateWheelMomentum);
    };

    const isDiscreteMouseWheel = (event) => {
      const pixelDelta = Math.abs(event.deltaY);
      const legacyDelta = Math.abs(event.wheelDeltaY ?? 0);
      const usesWheelSteps = legacyDelta >= 120
        && Math.abs(legacyDelta % 120) < 0.01;
      const usesLargePixelSteps = legacyDelta === 0
        && Number.isInteger(event.deltaY)
        && pixelDelta >= 80;

      return event.deltaMode !== 0 || usesWheelSteps || usesLargePixelSteps;
    };

    const onWheel = (event) => {
      if (
        event.defaultPrevented
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || event.deltaY === 0
      ) {
        return;
      }

      if (!isDiscreteMouseWheel(event)) {
        cancelWheelMomentum();
        return;
      }

      const headerHeight = document
        .querySelector('.site-header')
        ?.getBoundingClientRect().height ?? 0;
      const trackRect = track.getBoundingClientRect();
      const heroIsVisible = trackRect.bottom > headerHeight
        && trackRect.top < window.innerHeight;

      if (!heroIsVisible) {
        cancelWheelMomentum();
        return;
      }

      event.preventDefault();

      const modeMultiplier = event.deltaMode === 1
        ? 18
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      const pixelDelta = event.deltaY * modeMultiplier;
      const boundedDelta = Math.sign(pixelDelta) * Math.min(
        Math.abs(pixelDelta) * 1.15,
        window.innerHeight * 0.8
      );
      const maximumScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      if (!wheelAnimationFrame) wheelTarget = window.scrollY;
      wheelTarget = clamp(wheelTarget + boundedDelta, 0, maximumScroll);

      if (!wheelAnimationFrame) {
        wheelAnimationFrame = window.requestAnimationFrame(animateWheelMomentum);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', cancelWheelMomentum, { passive: true });
    window.addEventListener('pointerdown', cancelWheelMomentum, { passive: true });
    window.addEventListener('keydown', cancelWheelMomentum);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', cancelWheelMomentum);
      window.removeEventListener('pointerdown', cancelWheelMomentum);
      window.removeEventListener('keydown', cancelWheelMomentum);
      cancelWheelMomentum();
    };
  }, [reduceMotion]);

  return (
    <div className="alt-home-wrapper">
      <Seo
        title="lahVenture — Autumn / Winter"
        description="A quieter luxury, made to last a lifetime."
      />

      {HERO_FRAMES.map((frame) => (
        <link key={frame} rel="preload" as="image" href={frame} />
      ))}

      <section
        ref={trackRef}
        className={`alt-home-hero${reduceMotion ? ' alt-home-hero--reduced' : ''}`}
        aria-labelledby="alt-home-wordmark"
      >
        <div
          ref={pinnedRef}
          className="alt-home-hero__viewport"
          style={{
            backgroundImage: `url(${heroOpeningFrame})`,
            backgroundPosition: isMobile ? '38% 8%' : '50% 10%',
            backgroundSize: 'cover'
          }}
        >
          <div
            className="alt-home-hero__frames"
            aria-hidden="true"
          >
            {HERO_FRAMES.map((frame, index) => (
              <img
                key={frame}
                ref={(node) => {
                  frameRefs.current[index] = node;
                }}
                className="alt-home-hero__frame"
                src={frame}
                alt=""
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                style={{
                  objectPosition: isMobile
                    ? `${index === 2 ? 50 : 38}% ${index === 2 ? 45 : 8}%`
                    : `50% ${index === 2 ? 42 : 10}%`
                }}
              />
            ))}
            <LiquidHoverCanvas
              images={HERO_FRAMES}
              progressRef={liquidProgressRef}
              focalPoints={
                isMobile ? MOBILE_FOCAL_POINTS : DESKTOP_FOCAL_POINTS
              }
              disabled={reduceMotion}
              mobile={isMobile}
              resolution={4}
              cursorSize={0.5}
              cursorPower={1}
              distortionPower={0.8}
            />
          </div>

          <div className="alt-home-hero__vignette" aria-hidden="true" />

          <div className="alt-home-hero__content">
            <p ref={eyebrowRef} className="alt-home-hero__eyebrow">
              Autumn — Winter 2026
            </p>

            <div ref={wordmarkRef} className="alt-home-hero__wordmark-wrap">
              <h1
                id="alt-home-wordmark"
                className="alt-home-hero__wordmark"
                aria-label="LAHVENTURE"
              >
                {Array.from(WORDMARK).map((letter, index) => (
                  <span
                    className="alt-home-hero__letter-clip"
                    aria-hidden="true"
                    key={`${letter}-${index}`}
                  >
                    <span
                      ref={(node) => {
                        letterRefs.current[index] = node;
                      }}
                      className="alt-home-hero__letter"
                    >
                      {letter}
                    </span>
                  </span>
                ))}
              </h1>
            </div>

            <div ref={copyRef} className="alt-home-hero__copy">
              <p>A quieter luxury, made to last a lifetime.</p>
              <Link
                className="alt-home-hero__cta"
                to="/products"
              >
                <span className="alt-home-hero__cta-sweep" aria-hidden="true" />
                <span>Discover the collection</span>
                <ArrowRight size={22} strokeWidth={1.25} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div
            ref={scrollHintRef}
            className="alt-home-hero__scroll-hint"
            aria-hidden="true"
          >
            <span>Scroll</span>
            <i />
          </div>
        </div>
      </section>

      <div className="alt-home-marquee" aria-label="Explore our collections">
        <div className="alt-home-marquee__track">
          {[0, 1].map((copyIndex) => (
            <div
              className="alt-home-marquee__set"
              aria-hidden={copyIndex === 1}
              key={copyIndex}
            >
              {MARQUEE_ITEMS.map((item) => (
                <span key={`${copyIndex}-${item}`}>
                  <Link to="/products">{item}</Link>
                  <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

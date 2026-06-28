import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const WATCH_GALLERY_IMAGES = [
  {
    id: 1,
    title: 'Aero Chronograph Gold',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    title: 'LahVenture Minimalist Steel',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    title: 'Classic Heritage White',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    title: 'Dark Edition Chrono',
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    title: 'Vintage Leather Explorer',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    title: 'Apex Diver Rose Gold',
    url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 7,
    title: 'Ocean Master Blue',
    url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80'
  }
];

export const PanoramicPhotoLibrary = () => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cursorRef = useRef(null);

  // Drag & Inertia physics state
  const positionRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startPosRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(null);

  // Custom follower cursor state
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Boundaries calculation
  const getBounds = useCallback(() => {
    if (!containerRef.current || !trackRef.current) return { min: 0, max: 0 };
    const containerWidth = containerRef.current.offsetWidth;
    const trackWidth = trackRef.current.scrollWidth;
    const min = Math.min(0, containerWidth - trackWidth - 60);
    return { min, max: 0 };
  }, []);

  // Smooth 60fps animation loop for smooth drag physics + follower cursor
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;

      // 1. Smooth custom ring cursor lag follow effect
      cursorPosRef.current.x += (mousePosRef.current.x - cursorPosRef.current.x) * 0.18;
      cursorPosRef.current.y += (mousePosRef.current.y - cursorPosRef.current.y) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorPosRef.current.x}px, ${cursorPosRef.current.y}px, 0) translate(-50%, -50%) scale(${
          isHovered ? (isMouseDown ? 0.85 : 1) : 0
        })`;
        cursorRef.current.style.opacity = isHovered ? '1' : '0';
      }

      // 2. Momentum drag physics & deceleration decay
      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.05) {
          positionRef.current += velocityRef.current;
          velocityRef.current *= 0.93;

          const { min, max } = getBounds();
          if (positionRef.current > max) {
            positionRef.current += (max - positionRef.current) * 0.2;
            velocityRef.current *= 0.5;
          } else if (positionRef.current < min) {
            positionRef.current += (min - positionRef.current) * 0.2;
            velocityRef.current *= 0.5;
          }
        } else {
          const { min, max } = getBounds();
          if (positionRef.current > max) positionRef.current += (max - positionRef.current) * 0.2;
          if (positionRef.current < min) positionRef.current += (min - positionRef.current) * 0.2;
        }
      }

      // 3. Apply smooth linear translation to track
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [getBounds, isHovered, isMouseDown]);

  // Pointer Events (Mouse + Touch)
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsMouseDown(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startPosRef.current = positionRef.current;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePosRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const deltaX = clientX - startXRef.current;
    
    velocityRef.current = ((clientX - lastXRef.current) / dt) * 16;
    lastXRef.current = clientX;
    lastTimeRef.current = now;

    const { min, max } = getBounds();
    let nextPos = startPosRef.current + deltaX;
    if (nextPos > max) {
      nextPos = max + (nextPos - max) * 0.3;
    } else if (nextPos < min) {
      nextPos = min + (nextPos - min) * 0.3;
    }

    positionRef.current = nextPos;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsMouseDown(false);
  };

  // Arrow Navigation
  const scrollStep = (direction) => {
    const cardWidth = 360;
    const { min, max } = getBounds();
    let target = positionRef.current + (direction === 'left' ? cardWidth : -cardWidth);
    target = Math.max(min, Math.min(max, target));
    
    velocityRef.current = (target - positionRef.current) * 0.15;
  };

  return (
    <section className="panoramic-library-section" aria-label="Watch Photography Gallery">
      {/* SVG Definition for Panoramic Mask matching reference image (clipPathUnits="objectBoundingBox") */}
      <svg className="panoramic-svg-defs" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <clipPath id="exact-panoramic-mask" clipPathUnits="objectBoundingBox">
            {/* Top dips down 14% in middle, bottom dips up 14% in middle */}
            <path d="M 0,0 Q 0.5,0.14 1,0 L 1,1 Q 0.5,0.86 0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Header matching reference image: "Interactions, Layout, & Custom Code" */}
      <div className="panoramic-library-header">
        <p className="panoramic-header-text">Interactions, Layout, &amp; Custom Code</p>
      </div>

      {/* Panoramic Screen Viewport Container with Exact Mask */}
      <div
        className="panoramic-viewport exact-panoramic-screen"
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handlePointerUp();
        }}
        onMouseMove={handlePointerMove}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Custom Circular Ring Follower Cursor */}
        <div className="panoramic-custom-cursor" ref={cursorRef} aria-hidden="true">
          <div className="cursor-dot" />
        </div>

        {/* Horizontal Drag Track holding clean photography cards */}
        <div className="panoramic-track" ref={trackRef}>
          {WATCH_GALLERY_IMAGES.map((img) => (
            <article className="panoramic-card" key={img.id}>
              <div className="panoramic-card-media">
                <img src={img.url} alt={img.title} loading="lazy" draggable="false" />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Minimalist Circular Arrow Navigation Controls Centered Underneath */}
      <div className="panoramic-controls-row">
        <button
          type="button"
          className="panoramic-arrow-btn"
          onClick={() => scrollStep('left')}
          aria-label="Previous gallery image"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className="panoramic-arrow-btn"
          onClick={() => scrollStep('right')}
          aria-label="Next gallery image"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
};

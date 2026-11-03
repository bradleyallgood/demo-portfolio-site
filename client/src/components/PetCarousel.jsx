import { useRef, useState } from 'react';

// The track is a native scroll-snap row, so swiping works on touch screens without extra code.
export default function PetCarousel({ photos }) {
  const track = useRef(null);
  const [current, setCurrent] = useState(0);

  function show(index) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.current.scrollTo({
      left: index * track.current.clientWidth,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  function handleScroll() {
    const { scrollLeft, clientWidth } = track.current;
    setCurrent(Math.round(scrollLeft / clientWidth));
  }

  const count = photos.length;
  const caption = photos[current].caption;

  return (
    <div className="carousel" role="group" aria-roledescription="carousel" aria-label="Pet photos">
      <ul className="carousel-track" ref={track} onScroll={handleScroll}>
        {photos.map((photo, index) => (
          <li key={photo.id} aria-hidden={index !== current}>
            <img src={photo.imageUrl} alt={photo.alt} width="1200" height="1200" loading="lazy" />
          </li>
        ))}
      </ul>

      <div className="carousel-controls">
        <button type="button" onClick={() => show((current - 1 + count) % count)}>
          <span aria-hidden="true">←</span>
          <span className="sr-only">Previous photo</span>
        </button>
        <p aria-live="polite">
          {caption ? `${caption} · ` : ''}
          {current + 1} of {count}
        </p>
        <button type="button" onClick={() => show((current + 1) % count)}>
          <span aria-hidden="true">→</span>
          <span className="sr-only">Next photo</span>
        </button>
      </div>
    </div>
  );
}

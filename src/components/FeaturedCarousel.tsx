import React, { useState, useEffect } from 'react';
import { CampusEvent } from '../types';

interface FeaturedCarouselProps {
  events: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ events, onSelectEvent }) => {
  const featured = events.filter(e => e.isFeatured && e.isPublished && !e.isCancelled);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const current = featured[activeIndex];
  const seatsLeft = current.maxCapacity - current.registeredCount;

  return (
    <section className="py-4 bg-white border-bottom">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-uppercase px-2 py-1">Featured</span>
            <h5 className="mb-0 fw-bold text-dark">Highlights of the Month</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            {featured.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`btn btn-sm rounded-circle p-0 ${activeIndex === idx ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ width: '10px', height: '10px' }}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative">
          <div className="row g-0">
            <div className="col-lg-7 position-relative">
              <img
                src={current.posterUrl}
                alt={current.title}
                className="img-fluid w-100 object-fit-cover"
                style={{ height: '340px' }}
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                }}
              ></div>
              <div className="position-absolute bottom-0 start-0 p-3 text-white">
                <span className="badge bg-primary mb-1">{current.category}</span>
                <p className="small mb-0 opacity-75">
                  <i className="bi bi-geo-alt-fill me-1 text-warning"></i>
                  {current.venue}
                </p>
              </div>
            </div>

            <div className="col-lg-5 p-4 d-flex flex-column justify-content-between bg-light">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    {current.organizer}
                  </span>
                  <span className={`badge ${seatsLeft > 10 ? 'bg-success' : seatsLeft > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                    {seatsLeft > 0 ? `${seatsLeft} Seats Remaining` : 'Full Capacity'}
                  </span>
                </div>

                <h4 className="fw-bold text-dark mb-2 line-clamp-2">{current.title}</h4>

                <p className="text-secondary small mb-3 line-clamp-3" style={{ lineHeight: 1.5 }}>
                  {current.description}
                </p>

                <div className="bg-white p-2 rounded-3 border mb-3">
                  <div className="row g-2 text-center small text-muted">
                    <div className="col-6 border-end">
                      <i className="bi bi-calendar3 text-primary d-block mb-1"></i>
                      <strong className="text-dark d-block">{new Date(current.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                    <div className="col-6">
                      <i className="bi bi-clock text-primary d-block mb-1"></i>
                      <strong className="text-dark d-block">{current.startTime} - {current.endTime}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-primary w-100 fw-semibold rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={() => onSelectEvent(current)}
                >
                  <i className="bi bi-ticket-perforated"></i> View Event Details & RSVP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

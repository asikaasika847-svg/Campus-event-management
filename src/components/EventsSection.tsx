import React, { useState, useMemo } from 'react';
import { CampusEvent, EventCategory } from '../types';

interface EventsSectionProps {
  events: CampusEvent[];
  loading: boolean;
  onSelectEvent: (event: CampusEvent) => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Symposium',
];

export type DateFilterOption = 'all' | 'upcoming' | 'today' | 'this_week' | 'this_month' | 'past';
export type StatusFilterOption = 'all' | 'open' | 'limited' | 'full' | 'cancelled';
export type SortOption = 'date_asc' | 'date_desc' | 'title_asc' | 'title_desc' | 'seats_desc' | 'popularity_desc';

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  loading,
  onSelectEvent,
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('upcoming');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Normalized search keywords cleaner
  const cleanSearchTerm = useMemo(() => {
    return searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  }, [searchQuery]);

  // Comprehensive Filtering & Sorting Logic
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    weekFromNow.setHours(23, 59, 59, 999);

    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);
    monthFromNow.setHours(23, 59, 59, 999);

    const filtered = events.filter(event => {
      // Must be published in public catalog
      if (!event.isPublished) return false;

      // 1. Category Filter
      if (selectedCategory !== 'All' && event.category !== selectedCategory) {
        return false;
      }

      // 2. Search Term Filter (Title, Keywords, Organizer, Venue, Description, Tags)
      if (cleanSearchTerm) {
        const titleMatch = event.title.toLowerCase().includes(cleanSearchTerm);
        const descMatch = event.description.toLowerCase().includes(cleanSearchTerm);
        const venueMatch = event.venue.toLowerCase().includes(cleanSearchTerm);
        const orgMatch = event.organizer.toLowerCase().includes(cleanSearchTerm);
        const categoryMatch = event.category.toLowerCase().includes(cleanSearchTerm);
        const tagMatch = event.tags?.some(tag => tag.toLowerCase().includes(cleanSearchTerm)) || false;

        if (!titleMatch && !descMatch && !venueMatch && !orgMatch && !categoryMatch && !tagMatch) {
          return false;
        }
      }

      // 3. Date Filter
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);

      if (dateFilter === 'upcoming' && event.eventDate < todayStr) return false;
      if (dateFilter === 'today' && event.eventDate !== todayStr) return false;
      if (dateFilter === 'this_week' && (eventDate < today || eventDate > weekFromNow)) return false;
      if (dateFilter === 'this_month' && (eventDate < today || eventDate > monthFromNow)) return false;
      if (dateFilter === 'past' && event.eventDate >= todayStr) return false;

      // 4. Status Filter
      const seatsLeft = Math.max(0, event.maxCapacity - event.registeredCount);
      const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
      const isFull = seatsLeft === 0;
      const isCancelled = event.isCancelled;

      if (statusFilter === 'open') {
        if (isCancelled || isFull || isDeadlinePassed) return false;
      }
      if (statusFilter === 'limited') {
        if (isCancelled || isFull || isDeadlinePassed || seatsLeft >= 10) return false;
      }
      if (statusFilter === 'full') {
        if (!isFull) return false;
      }
      if (statusFilter === 'cancelled') {
        if (!isCancelled) return false;
      }

      return true;
    });

    // 5. Multi-Option Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
      if (sortBy === 'date_desc') {
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'seats_desc') {
        const aSeats = a.maxCapacity - a.registeredCount;
        const bSeats = b.maxCapacity - b.registeredCount;
        return bSeats - aSeats;
      }
      if (sortBy === 'popularity_desc') {
        return b.registeredCount - a.registeredCount;
      }
      return 0;
    });
  }, [events, selectedCategory, cleanSearchTerm, dateFilter, statusFilter, sortBy]);

  // Reset function
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setDateFilter('all');
    setStatusFilter('all');
    setSortBy('date_asc');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All' ||
    dateFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'date_asc'
  );

  const totalPublishedEvents = events.filter(e => e.isPublished).length;

  return (
    <section id="events-catalog" className="py-5 bg-light" aria-label="Campus Events Catalog">
      <div className="container">
        {/* Section Heading & Search Bar */}
        <div className="row align-items-end mb-4 g-3">
          <div className="col-lg-6">
            <div className="d-inline-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill fw-semibold">
                Campus Events Catalog
              </span>
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill">
                Live Firestore Feed
              </span>
            </div>
            <h2 className="fw-bold text-dark mb-1">Discover & Filter Events</h2>
            <p className="text-muted mb-0">
              Explore university hackathons, workshops, guest lectures, sports, and cultural festivals.
            </p>
          </div>

          <div className="col-lg-6">
            {/* Search Input Bar */}
            <div className="input-group shadow-sm rounded-pill overflow-hidden bg-white border">
              <span className="input-group-text bg-white border-0 ps-3 text-muted" id="search-addon">
                <i className="bi bi-search" aria-hidden="true"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 shadow-none ps-2"
                placeholder="Search by title, keywords, organizer, or venue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search events by title and keywords"
                aria-describedby="search-addon"
              />
              {searchQuery && (
                <button
                  className="btn bg-white border-0 text-muted pe-3"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="card border-0 shadow-sm rounded-4 bg-white p-3 p-md-4 mb-4">
          {/* Top Row: Categories Navigation */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom mb-3">
            <div className="d-flex align-items-center gap-2 overflow-auto w-100 w-md-auto pb-1 pb-md-0" role="tablist" aria-label="Event Categories">
              {CATEGORIES.map(cat => {
                const count = cat === 'All'
                  ? totalPublishedEvents
                  : events.filter(e => e.isPublished && e.category === cat).length;
                const isActive = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap transition-all ${
                      isActive
                        ? 'btn-primary shadow-sm fw-semibold'
                        : 'btn-outline-secondary border-0 bg-light text-secondary'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                    <span className={`badge ms-2 ${isActive ? 'bg-white text-primary' : 'bg-secondary bg-opacity-25 text-dark'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              className="btn btn-outline-secondary btn-sm d-md-none rounded-pill px-3"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-expanded={showMobileFilters}
              aria-controls="advanced-filter-controls"
            >
              <i className="bi bi-funnel me-1"></i> {showMobileFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>

          {/* Advanced Filter Controls (Dropdowns & Sorting) */}
          <div id="advanced-filter-controls" className={`row g-3 align-items-center ${showMobileFilters ? 'd-flex' : 'd-none d-md-flex'}`}>
            {/* Date Window Filter */}
            <div className="col-sm-6 col-md-3">
              <label htmlFor="filter-date-select" className="form-label small fw-semibold text-muted mb-1">
                <i className="bi bi-calendar-event me-1"></i> Date Range
              </label>
              <select
                id="filter-date-select"
                className="form-select form-select-sm rounded-3"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as DateFilterOption)}
                aria-label="Filter events by date range"
              >
                <option value="all">All Scheduled Dates</option>
                <option value="upcoming">Upcoming Events (Default)</option>
                <option value="today">Happening Today</option>
                <option value="this_week">This Week (Next 7 Days)</option>
                <option value="this_month">This Month (Next 30 Days)</option>
                <option value="past">Past / Completed Events</option>
              </select>
            </div>

            {/* Event Availability / Status Filter */}
            <div className="col-sm-6 col-md-3">
              <label htmlFor="filter-status-select" className="form-label small fw-semibold text-muted mb-1">
                <i className="bi bi-check2-circle me-1"></i> Seat & Status
              </label>
              <select
                id="filter-status-select"
                className="form-select form-select-sm rounded-3"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilterOption)}
                aria-label="Filter events by seat availability and status"
              >
                <option value="all">All Event Statuses</option>
                <option value="open">Open for RSVP (Seats Available)</option>
                <option value="limited">Limited Seats Remaining (&lt;10)</option>
                <option value="full">Full Capacity Only</option>
                <option value="cancelled">Cancelled Events</option>
              </select>
            </div>

            {/* Sorting Order */}
            <div className="col-sm-6 col-md-3">
              <label htmlFor="filter-sort-select" className="form-label small fw-semibold text-muted mb-1">
                <i className="bi bi-sort-down me-1"></i> Sort Order
              </label>
              <select
                id="filter-sort-select"
                className="form-select form-select-sm rounded-3"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Sort events"
              >
                <option value="date_asc">Date: Soonest First</option>
                <option value="date_desc">Date: Furthest First</option>
                <option value="title_asc">Title: A to Z</option>
                <option value="title_desc">Title: Z to A</option>
                <option value="seats_desc">Seats: Highest Available</option>
                <option value="popularity_desc">Popularity: Most RSVPs</option>
              </select>
            </div>

            {/* Clear Filters Action */}
            <div className="col-sm-6 col-md-3 d-flex align-items-end pt-sm-4">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm rounded-pill w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={handleClearAllFilters}
                disabled={!hasActiveFilters}
                aria-label="Reset all search filters"
              >
                <i className="bi bi-arrow-counterclockwise"></i> Clear All Filters
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Result Counter Banner */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3 mt-3 border-top small">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-muted fw-semibold">
                Showing <strong className="text-dark">{filteredEvents.length}</strong> of {totalPublishedEvents} published events
              </span>

              {/* Individual Active Filter Chips with 1-click removal */}
              {cleanSearchTerm && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Search: "{searchQuery.trim()}"
                  <button
                    type="button"
                    className="btn-close ms-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => setSearchQuery('')}
                    aria-label="Remove search filter"
                  ></button>
                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Category: {selectedCategory}
                  <button
                    type="button"
                    className="btn-close ms-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => setSelectedCategory('All')}
                    aria-label="Remove category filter"
                  ></button>
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Date: {dateFilter.replace('_', ' ')}
                  <button
                    type="button"
                    className="btn-close ms-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => setDateFilter('all')}
                    aria-label="Remove date filter"
                  ></button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Status: {statusFilter}
                  <button
                    type="button"
                    className="btn-close ms-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => setStatusFilter('all')}
                    aria-label="Remove status filter"
                  ></button>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none small text-danger"
                onClick={handleClearAllFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" role="status" aria-live="polite">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading events from Cloud Firestore...</span>
            </div>
            <p className="text-muted fw-medium">Loading published events from Cloud Firestore...</p>
          </div>
        )}

        {/* Empty State When No Results Match */}
        {!loading && filteredEvents.length === 0 && (
          <div className="card border-0 shadow-sm p-5 text-center rounded-4 bg-white" role="region" aria-label="No matching events found">
            <div
              className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mx-auto mb-3 text-muted"
              style={{ width: '72px', height: '72px', fontSize: '2.2rem' }}
            >
              <i className="bi bi-search-heart" aria-hidden="true"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">No Matching Events Found</h4>
            <p className="text-muted mb-3 mx-auto" style={{ maxWidth: '480px' }}>
              {cleanSearchTerm
                ? `No scheduled events match your search term "${searchQuery.trim()}". Try checking your spelling, removing keywords, or resetting category and status filters.`
                : 'There are currently no events matching the active filter criteria. Try adjusting date or availability filters.'}
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 shadow-sm"
                onClick={handleClearAllFilters}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="row g-4" role="feed" aria-busy="false">
            {filteredEvents.map(event => {
              const availableSeats = Math.max(0, event.maxCapacity - event.registeredCount);
              const capacityPercentage = Math.min(100, Math.round((event.registeredCount / event.maxCapacity) * 100));
              const isFull = availableSeats === 0;
              const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);

              return (
                <div key={event.id} className="col-md-6 col-lg-4 d-flex">
                  <article className="card h-100 w-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column transition-hover bg-white">
                    {/* Poster Header */}
                    <div className="position-relative overflow-hidden" style={{ height: '190px' }}>
                      <img
                        src={event.posterUrl}
                        alt={`Poster for ${event.title}`}
                        className="w-100 h-100 object-fit-cover transition-transform"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
                        }}
                      ></div>

                      {/* Top Badges */}
                      <div className="position-absolute top-0 start-0 p-3 d-flex gap-2">
                        <span className="badge bg-primary shadow-sm">{event.category}</span>
                        {event.isCancelled && (
                          <span className="badge bg-danger shadow-sm">Cancelled</span>
                        )}
                      </div>

                      {/* Seats badge */}
                      <div className="position-absolute bottom-0 end-0 p-2">
                        {isFull ? (
                          <span className="badge bg-danger shadow-sm px-2 py-1">Full</span>
                        ) : availableSeats < 10 ? (
                          <span className="badge bg-warning text-dark shadow-sm px-2 py-1">
                            Only {availableSeats} left
                          </span>
                        ) : (
                          <span className="badge bg-success shadow-sm px-2 py-1">
                            {availableSeats} seats left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body p-3 p-xl-4 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        {/* Organizer */}
                        <small className="text-muted fw-semibold d-block text-truncate mb-1">
                          <i className="bi bi-building me-1"></i>
                          {event.organizer}
                        </small>

                        {/* Title */}
                        <h5 className="card-title fw-bold text-dark mb-2 line-clamp-2" title={event.title}>
                          {event.title}
                        </h5>

                        {/* Description excerpt */}
                        <p className="card-text text-secondary small line-clamp-2 mb-3">
                          {event.description}
                        </p>

                        {/* Date, Time & Venue */}
                        <div className="bg-light p-2 rounded-3 mb-3 small">
                          <div className="d-flex align-items-center text-dark mb-1">
                            <i className="bi bi-calendar3 text-primary me-2"></i>
                            <span className="fw-medium">
                              {new Date(event.eventDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="d-flex align-items-center text-muted mb-1">
                            <i className="bi bi-clock text-primary me-2"></i>
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          <div className="d-flex align-items-center text-muted text-truncate">
                            <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                            <span className="text-truncate">{event.venue}</span>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between small text-muted mb-1">
                            <span>Capacity</span>
                            <span>{event.registeredCount} / {event.maxCapacity} ({capacityPercentage}%)</span>
                          </div>
                          <div className="progress" style={{ height: '6px' }} role="progressbar" aria-valuenow={capacityPercentage} aria-valuemin={0} aria-valuemax={100}>
                            <div
                              className={`progress-bar ${isFull ? 'bg-danger' : capacityPercentage > 80 ? 'bg-warning' : 'bg-primary'}`}
                              style={{ width: `${capacityPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        className={`btn w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                          event.isCancelled
                            ? 'btn-secondary disabled'
                            : isFull
                            ? 'btn-outline-danger'
                            : isDeadlinePassed
                            ? 'btn-outline-secondary'
                            : 'btn-primary'
                        }`}
                        onClick={() => onSelectEvent(event)}
                        aria-label={`View details for ${event.title}`}
                      >
                        {event.isCancelled ? (
                          <>
                            <i className="bi bi-slash-circle"></i> Event Cancelled
                          </>
                        ) : isFull ? (
                          <>
                            <i className="bi bi-exclamation-triangle"></i> View Details (Full)
                          </>
                        ) : isDeadlinePassed ? (
                          <>
                            <i className="bi bi-clock-history"></i> Deadline Passed
                          </>
                        ) : (
                          <>
                            <i className="bi bi-ticket-perforated"></i> View Details & Register
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

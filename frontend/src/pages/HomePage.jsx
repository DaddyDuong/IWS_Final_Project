import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/hero.png'

const heroSlides = [
  {
    eyebrow: 'Premium laptop retail',
    title: 'Find the laptop that fits your next move.',
    copy:
      'Browse focused devices, compare the specs that matter, and move from discovery to checkout in a clear retail flow.',
    primary: { label: 'Shop the catalog', to: '/products' },
    secondary: { label: 'Create account', to: '/register' },
  },
  {
    eyebrow: 'Study-first choices',
    title: 'Lightweight power for school.',
    copy:
      'Pick dependable laptops for assignments, research, and streaming with battery life and portability in mind.',
    primary: { label: 'Explore student picks', to: '/products?useCase=study' },
    secondary: { label: 'Sign in', to: '/login' },
  },
  {
    eyebrow: 'Performance for work',
    title: 'Stay fast through meetings,.',
    copy:
      'Filter by processor, memory, and storage to find work-ready devices built for productivity and multitasking.',
    primary: { label: 'Browse work laptops', to: '/products?useCase=work' },
    secondary: { label: 'View orders', to: '/orders' },
  },
  {
    eyebrow: 'Creator and gaming',
    title: 'High-refresh visuals.',
    copy:
      'Discover premium displays, stronger graphics, and larger memory options for gaming, editing, and creative workflows.',
    primary: { label: 'See top performance', to: '/products?sortBy=price&sortOrder=desc' },
    secondary: { label: 'Go to cart', to: '/cart' },
  },
]

const useCases = [
  { title: 'Study', copy: 'Portable laptops for classes, notes, and everyday browsing.' },
  { title: 'Work', copy: 'Reliable machines for productivity, meetings, and multitasking.' },
  { title: 'Gaming', copy: 'High-performance devices with strong CPUs, RAM, and storage.' },
  { title: 'Creator', copy: 'Premium screens and fast storage for design, video, and code.' },
]

const showcaseSlides = [
  {
    tag: 'IWS Technology Showcase',
    title: 'Create Your Way',
    copy: 'Unleash your creativity with our stylishly versatile 16-inch AI PCs.',
    linkLabel: 'Learn More',
    linkTo: '/products?useCase=creator',
  },
  {
    tag: 'IWS Technology Showcase',
    title: 'Productivity, Refined',
    copy: 'Build faster workflows with reliable performance and all-day battery life.',
    linkLabel: 'Explore Work Picks',
    linkTo: '/products?useCase=work',
  },
  {
    tag: 'IWS Technology Showcase',
    title: 'Power for Play',
    copy: 'Step into immersive gaming with high-refresh displays and stronger graphics.',
    linkLabel: 'View Gaming Lineup',
    linkTo: '/products?useCase=gaming',
  },
  {
    tag: 'IWS Technology Showcase',
    title: 'Smart for School',
    copy: 'Portable, dependable laptops made for classes, projects, and daily study.',
    linkLabel: 'See Student Deals',
    linkTo: '/products?useCase=study',
  },
]

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showcaseSlide, setShowcaseSlide] = useState(1)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef(null)
  const videoSectionRef = useRef(null)

  useEffect(() => {
    const intervalId = setTimeout(() => {
      setCurrentSlide((previousSlide) => (previousSlide + 1) % heroSlides.length)
    }, 10000)

    return () => clearTimeout(intervalId)
  }, [currentSlide])

  useEffect(() => {
    const intervalId = setTimeout(() => {
      setShowcaseSlide((previousSlide) => (previousSlide + 1) % showcaseSlides.length)
    }, 8000)

    return () => clearTimeout(intervalId)
  }, [showcaseSlide])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {})
          setIsVideoPlaying(true)
          observer.disconnect() // Stop observing after the first auto-play
        }
      },
      { threshold: 0.25 }
    )

    if (videoSectionRef.current) {
      observer.observe(videoSectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const goToPreviousSlide = () => {
    setCurrentSlide((previousSlide) => (previousSlide - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToNextSlide = () => {
    setCurrentSlide((previousSlide) => (previousSlide + 1) % heroSlides.length)
  }

  const activeSlide = heroSlides[currentSlide]
  const showcaseActive = showcaseSlides[showcaseSlide]

  const goToPreviousShowcaseSlide = () => {
    setShowcaseSlide((previousSlide) => (previousSlide - 1 + showcaseSlides.length) % showcaseSlides.length)
  }

  const goToNextShowcaseSlide = () => {
    setShowcaseSlide((previousSlide) => (previousSlide + 1) % showcaseSlides.length)
  }

  const showcaseTrackStyle = {
    transform: `translateX(calc(50% - (var(--showcase-slide-width) / 2) - (${showcaseSlide} * (var(--showcase-slide-width) + var(--showcase-slide-gap)))))`,
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
        setIsVideoPlaying(false)
      } else {
        videoRef.current.play()
        setIsVideoPlaying(true)
      }
    }
  }

  return (
    <div className="storefront-page" aria-labelledby="home-title">
      <section className="store-hero store-section--dark store-hero--full store-hero--carousel">
        <div className="container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div className="hero-slide-content hero-slide-content--left" key={currentSlide}>
            <p className="eyebrow eyebrow--on-dark hero-eyebrow">{activeSlide.eyebrow}</p>
            <h1 id="home-title">{activeSlide.title}</h1>
            <p className="store-hero__copy">
              {activeSlide.copy}
            </p>
            <div className="cta-row">
              <Link className="button button--primary" to={activeSlide.primary.to}>
                {activeSlide.primary.label}
              </Link>
              <Link className="button button--secondary button--on-dark" to={activeSlide.secondary.to}>
                {activeSlide.secondary.label}
              </Link>
            </div>
          </div>

          <div className="hero-slide-controls" aria-label="Hero slide controls">
            <button className="hero-slide-controls__button" onClick={goToPreviousSlide} type="button" aria-label="Previous slide">
              &larr;
            </button>
            <span className="hero-slide-controls__index" aria-live="polite">
              {currentSlide + 1}/{heroSlides.length}
            </span>
            <button className="hero-slide-controls__button" onClick={goToNextSlide} type="button" aria-label="Next slide">
              &rarr;
            </button>
          </div>
        </div>
      </section>

      <section className="store-section store-section--full home-use-cases-section" aria-labelledby="home-use-cases">
        <div className="container">
          <p className="eyebrow">Choose by purpose</p>
          <h2 id="home-use-cases">Built for how you use it.</h2>
          <div className="feature-grid">
            {useCases.map((item) => (
              <article className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <div className="feature-card__media-placeholder" aria-hidden="true" />
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="store-section showcase-section" aria-labelledby="home-showcase-title">
        <div className="container">
          <p className="eyebrow eyebrow--on-dark showcase-eyebrow">{showcaseActive.tag}</p>
          <h2 id="home-showcase-title">Featured Products and Solutions</h2>
        </div>
        <div className="showcase-stage">
          <button className="showcase-nav showcase-nav--left" type="button" onClick={goToPreviousShowcaseSlide} aria-label="Previous featured slide">
            &larr;
          </button>

          <div className="showcase-carousel-viewport" aria-live="polite">
            <div className="showcase-carousel-track" style={showcaseTrackStyle}>
              {showcaseSlides.map((slide, index) => (
                <article className={`showcase-slide ${index === showcaseSlide ? 'is-active' : 'is-inactive'}`} key={slide.title}>
                  <div className="showcase-main-media">
                    <img src={heroImage} alt="Featured laptop" />
                  </div>

                  <div className="showcase-overlay-card">
                    <p className="showcase-overlay-card__eyebrow">IWS KHOA PCs</p>
                    <h3>{slide.title}</h3>
                    <p>{slide.copy}</p>
                    <Link to={slide.linkTo}>{slide.linkLabel} &rarr;</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button className="showcase-nav showcase-nav--right" type="button" onClick={goToNextShowcaseSlide} aria-label="Next featured slide">
            &rarr;
          </button>
        </div>

        <div className="showcase-footer">
          <div className="showcase-dots" aria-label="Featured slide position">
            {showcaseSlides.map((item, index) => (
              <button
                key={item.title}
                className={`showcase-dot ${index === showcaseSlide ? 'is-active' : ''}`}
                type="button"
                onClick={() => setShowcaseSlide(index)}
                aria-label={`Go to featured slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="video-section" ref={videoSectionRef} aria-label="Customer story video section">
        <div className="video-background">
          <video
            ref={videoRef}
            className="video-element"
            loop
            muted
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000000' width='1920' height='1080'/%3E%3C/svg%3E"
          >
            <source src="/backgroundMinecraft.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay"></div>
        </div>

        <div className="video-content">
          <p className="video-subtitle">Wellcome to IWS KHOA Technology</p>
          <h2 className="video-heading">Unlocking the Tree of Life With AI</h2>
          <p className="video-description">
            Discover how Wellcome Sanger is advancing biodiversity research and conservation using Dell AI Factory with NVIDIA to decode 70,000 species' genomes.
          </p>
          <Link to="/products" className="video-cta-button">Products</Link>
          <div className="video-links">
            <Link to="/learn-more" className="video-link">Learn More →</Link>
            <Link to="/stories" className="video-link">View All Stories →</Link>
          </div>
        </div>

        <button
          className="video-control"
          onClick={handleVideoPlayPause}
          type="button"
          aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
        >
          {isVideoPlaying ? 'Pause ||' : 'Play ►'}
        </button>
      </section>

      <section className="support-link-section" aria-label="Support and Help Section">
        <div className="container">
          <div className="support-link-content">
            <div className="support-link-header">
              <span className="support-link-label">IWS Khoa Support</span>
              <h2 className="support-link-title">We're Here to Help</h2>
              <p className="support-link-desc">
                From offering expert advice to solving complex problems,<br/>we've got you covered.
              </p>
            </div>
            <div className="support-link-grid">
              <a href="#" className="support-link-card">
                <div className="support-card-icon">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>
                <span className="support-card-text">Support Home</span>
              </a>
              <Link to="/profile" className="support-link-card">
                <div className="support-card-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path></svg>
                </div>
                <span className="support-card-text">My Account</span>
              </Link>
              <a href="mailto:keinhangia242@gmail.com" className="support-link-card">
                <div className="support-card-icon">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <span className="support-card-text">Order Support</span>
              </a>
              <a href="#" className="support-link-card">
                <div className="support-card-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
                </div>
                <span className="support-card-text">Warranty & Contracts</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
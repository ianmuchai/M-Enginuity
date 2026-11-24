const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const year = document.getElementById('year');
const contactForm = document.querySelector('.contact-form');
const themeToggle = document.querySelector('[data-theme-toggle]');
const installButton = document.querySelector('[data-install-app]');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (themeToggle) {
  const savedTheme = (() => {
    try {
      return localStorage.getItem('m-enginuity-theme');
    } catch (error) {
      console.error('Unable to read the saved color theme:', error);
      return null;
    }
  })();

  const setTheme = (theme) => {
    document.body.dataset.theme = theme;
    const lightMode = theme === 'light';
    themeToggle.setAttribute(
      'aria-label',
      lightMode ? 'Switch to dark mode' : 'Switch to light mode'
    );
    themeToggle.title = lightMode ? 'Switch to dark mode' : 'Switch to light mode';
    themeToggle.querySelector('.theme-icon').textContent = lightMode ? '☾' : '☼';
    document.querySelector('meta[name="theme-color"]').content =
      lightMode ? '#f3f5f6' : '#07121f';
  };

  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  themeToggle.addEventListener('click', () => {
    const theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(theme);
    try {
      localStorage.setItem('m-enginuity-theme', theme);
    } catch (error) {
      console.error('Unable to save the selected color theme:', error);
    }
  });
}

let installPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    installPrompt = null;
    installButton.hidden = true;
  });
}

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  if (installButton) {
    installButton.hidden = true;
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js?v=14').catch((error) => {
      console.error('Unable to register the offline app worker:', error);
    });
  });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
      menuToggle.focus();
    }
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const submitButton = contactForm.querySelector('[type="submit"]');
    const status = contactForm.querySelector('.form-note');
    const payload = Object.fromEntries(formData.entries());
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    status.textContent = 'Sending your inquiry...';

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Unable to send your inquiry.');
        }
        status.textContent = 'Thank you. Your inquiry has been sent to M-Enginuity.';
        contactForm.reset();
      })
      .catch((error) => {
        status.textContent = error.message || 'Unable to send your inquiry. Please contact us directly.';
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Send inquiry';
      });
  });
}

const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const slides = [...carousel.querySelectorAll('.hero-slide')];
  const tabs = [...carousel.querySelectorAll('[data-slide]')];
  const pauseButton = carousel.querySelector('[data-carousel-pause]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let paused = motion.matches;
  let visible = true;
  let timer;
  const sync = () => {
    clearTimeout(timer);
    slides.forEach((slide, index) => {
      const video = slide.querySelector('video');
      if (index === active && !paused && visible && !document.hidden) {
        video.muted = true;
        video.play().catch(() => {});
      } else video.pause();
    });
    pauseButton.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    if (!paused && visible && !document.hidden) timer = setTimeout(() => show(active + 1), 9000);
  };
  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.setAttribute('aria-hidden', String(i !== active));
      tabs[i].setAttribute('aria-pressed', String(i === active));
    });
    const slide = slides[active];
    carousel.querySelector('[data-carousel-title]').textContent = slide.dataset.title;
    carousel.querySelector('[data-carousel-description]').textContent = slide.dataset.description;
    carousel.querySelector('[data-carousel-link]').href = slide.dataset.target;
    sync();
  };
  tabs.forEach((tab, i) => tab.addEventListener('click', () => show(i)));
  pauseButton.addEventListener('click', () => { paused = !paused; sync(); });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { paused = motion.matches; sync(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(carousel);
  show(0);
}

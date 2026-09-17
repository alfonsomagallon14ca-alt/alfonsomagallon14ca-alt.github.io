document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  /* ---------------- Header / mobile menu ---------------- */
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.classList.toggle('active', open);
      menu.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.classList.remove('active');
      menu.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }));
  }

  /* ---------------- Scroll UI ---------------- */
  let lastY = window.scrollY;
  function scrollUI() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    if (header) {
      header.classList.toggle('scrolled', scrollY > 20);
      if (scrollY > lastY && scrollY > 220) header.classList.add('hide-on-scroll');
      else header.classList.remove('hide-on-scroll');
    }
    lastY = scrollY;
  }
  addEventListener('scroll', scrollUI, {passive:true});
  scrollUI();

  /* ---------------- Build one interactive gallery per project ---------------- */
  document.querySelectorAll('.project').forEach((project, projectIndex) => {
    const sources = [...project.querySelectorAll(':scope > .media-wide, :scope > .gallery')];
    if (!sources.length) return;

    const showcase = document.createElement('div');
    showcase.className = 'project-showcase reveal-child';
    showcase.dataset.project = project.querySelector('h3')?.textContent.trim() || `Proyecto ${projectIndex + 1}`;

    const stage = document.createElement('div');
    stage.className = 'showcase-stage';
    stage.tabIndex = 0;
    stage.setAttribute('aria-label', `Galería de ${showcase.dataset.project}`);

    const track = document.createElement('div');
    track.className = 'showcase-track';

    const items = [];
    sources.forEach(source => {
      if (source.classList.contains('gallery')) {
        [...source.children].forEach(child => {
          if (child.matches('figure, .media-card')) items.push(child);
        });
      } else {
        items.push(source);
      }
    });

    items.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'showcase-slide';
      slide.dataset.index = i;

      if (item.matches('figure')) {
        const media = item.querySelector('img, video');
        const caption = item.querySelector('figcaption');
        const note = item.querySelector('p');
        if (media) slide.appendChild(media);
        const captionBox = document.createElement('div');
        captionBox.className = 'slide-caption';
        if (caption) captionBox.appendChild(caption.cloneNode(true));
        else captionBox.innerHTML = '<strong>Proyecto</strong>';
        if (note) captionBox.appendChild(note.cloneNode(true));
        slide.appendChild(captionBox);
      } else {
        const media = item.querySelector('video, img');
        const label = item.querySelector('span');
        if (media) slide.appendChild(media);
        const captionBox = document.createElement('div');
        captionBox.className = 'slide-caption';
        captionBox.innerHTML = `<strong>${label?.textContent || 'Video'}</strong><span>Movimiento</span>`;
        slide.appendChild(captionBox);
      }
      track.appendChild(slide);
    });

    stage.appendChild(track);
    const prev = makeButton('showcase-btn prev', '←', 'Anterior');
    const next = makeButton('showcase-btn next', '→', 'Siguiente');
    stage.append(prev, next);

    const zoom = makeButton('showcase-zoom', '↗', 'Ampliar imagen');
    stage.appendChild(zoom);

    const footer = document.createElement('div');
    footer.className = 'showcase-footer';
    const count = document.createElement('span');
    count.className = 'showcase-count';
    const bar = document.createElement('span');
    bar.className = 'showcase-bar';
    const fill = document.createElement('i');
    bar.appendChild(fill);
    const label = document.createElement('span');
    label.className = 'showcase-label';
    label.textContent = showcase.dataset.project;
    footer.append(count, bar, label);

    const thumbs = document.createElement('div');
    thumbs.className = 'showcase-thumbs';

    const slides = [...track.children];
    slides.forEach((slide, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'showcase-thumb';
      thumb.setAttribute('aria-label', `Ver pieza ${i + 1}`);
      const img = slide.querySelector('img');
      if (img) {
        const ti = document.createElement('img');
        ti.src = img.currentSrc || img.src;
        ti.alt = '';
        thumb.appendChild(ti);
      } else {
        thumb.textContent = '▶';
        thumb.classList.add('video-thumb');
      }
      thumb.addEventListener('click', () => go(i));
      thumbs.appendChild(thumb);
    });

    showcase.append(stage, footer, thumbs);
    sources.forEach(s => s.remove());
    project.appendChild(showcase);

    let index = 0;
    let startX = 0, startY = 0, dragging = false, moved = false;

    function update(animate = true) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translate3d(-${index * 100}%,0,0)`;
      count.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      fill.style.width = `${((index + 1) / slides.length) * 100}%`;
      thumbs.querySelectorAll('.showcase-thumb').forEach((t, n) => t.classList.toggle('active', n === index));
      thumbs.children[index]?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'nearest', inline:'center'});
      slides.forEach((slide, n) => {
        const video = slide.querySelector('video');
        if (!video) return;
        if (n === index) video.play().catch(()=>{});
        else video.pause();
      });
      zoom.style.display = slides[index].querySelector('img') ? 'grid' : 'none';
    }

    function go(n) {
      index = (n + slides.length) % slides.length;
      update(true);
    }

    prev.addEventListener('click', e => { e.stopPropagation(); go(index - 1); });
    next.addEventListener('click', e => { e.stopPropagation(); go(index + 1); });
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    });

    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.target.closest('video')) return;
      dragging = true; moved = false; startX = e.clientX; startY = e.clientY;
      stage.classList.add('dragging');
      try { stage.setPointerCapture(e.pointerId); } catch {}
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 8) moved = true;
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    });
    const release = e => {
      if (!dragging) return;
      dragging = false; stage.classList.remove('dragging');
      const dx = e.clientX - startX;
      if (moved && Math.abs(dx) > 45) go(dx < 0 ? index + 1 : index - 1);
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (!img) return;
      img.addEventListener('click', () => {
        if (!moved) openLightbox(slides, index);
      });
      img.style.cursor = 'zoom-in';
    });

    zoom.addEventListener('click', () => openLightbox(slides, index));
    update(false);
  });

  function makeButton(cls, text, label) {
    const b = document.createElement('button');
    b.className = cls; b.type = 'button'; b.textContent = text; b.setAttribute('aria-label', label);
    return b;
  }

  /* ---------------- Lightbox ---------------- */
  const box = document.createElement('div');
  box.className = 'dynamic-lightbox';
  box.innerHTML = `
    <button class="lb-close" aria-label="Cerrar">×</button>
    <button class="lb-prev" aria-label="Anterior">←</button>
    <figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>
    <button class="lb-next" aria-label="Siguiente">→</button>`;
  document.body.appendChild(box);
  const lbImg = box.querySelector('img'), lbCap = box.querySelector('figcaption');
  let lbSlides = [], lbIndex = 0;

  function openLightbox(slides, start) {
    lbSlides = slides.filter(s => s.querySelector('img'));
    const currentSrc = slides[start]?.querySelector('img')?.currentSrc;
    const found = lbSlides.findIndex(s => s.querySelector('img').currentSrc === currentSrc);
    lbIndex = found >= 0 ? found : 0;
    renderLB();
    box.classList.add('open');
    document.body.classList.add('menu-open');
    box.querySelector('.lb-close').focus();
  }
  function renderLB() {
    const slide = lbSlides[lbIndex];
    const img = slide.querySelector('img');
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
    lbCap.textContent = slide.querySelector('.slide-caption')?.innerText.replace(/\n/g,' · ') || '';
    const multi = lbSlides.length > 1;
    box.querySelector('.lb-prev').style.visibility = multi ? 'visible' : 'hidden';
    box.querySelector('.lb-next').style.visibility = multi ? 'visible' : 'hidden';
  }
  function closeLB() {
    box.classList.remove('open'); document.body.classList.remove('menu-open'); lbImg.src = '';
  }
  box.querySelector('.lb-close').addEventListener('click', closeLB);
  box.querySelector('.lb-prev').addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbSlides.length) % lbSlides.length; renderLB(); });
  box.querySelector('.lb-next').addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbSlides.length; renderLB(); });
  box.addEventListener('click', e => { if (e.target === box) closeLB(); });

  /* ---------------- Reveal ---------------- */
  const targets = document.querySelectorAll('.section-heading, .project, .skill, .contact-list a, .hero-intro, .project-showcase');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, {threshold:.07, rootMargin:'0px 0px -5% 0px'});
    targets.forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  } else targets.forEach(el => el.classList.add('visible'));

  /* ---------------- Active section in nav ---------------- */
  const links = [...document.querySelectorAll('.site-nav a')];
  const sections = [...document.querySelectorAll('#identidad,#ilustracion,#animacion,#packaging,#contacto')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    }), {rootMargin:'-40% 0px -50% 0px'});
    sections.forEach(s => io.observe(s));
  }

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft' && lbSlides.length) { lbIndex = (lbIndex - 1 + lbSlides.length) % lbSlides.length; renderLB(); }
    if (e.key === 'ArrowRight' && lbSlides.length) { lbIndex = (lbIndex + 1) % lbSlides.length; renderLB(); }
  });
});

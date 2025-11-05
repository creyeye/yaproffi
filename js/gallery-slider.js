// js/gallery-slider.js
// Лёгкий слайдер + lightbox (без fullscreen)
// Поддержка WebP через <picture> + <source> (jpg остаётся fallback'ом)

(function () {
  'use strict';

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  document.addEventListener('DOMContentLoaded', function () {
    var slider = qs('.tm-single-slider');
    if (!slider) return;

    var total = parseInt(slider.dataset.slides, 10) || 0;
    var track = qs('.slider-track', slider);
    var dotsWrap = qs('.slider-dots', slider);
    var prevBtn = qs('.slider-prev', slider);
    var nextBtn = qs('.slider-next', slider);
    var current = 0;
    var isAnimating = false;
    var startX = 0, deltaX = 0;

    // Lightbox elements
    var lightbox = qs('#galleryLightbox');
    var lbImg = lightbox ? qs('.lightbox-img', lightbox) : null;
    var lbClose = lightbox ? qs('.lightbox-close', lightbox) : null;
    var lbPrev = lightbox ? qs('.lightbox-prev', lightbox) : null;
    var lbNext = lightbox ? qs('.lightbox-next', lightbox) : null;

    // Создание слайдов автоматически, если внутри track пусто
    if (track && track.children.length === 0 && total > 0) {
      for (var i = 1; i <= total; i++) {
        var num = String(i).padStart(2, '0');
        var slide = document.createElement('div');
        slide.className = 'slide';

        // Создаем <picture> с <source type="image/webp"> и <img src="...jpg">
        var picture = document.createElement('picture');

        var sourceWebp = document.createElement('source');
        sourceWebp.type = 'image/webp';
        sourceWebp.srcset = 'img/gallery/slide-' + num + '.webp';

        var img = document.createElement('img');
        img.src = 'img/gallery/slide-' + num + '.jpg';
        img.alt = 'Slide ' + i;
        img.loading = 'lazy';
        img.tabIndex = 0;

        // слушатели на сам <img>
        (function (idx, imgEl) {
          imgEl.addEventListener('click', function () { openLightbox(idx, imgEl); });
          imgEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') openLightbox(idx, imgEl);
          });
        })(i - 1, img);

        picture.appendChild(sourceWebp);
        picture.appendChild(img);
        slide.appendChild(picture);
        track.appendChild(slide);
      }
    }

    // Построить точки (dots)
    function buildDots() {
      dotsWrap.innerHTML = '';
      var slidesCount = track.children.length;
      for (var i = 0; i < slidesCount; i++) {
        var b = document.createElement('button');
        (function (idx) {
          b.addEventListener('click', function () { goTo(idx); });
        })(i);
        dotsWrap.appendChild(b);
      }
      refreshDots();
    }

    function refreshDots() {
      var buttons = dotsWrap.querySelectorAll('button');
      buttons.forEach(function (b, idx) {
        b.classList.toggle('active', idx === current);
        b.setAttribute('aria-label', 'Перейти к изображению ' + (idx + 1));
      });
    }

    function updateTransform() {
      var w = slider.querySelector('.slider-viewport').clientWidth;
      track.style.transform = 'translateX(' + (-current * w) + 'px)';
    }

    function goTo(index) {
      if (isAnimating) return;
      var slidesCount = track.children.length;
      if (slidesCount === 0) return;
      if (index < 0) index = slidesCount - 1;
      if (index >= slidesCount) index = 0;
      current = index;
      isAnimating = true;
      updateTransform();
      setTimeout(function () { isAnimating = false; refreshDots(); }, 520);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Keyboard arrows
    document.addEventListener('keydown', function (e) {
      if (lightbox && lightbox.classList.contains('open')) {
        if (e.key === 'ArrowLeft') lbPrev && lbPrev.click();
        else if (e.key === 'ArrowRight') lbNext && lbNext.click();
        else if (e.key === 'Escape') closeLightbox();
      } else {
        if (e.key === 'ArrowLeft') prev();
        else if (e.key === 'ArrowRight') next();
      }
    });

    // Ресайз — пересчитать трансформацию
    window.addEventListener('resize', function () {
      updateTransform();
    });

    // Простая поддержка свайпа для слайдера
    if (track) {
      track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        deltaX = 0;
      }, {passive: true});
      track.addEventListener('touchmove', function (e) {
        deltaX = e.touches[0].clientX - startX;
      }, {passive: true});
      track.addEventListener('touchend', function () {
        var threshold = 50; // px
        if (deltaX > threshold) {
          prev();
        } else if (deltaX < -threshold) {
          next();
        }
        startX = 0; deltaX = 0;
      });
    }

    // ===== Lightbox functions (без fullscreen) =====
    // теперь openLightbox принимает optional clickedImg, чтобы показать фактически загруженный currentSrc
    function openLightbox(index, clickedImg) {
      var slidesCount = track.children.length;
      if (index < 0) index = 0;
      if (index >= slidesCount) index = slidesCount - 1;
      if (!lightbox) return;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');

      // получаем фактический src (учтёт webp source благодаря currentSrc)
      var displaySrc = null;
      if (clickedImg && clickedImg.currentSrc) displaySrc = clickedImg.currentSrc;

      if (displaySrc) {
        lbImg.src = displaySrc;
      } else {
        var imgEl = track.children[index].querySelector('img');
        if (imgEl && imgEl.currentSrc) {
          lbImg.src = imgEl.currentSrc;
        } else if (imgEl && imgEl.src) {
          lbImg.src = imgEl.src;
        } else {
          var n = String(index + 1).padStart(2, '0');
          lbImg.src = 'img/gallery/slide-' + n + '.jpg';
        }
      }

      var altText = (clickedImg && clickedImg.alt) ? clickedImg.alt : (track.children[index].querySelector('img') ? (track.children[index].querySelector('img').alt || ('Slide ' + (index + 1))) : ('Slide ' + (index + 1)));
      lbImg.alt = altText;
      current = index;
      lbClose && lbClose.focus();
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    function lbNextFn() {
      var slidesCount = track.children.length;
      current = (current + 1) % slidesCount;
      updateLightboxImage();
    }
    function lbPrevFn() {
      var slidesCount = track.children.length;
      current = (current - 1 + slidesCount) % slidesCount;
      updateLightboxImage();
    }
    function updateLightboxImage() {
      var imgEl = track.children[current].querySelector('img');
      if (imgEl && imgEl.currentSrc) {
        lbImg.src = imgEl.currentSrc;
        lbImg.alt = imgEl.alt || ('Slide ' + (current + 1));
      } else if (imgEl && imgEl.src) {
        lbImg.src = imgEl.src;
        lbImg.alt = imgEl.alt || ('Slide ' + (current + 1));
      } else {
        var n = String(current + 1).padStart(2, '0');
        lbImg.src = 'img/gallery/slide-' + n + '.jpg';
        lbImg.alt = 'Slide ' + (current + 1);
      }
    }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbNextFn(); });
    if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbPrevFn(); });

    // Click on backdrop closes lightbox
    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target === qs('.lightbox-content', lightbox) ) {
          closeLightbox();
        }
      });
    }

    // touch: swipe in lightbox
    var lbStartX = 0, lbDeltaX = 0;
    if (lbImg) {
      lbImg.addEventListener('touchstart', function (e) {
        lbStartX = e.touches[0].clientX;
      }, {passive: true});
      lbImg.addEventListener('touchmove', function (e) {
        lbDeltaX = e.touches[0].clientX - lbStartX;
      }, {passive: true});
      lbImg.addEventListener('touchend', function () {
        var threshold = 40;
        if (lbDeltaX > threshold) lbPrevFn();
        else if (lbDeltaX < -threshold) lbNextFn();
        lbStartX = 0; lbDeltaX = 0;
      });
    }

    // Ждём загрузки изображений (чтобы корректно посчитать ширину и построить точки)
    var imgs = track.querySelectorAll('img');
    var loaded = 0;
    if (imgs.length === 0) {
      buildDots();
      updateTransform();
    } else {
      imgs.forEach(function (img) {
        if (img.complete) {
          loaded++;
        } else {
          img.addEventListener('load', function () {
            loaded++;
            if (loaded === imgs.length) {
              buildDots();
              updateTransform();
            }
          });
          img.addEventListener('error', function () {
            loaded++;
            if (loaded === imgs.length) {
              buildDots();
              updateTransform();
            }
          });
        }
      });
      if (loaded === imgs.length) {
        buildDots();
        updateTransform();
      }
    }

  });
})();

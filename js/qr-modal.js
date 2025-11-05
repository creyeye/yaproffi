// js/qr-modal.js
// Небольшая модалка с простым слайдером, поддержка WebP (picture) и JPG fallback.
// Положите рядом с остальными скриптами и подключите перед </body>.

(function () {
  'use strict';

  var qrCount = 5; // <- измените на количество ваших QR-изображений
  var qrPath = 'img/qr/'; // папка, где лежат qr-01.webp, qr-02.webp и т.д.
  var qrNamePrefix = 'qr-'; // qr-01.webp

  // локаторы
  var modal = document.getElementById('qrModal');
  var openBtn = document.querySelector('.qr-open');
  var closeBtn = modal ? modal.querySelector('.qr-close') : null;
  var track = modal ? modal.querySelector('.qr-slider-track') : null;
  var viewport = modal ? modal.querySelector('.qr-slider-viewport') : null;
  var prevBtn = modal ? modal.querySelector('.qr-prev') : null;
  var nextBtn = modal ? modal.querySelector('.qr-next') : null;
  var dotsWrap = modal ? modal.querySelector('.qr-dots') : null;

  var current = 0;
  var isOpen = false;
  var startX = 0, deltaX = 0;

  if (!modal || !openBtn) return;

  // Построить слайды
  function buildSlides() {
    track.innerHTML = '';
    dotsWrap.innerHTML = '';
    for (var i = 1; i <= qrCount; i++) {
      var num = String(i).padStart(2, '0');

      var slide = document.createElement('div');
      slide.className = 'qr-slide';

      var picture = document.createElement('picture');

      // webp source
      var srcWebp = document.createElement('source');
      srcWebp.type = 'image/webp';
      srcWebp.srcset = qrPath + qrNamePrefix + num + '.webp';

      // jpg fallback (если хотите)
      var img = document.createElement('img');
      img.src = qrPath + qrNamePrefix + num + '.webp'; // можно заменить на .jpg если хотите fallback
      img.alt = 'QR ' + i;
      img.loading = 'lazy';

      picture.appendChild(srcWebp);
      picture.appendChild(img);
      slide.appendChild(picture);
      track.appendChild(slide);

      // точка
      var dot = document.createElement('button');
      (function (idx) {
        dot.addEventListener('click', function () { goTo(idx); });
      })(i - 1);
      dotsWrap.appendChild(dot);
    }
    refreshDots();
    updateTransform();
  }

  function openModal() {
    if (isOpen) return;
    buildSlides();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    isOpen = true;
    current = 0;
    // focus
    if (closeBtn) closeBtn.focus();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!isOpen) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    isOpen = false;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function updateTransform() {
    var w = viewport.clientWidth;
    track.style.transform = 'translateX(' + (-current * w) + 'px)';
    refreshDots();
  }

  function goTo(idx) {
    var slidesCount = qrCount;
    if (idx < 0) idx = slidesCount - 1;
    if (idx >= slidesCount) idx = 0;
    current = idx;
    updateTransform();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function refreshDots() {
    var buttons = dotsWrap.querySelectorAll('button');
    buttons.forEach(function (b, idx) {
      b.classList.toggle('active', idx === current);
    });
  }

  // Обработчики
  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    closeModal();
  });

  if (prevBtn) prevBtn.addEventListener('click', function (e) { e.preventDefault(); prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function (e) { e.preventDefault(); next(); });

  // клавиши
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // клик по бэкдропу
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.getAttribute('data-close') !== null) {
      closeModal();
    }
  });

  // свайп
  track.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    deltaX = 0;
  }, {passive: true});
  track.addEventListener('touchmove', function (e) {
    deltaX = e.touches[0].clientX - startX;
  }, {passive: true});
  track.addEventListener('touchend', function () {
    var threshold = 50;
    if (deltaX > threshold) prev();
    else if (deltaX < -threshold) next();
    startX = 0; deltaX = 0;
  });

  // ресайз
  window.addEventListener('resize', function () {
    if (isOpen) updateTransform();
  });

})();

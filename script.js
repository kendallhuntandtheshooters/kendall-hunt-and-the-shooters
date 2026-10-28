// Booking form -> delivered to the band's booking inbox via FormSubmit
// (serverless form backend for static sites). Only the contact field is
// required: a venue can reach out with nothing but a way to reply.
// If the send fails, the visitor gets the direct email + phone instead
// of a dead end.
(function () {
  var form = document.getElementById('booking-form');
  if (!form) return;

  var ENDPOINT = 'https://formsubmit.co/ajax/booking@kendallhuntandtheshooters.com';
  var err = document.getElementById('form-error');
  var okMsg = document.getElementById('form-success');
  var btn = document.getElementById('bf-submit');

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {
      name: val('bf-name'),
      contact: val('bf-contact'),
      date: val('bf-date'),
      venue: val('bf-venue'),
      type: val('bf-type'),
      details: val('bf-details')
    };
    if (!d.contact) {
      err.textContent = 'We just need one way to reach you — drop an email or phone number in the contact box and hit send again.';
      err.hidden = false;
      okMsg.hidden = true;
      document.getElementById('bf-contact').focus();
      return;
    }
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: d.name || '(not given)',
        contact: d.contact,
        date: d.date || '(flexible / not set yet)',
        venue: d.venue || '(not given)',
        type: d.type,
        details: d.details || '(none provided)',
        _subject: 'Booking inquiry from the website' + (d.name ? ' — ' + d.name : '') + (d.date ? ' — ' + d.date : ''),
        _template: 'table',
        _captcha: 'false',
        _honey: ''
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('send failed');
      return r.json();
    }).then(function () {
      okMsg.hidden = false;
      btn.textContent = 'Sent ✓';
      form.reset();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Send Booking Inquiry';
      err.textContent = "That didn't go through — please email booking@kendallhuntandtheshooters.com or call/text 806-440-3621 and we'll take it from there.";
      err.hidden = false;
    });
  });
})();

// Photo lightbox: click any gallery photo, then step through the set
// with the arrows, keyboard, or a swipe.
(function () {
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gallery img, .carousel-track img'));
  var box = document.getElementById('lightbox');
  if (!shots.length || !box) return;
  var img = document.getElementById('lb-img');
  var count = document.getElementById('lb-count');
  var i = 0, startX = null;

  function show(n) {
    i = (n + shots.length) % shots.length;
    img.src = shots[i].src;
    img.alt = shots[i].alt || '';
    count.textContent = (i + 1) + ' / ' + shots.length;
  }
  function open(n) { show(n); box.hidden = false; document.body.style.overflow = 'hidden'; }
  function close() { box.hidden = true; document.body.style.overflow = ''; img.src = ''; }

  shots.forEach(function (s, n) {
    if (s.closest('.gallery')) s.addEventListener('click', function () { open(n); });
  });
  document.addEventListener('kh-open-lightbox', function (e) { open(e.detail); });
  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', function () { show(i - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { show(i + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  box.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
    startX = null;
  }, { passive: true });
})();

// Coverflow carousel: photos fan out in 3D around the center shot.
// Drag (with the native image-drag disabled so it grabs properly),
// arrows, wheel, keys, or tap a side photo to bring it to the middle.
// Tapping the middle photo opens the lightbox.
(function () {
  var stage = document.getElementById('carousel');
  var track = document.getElementById('carousel-track');
  if (!stage || !track) return;
  var items = Array.prototype.slice.call(track.querySelectorAll('img'));
  var count = document.getElementById('car-count');
  var active = 0, dragPx = 0, anim = true;

  items.forEach(function (im) { im.draggable = false; });
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });

  function layout() {
    var w = items[0].getBoundingClientRect().width || 470;
    var stepX = w * 0.60;
    items.forEach(function (im, n) {
      var off = n - active;
      var a = Math.abs(off);
      var x = off * stepX + dragPx;
      var rot = Math.max(-52, Math.min(52, off * -34));
      var sc = Math.max(0.45, 1 - a * 0.17);
      var tz = 60 - a * 95; // real depth: center closest to viewer, neighbours recede
      im.style.transform = 'translate(-50%, -50%) translateX(' + x + 'px) translateZ(' + tz + 'px) rotateY(' + rot + 'deg) scale(' + sc + ')';
      im.style.zIndex = String(100 - a);
      im.style.opacity = a > 3 ? '0' : '1';
      im.style.pointerEvents = a > 3 ? 'none' : 'auto';
      im.style.filter = 'brightness(' + Math.max(0.35, 1 - a * 0.22) + ')';
      im.style.transition = anim ? 'transform .55s cubic-bezier(.22,.9,.28,1), filter .55s ease, opacity .55s ease' : 'none';
      im.classList.toggle('is-active', off === 0);
    });
    if (count) count.textContent = 'Photo ' + (active + 1) + ' of ' + items.length;
  }
  function go(n) {
    active = Math.max(0, Math.min(items.length - 1, n));
    dragPx = 0; anim = true; layout();
  }

  document.getElementById('car-prev').addEventListener('click', function () { go(active - 1); });
  document.getElementById('car-next').addEventListener('click', function () { go(active + 1); });


  // Drag: pointer capture on the stage, native image drag is off.
  var down = false, startX = 0, suppressClick = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.car-nav')) return;
    down = true; suppressClick = false; startX = e.clientX; anim = false;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!down) return;
    dragPx = e.clientX - startX;
    if (Math.abs(dragPx) > 6) suppressClick = true;
    layout();
  });
  function endDrag() {
    if (!down) return;
    down = false;
    var w = items[0].getBoundingClientRect().width || 470;
    var steps = Math.round(-dragPx / (w * 0.60));
    go(active + Math.max(-3, Math.min(3, steps)));
    setTimeout(function () { suppressClick = false; }, 50);
  }
  stage.addEventListener('pointerup', function (e) {
    var wasTap = down && !suppressClick;
    endDrag();
    if (!wasTap) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var n = items.indexOf(el);
    if (n < 0) return;
    if (n === active) document.dispatchEvent(new CustomEvent('kh-open-lightbox', { detail: n }));
    else go(n);
  });
  stage.addEventListener('pointercancel', endDrag);

  var wheelLock = 0;
  stage.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    var now = Date.now();
    if (now - wheelLock < 220) return;
    wheelLock = now;
    go(active + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') go(active - 1);
    if (e.key === 'ArrowRight') go(active + 1);
  });

  window.addEventListener('resize', layout);
  layout();
})();

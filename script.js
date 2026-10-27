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
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gallery img, .filmstrip img'));
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

  shots.forEach(function (s, n) { s.addEventListener('click', function () { open(n); }); });
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

// Filmstrip: arrow buttons + drag to scroll sideways. A real drag
// suppresses the click so it does not also open the lightbox.
(function () {
  var strip = document.getElementById('filmstrip');
  if (!strip) return;
  var prev = document.getElementById('fs-prev');
  var next = document.getElementById('fs-next');
  function step(dir) { strip.scrollBy({ left: dir * strip.clientWidth * 0.85, behavior: 'smooth' }); }
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });
  var down = false, startX = 0, startScroll = 0, moved = false;
  strip.addEventListener('pointerdown', function (e) {
    down = true; moved = false; startX = e.clientX; startScroll = strip.scrollLeft;
    strip.classList.add('dragging');
  });
  strip.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    strip.scrollLeft = startScroll - dx;
  });
  function endDrag() { down = false; strip.classList.remove('dragging'); }
  strip.addEventListener('pointerup', endDrag);
  strip.addEventListener('pointercancel', endDrag);
  strip.addEventListener('click', function (e) {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
})();

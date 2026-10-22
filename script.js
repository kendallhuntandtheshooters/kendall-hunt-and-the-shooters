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

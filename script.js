// Booking form -> pre-addressed email to the band's booking inbox.
// Static-site safe: no server, no third party. Submissions go only to
// booking@kendallhuntandtheshooters.com via the visitor's own email app.
(function () {
  var form = document.getElementById('booking-form');
  if (!form) return;

  var RECIPIENT = form.getAttribute('data-recipient') || 'booking@kendallhuntandtheshooters.com';
  var err = document.getElementById('form-error');

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Exposed for verification: builds the exact mailto URL from form data.
  function composeBookingEmail(d) {
    var subject = 'Booking inquiry — ' + d.name + (d.date ? ' — ' + d.date : '');
    var lines = [
      'Name: ' + d.name,
      'Contact: ' + d.contact,
      'Event date: ' + d.date,
      'Venue / city: ' + d.venue,
      'Event type: ' + d.type,
      '',
      'Details:',
      d.details || '(none provided)'
    ];
    return 'mailto:' + RECIPIENT +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }
  window.composeBookingEmail = composeBookingEmail;

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
    var ok = d.name && d.contact && d.date && d.venue;
    err.hidden = !!ok;
    if (!ok) return;
    window.location.href = composeBookingEmail(d);
  });
})();

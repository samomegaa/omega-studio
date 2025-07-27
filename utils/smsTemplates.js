const bookingConfirmationSMS = (booking, client) => {
  const serviceNames = {
    'recording': 'Recording Studio',
    'photography': 'Photo Studio',
    'outside-recording': 'Outside Recording'
  };

  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('en-NG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `Dear ${client.name.split(' ')[0]}, your booking for ${serviceNames[booking.service_type]} on ${dateStr} at ${timeStr} has been received. We'll confirm shortly. Omega Studio`;
};

const bookingApprovedSMS = (booking, client) => {
  const date = new Date(booking.start_time);
  const dateStr = date.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short' 
  });
  const timeStr = date.toLocaleTimeString('en-NG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `Good news! Your booking for ${dateStr} at ${timeStr} is CONFIRMED. Please arrive 10 mins early. Call 09061267300 if you need to reschedule. Omega Studio`;
};

const bookingReminderSMS = (booking, client) => {
  const date = new Date(booking.start_time);
  const timeStr = date.toLocaleTimeString('en-NG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `Reminder: You have a booking today at ${timeStr} at Omega Studio, 7, 42nd Avenue, Shagari Villa, Akure. See you soon!`;
};

const adminNotificationSMS = (booking, client) => {
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short' 
  });

  return `New booking: ${client.name} - ${booking.event_type} on ${dateStr}. Check admin panel for details. Omega Studio`;
};

module.exports = {
  bookingConfirmationSMS,
  bookingApprovedSMS,
  bookingReminderSMS,
  adminNotificationSMS
};

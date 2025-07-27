const bookingConfirmationClient = (booking, client) => {
  const serviceNames = {
    'recording': 'Recording Studio',
    'photography': 'Photo Studio',
    'outside-recording': 'Outside Recording'
  };

  return {
    subject: 'Booking Request Received - Omega Recording Studio',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 Omega Recording Studio</h1>
            <p>Booking Request Confirmation</p>
          </div>
          <div class="content">
            <h2>Dear ${client.name},</h2>
            <p>Thank you for your booking request! We have received your request and will contact you shortly to confirm availability and finalize the details.</p>
            
            <div class="details">
              <h3>Booking Details:</h3>
              <p><strong>Service:</strong> ${serviceNames[booking.service_type] || booking.service_type}</p>
              <p><strong>Service Type:</strong> ${booking.event_type}</p>
              <p><strong>Date & Time:</strong> ${new Date(booking.date).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${booking.duration} hour(s)</p>
              ${booking.location ? `<p><strong>Location:</strong> ${booking.location}</p>` : ''}
              ${booking.notes ? `<p><strong>Additional Notes:</strong> ${booking.notes}</p>` : ''}
            </div>
            
            <p>Our team will review your request and contact you within 24 hours to confirm availability and discuss any additional requirements.</p>
            
            <div class="details">
              <h3>Contact Information:</h3>
              <p>📞 +234 906 126 7300</p>
              <p>📱 +234 903 143 6895</p>
              <p>✉️ studio@omegastudioakure.com</p>
              <p>📍 7, 42nd Avenue, Shagari Villa, Akure, Ondo State</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Omega Recording Studio. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

const bookingNotificationAdmin = (booking, client) => {
  const serviceNames = {
    'recording': 'Recording Studio',
    'photography': 'Photo Studio',
    'outside-recording': 'Outside Recording'
  };

  return {
    subject: `New Booking Request - ${serviceNames[booking.service_type]}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .action { background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Request</h1>
            <p>${serviceNames[booking.service_type]}</p>
          </div>
          <div class="content">
            <h2>Client Information:</h2>
            <div class="details">
              <p><strong>Name:</strong> ${client.name}</p>
              <p><strong>Email:</strong> ${client.email}</p>
              <p><strong>Phone:</strong> ${client.phone}</p>
            </div>
            
            <h2>Booking Details:</h2>
            <div class="details">
              <p><strong>Service:</strong> ${serviceNames[booking.service_type]}</p>
              <p><strong>Service Type:</strong> ${booking.event_type}</p>
              <p><strong>Date & Time:</strong> ${new Date(booking.date).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${booking.duration} hour(s)</p>
              ${booking.location ? `<p><strong>Location:</strong> ${booking.location}</p>` : ''}
              ${booking.notes ? `<p><strong>Additional Notes:</strong> ${booking.notes}</p>` : ''}
              <p><strong>Booking ID:</strong> #${booking.id}</p>
              <p><strong>Status:</strong> Pending Approval</p>
            </div>
            
            <p><a href="https://omegastudioakure.com/bookings" class="action">View in Admin Panel</a></p>
            
            <p><strong>Action Required:</strong> Please review this booking request and confirm availability with the client.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

module.exports = {
  bookingConfirmationClient,
  bookingNotificationAdmin
};

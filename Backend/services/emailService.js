const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

const sendStatusEmail = async (email, firstName, action, remarks = '', dateOfBirth = '') => {
  const messageTemplates = {
    Accept: `Dear ${firstName},

We are pleased to inform you that your Solo Parent ID application has been approved by the Department of Social Welfare and Development (DSWD).

You may now visit your respective Barangay Office to claim your Solo Parent ID. Please bring a valid government ID for verification purposes.

Your login credentials:
Email/Username: ${email}
Password: ${dateOfBirth}

For any inquiries, please contact your Barangay Office or DSWD Office.

Best regards,
Department of Social Welfare and Development
Solo Parent Support Division`,

    Decline: `Dear ${firstName},

We regret to inform you that after careful review, your Solo Parent ID application has been declined by the Department of Social Welfare and Development (DSWD).

Reason for Decline:
${remarks}

If you wish to appeal this decision or submit a new application, please visit your Barangay Office for guidance on the necessary steps and requirements.

For any clarifications, please contact your Barangay Office or DSWD Office.

Best regards,
Department of Social Welfare and Development
Solo Parent Support Division`
  };

  const mailOptions = {
    from: 'baisasangelo8@gmail.com',
    to: email,
    subject: action === "Accept" ? "Solo Parent Application Approved!" : "Update on Your Solo Parent Application",
    text: messageTemplates[action]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Verify email configuration on startup
transporter.verify()
  .then(() => console.log('Email service is ready'))
  .catch(err => console.error('Email service error:', err));

module.exports = {
  sendStatusEmail
};
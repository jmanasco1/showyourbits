import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const onNewFeedback = functions.firestore
  .document('feedback/{feedbackId}')
  .onCreate(async (snap, context) => {
    const feedback = snap.data();
    const feedbackId = context.params.feedbackId;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: 'showyourbits@protonmail.com',
      subject: 'New Feedback Received - Show Your Bits',
      text: `
New feedback received from ${feedback.userEmail}

Message:
${feedback.message}

Feedback ID: ${feedbackId}
Timestamp: ${feedback.createdAt.toDate().toLocaleString()}
User ID: ${feedback.userId}

View in Admin Portal: ${process.env.ADMIN_URL || 'https://showyourbits.com/admin'}
`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Feedback notification email sent successfully');
      
      // Update the feedback document to mark email as sent
      await admin.firestore()
        .collection('feedback')
        .doc(feedbackId)
        .update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error sending feedback notification email:', error);
    }
  });

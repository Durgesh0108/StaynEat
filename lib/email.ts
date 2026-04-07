import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.FROM_EMAIL ?? "HospitPro <noreply@hospitpro.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    console.error("Email send error:", error);
    // Don't throw — email failure shouldn't break the main flow
  }
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  guestName: string;
  bookingId: string;
  hotelName: string;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  finalAmount: number;
  confirmationUrl: string;
}): Promise<void> {
  const checkInStr = params.checkIn.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const checkOutStr = params.checkOut.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await sendEmail({
    to: params.to,
    subject: `Booking Confirmed - ${params.hotelName} | #${params.bookingId.slice(-8).toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Outfit', Arial, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #6C3EF4, #8B5CF6); padding: 32px; text-align: center; color: white; }
            .body { padding: 32px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
            .btn { display: inline-block; background: #6C3EF4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
            .footer { padding: 24px; text-align: center; color: #9ca3af; font-size: 14px; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:24px;">Booking Confirmed!</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Your stay at ${params.hotelName} is confirmed</p>
            </div>
            <div class="body">
              <p>Dear ${params.guestName},</p>
              <p>Your booking has been confirmed. Here are your booking details:</p>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
                <div class="detail-row"><span style="color:#6b7280;">Booking ID</span><strong>#${params.bookingId.slice(-8).toUpperCase()}</strong></div>
                <div class="detail-row"><span style="color:#6b7280;">Room</span><strong>${params.roomName}</strong></div>
                <div class="detail-row"><span style="color:#6b7280;">Check-in</span><strong>${checkInStr}</strong></div>
                <div class="detail-row"><span style="color:#6b7280;">Check-out</span><strong>${checkOutStr}</strong></div>
                <div class="detail-row"><span style="color:#6b7280;">Duration</span><strong>${params.nights} Night${params.nights > 1 ? "s" : ""}</strong></div>
                <div class="detail-row" style="border:none;"><span style="color:#6b7280;">Total Amount</span><strong style="color:#6C3EF4;">₹${params.finalAmount.toLocaleString("en-IN")}</strong></div>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="${params.confirmationUrl}" class="btn">View Booking Details</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HospitPro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  guestName: string;
  orderId: string;
  restaurantName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  estimatedTime?: number;
}): Promise<void> {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;">${item.name}</td>
          <td style="padding:8px 0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">₹${(item.price * item.quantity).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  await sendEmail({
    to: params.to,
    subject: `Order Confirmed - ${params.restaurantName} | #${params.orderId.slice(-8).toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#6C3EF4,#8B5CF6);padding:32px;text-align:center;color:white;">
              <h1 style="margin:0;">Order Received!</h1>
              <p style="margin:8px 0 0;opacity:0.9;">${params.restaurantName}</p>
            </div>
            <div style="padding:32px;">
              <p>Hi ${params.guestName || "Guest"},</p>
              <p>Your order <strong>#${params.orderId.slice(-8).toUpperCase()}</strong> has been received.</p>
              ${params.estimatedTime ? `<p>Estimated preparation time: <strong>${params.estimatedTime} minutes</strong></p>` : ""}
              <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <thead>
                  <tr style="border-bottom:2px solid #f3f4f6;">
                    <th style="text-align:left;padding:8px 0;color:#6b7280;">Item</th>
                    <th style="text-align:center;padding:8px 0;color:#6b7280;">Qty</th>
                    <th style="text-align:right;padding:8px 0;color:#6b7280;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr style="border-top:2px solid #f3f4f6;">
                    <td colspan="2" style="padding:12px 0;font-weight:bold;">Total</td>
                    <td style="padding:12px 0;text-align:right;font-weight:bold;color:#6C3EF4;">₹${params.totalAmount.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendEmailVerificationEmail(params: {
  to: string;
  name: string;
  otp: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: "Verify your HospitPro account",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;padding:32px;text-align:center;">
            <div style="background:linear-gradient(135deg,#6C3EF4,#8B5CF6);border-radius:8px;padding:24px;color:white;margin-bottom:24px;">
              <h1 style="margin:0;font-size:28px;">HospitPro</h1>
            </div>
            <h2>Verify Your Email</h2>
            <p>Hi ${params.name}, please use this OTP to verify your account:</p>
            <div style="background:#f3f0ff;border-radius:8px;padding:20px;margin:20px 0;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6C3EF4;">${params.otp}</span>
            </div>
            <p style="color:#6b7280;font-size:14px;">This OTP expires in 10 minutes. Don't share it with anyone.</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendReviewRequestEmail(params: {
  to: string;
  guestName: string;
  businessName: string;
  reviewUrl: string;
}): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: `How was your stay at ${params.businessName}?`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
          <div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;padding:32px;text-align:center;">
            <h2>We'd love your feedback!</h2>
            <p>Dear ${params.guestName},</p>
            <p>Thank you for choosing ${params.businessName}. We hope you had a wonderful experience!</p>
            <p>Please take a moment to share your feedback:</p>
            <a href="${params.reviewUrl}" style="display:inline-block;background:#6C3EF4;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Leave a Review</a>
          </div>
        </body>
      </html>
    `,
  });
}

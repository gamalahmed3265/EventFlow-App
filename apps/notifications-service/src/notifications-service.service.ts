import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsServiceService {
  private readonly logger=new Logger(NotificationsServiceService.name)

  constructor(private readonly emailService:EmailService){}

  async sendWelcomeEmail(data: {
  email: string;
  userId: string;
  name: string;
}): Promise<void> {
  const { email, userId, name } = data;

  const subject = 'Welcome to EventFlow 🎉';

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      color: #1f2937;
      background-color: #f9fafb;
      border-radius: 12px;
    ">
      <h1 style="color: #4f46e5;">
        Welcome to EventFlow, ${name}! 🎉
      </h1>

      <p style="font-size: 16px; line-height: 1.6;">
        We're excited to have you on board.
        Your account has been successfully created.
      </p>

      <p style="font-size: 16px; line-height: 1.6;">
        Discover amazing events, book your tickets,
        and never miss an experience worth remembering.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a
          href="${process.env.APP_URL}"
          style="
            display: inline-block;
            padding: 14px 28px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          "
        >
          Explore Events
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        If you have any questions, feel free to contact our support team.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af;">
        User ID: ${userId}
      </p>

      <p style="font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} EventFlow. All rights reserved.
      </p>
    </div>
  `;

  await this.emailService.sendEmail(email, subject, html);

  this.logger.log(`Welcome email sent successfully to user ${userId}`);
}
async sendTicketPurchasedEmail(data: {
  userId: string;
  email?: string;
  ticketCode: string;
  eventTitle?: string;
  quantity: number;
  totalPrice: number;
}): Promise<void> {
  const {
    userId,
    email,
    ticketCode,
    eventTitle = 'Your Event',
    quantity,
    totalPrice,
  } = data;

  if (!email) {
    this.logger.warn(
      `Skipping ticket confirmation email: no email provided for user ${userId}`,
    );
    return;
  }

  const subject = `Ticket Purchase Confirmed - ${eventTitle}`;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalPrice);

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background: #f9fafb;
      color: #1f2937;
      border-radius: 12px;
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5;">
          🎉 Ticket Confirmed!
        </h1>

        <p style="font-size: 16px; color: #6b7280;">
          Your ticket purchase was successful.
        </p>
      </div>

      <div style="
        background: #ffffff;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <h2 style="margin-top: 0;">
          ${this.escapeHtml(eventTitle)}
        </h2>

        <p>
          <strong>Ticket Code:</strong>
          ${this.escapeHtml(ticketCode)}
        </p>

        <p>
          <strong>Quantity:</strong>
          ${quantity}
        </p>

        <p>
          <strong>Total Price:</strong>
          ${formattedPrice}
        </p>
      </div>

      <div style="
        text-align: center;
        margin: 32px 0;
      ">
        <p style="color: #6b7280;">
          Please keep your ticket code safe.
          You may need it when attending the event.
        </p>
      </div>

      <hr style="
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 24px 0;
      " />

      <p style="
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      ">
        © ${new Date().getFullYear()} EventFlow. All rights reserved.
      </p>
    </div>
  `;

  await this.emailService.sendEmail(email, subject, html);

  this.logger.log(
    `Ticket confirmation email sent to user ${userId}`,
  );
}

async sendTicketCancelledEmail(data: {
  ticketId: string;
  userId: string;
  email?: string;
}): Promise<void> {
  const { email } = data;

  if (!email) {
    this.logger.warn(
      `Skipping ticket cancellation email: no email provided for user ${data.userId}`,
    );
    return;
  }

  this.logger.log(
    `Sending ticket cancellation notice to ${email}`,
  );

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background-color: #f9fafb;
      color: #1f2937;
      border-radius: 12px;
    ">
      <div style="text-align: center;">
        <h1 style="color: #dc2626;">
          Ticket Cancelled
        </h1>

        <p style="color: #6b7280;">
          Your ticket has been cancelled successfully.
        </p>
      </div>

      <div style="
        background: #ffffff;
        padding: 20px;
        border-radius: 8px;
        margin: 24px 0;
        border: 1px solid #e5e7eb;
      ">
        <p>
          <strong>Ticket ID:</strong>
          ${this.escapeHtml(data.ticketId)}
        </p>

        <p>
          <strong>Status:</strong>
          <span style="color: #dc2626;">Cancelled</span>
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        If you did not request this cancellation,
        please contact our support team.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="
        text-align: center;
        color: #9ca3af;
        font-size: 12px;
      ">
        © ${new Date().getFullYear()} EventFlow. All rights reserved.
      </p>
    </div>
  `;

  await this.emailService.sendEmail(
    email,
    'Ticket Cancelled',
    html,
  );

  this.logger.log(
    `Ticket cancellation email sent successfully to user ${data.userId}`,
  );
}
async sendEventCancelledEmail(data: {
  eventId: string;
  eventTitle?: string;
  organizerId: string;
  email?: string;
}): Promise<void> {
  const {
    eventId,
    eventTitle = 'Your Event',
    organizerId,
    email,
  } = data;

  if (!email) {
    this.logger.warn(
      `Skipping event cancellation email: no email provided for organizer ${organizerId}`,
    );
    return;
  }

  const subject = `Event Cancelled - ${eventTitle}`;

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background-color: #f9fafb;
      color: #1f2937;
      border-radius: 12px;
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #dc2626;">
          Event Cancelled
        </h1>

        <p style="font-size: 16px; color: #6b7280;">
          Your event has been cancelled.
        </p>
      </div>

      <div style="
        background-color: #ffffff;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <h2 style="margin-top: 0;">
          ${this.escapeHtml(eventTitle)}
        </h2>

        <p>
          <strong>Event ID:</strong>
          ${this.escapeHtml(eventId)}
        </p>

        <p>
          This event has been cancelled successfully.
        </p>
      </div>

      <div style="
        margin-top: 24px;
        padding: 16px;
        background-color: #fef2f2;
        border-radius: 8px;
        color: #991b1b;
      ">
        <p style="margin: 0;">
          If you did not request this cancellation or have
          any questions, please contact our support team.
        </p>
      </div>

      <hr style="
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 24px 0;
      " />

      <p style="
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      ">
        © ${new Date().getFullYear()} EventFlow.
        All rights reserved.
      </p>
    </div>
  `;

  try {
    await this.emailService.sendEmail(
      email,
      subject,
      html,
    );

    this.logger.log(
      `Event cancellation email sent successfully | Event: ${eventId} | Organizer: ${organizerId}`,
    );
  } catch (error) {
    this.logger.error(
      `Failed to send event cancellation email | Event: ${eventId} | Organizer: ${organizerId}`,
    );

    throw error;
  }
}
private escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
}

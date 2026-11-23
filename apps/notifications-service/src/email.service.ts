import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  onModuleInit() {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT) || 1025;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
    });

    this.logger.log(`Email Service Initialized (${host}:${port})`);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const appName = process.env.APP_NAME || 'EventFlow';
      const fromEmail =
        process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@eventflow.com';

      await this.transporter.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending Email to ${to} : ${error}`);
    }
  }
}

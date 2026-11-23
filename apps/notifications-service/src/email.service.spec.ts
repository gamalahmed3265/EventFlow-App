import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize nodemailer transport with MailHog defaults when env vars are unset', () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;

    service.onModuleInit();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  });

  it('should initialize nodemailer transport with env variables and secure=true for port 465', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';

    service.onModuleInit();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
    });
  });

  it('should send email with configured sender details', async () => {
    process.env.APP_NAME = 'EventFlow';
    process.env.SMTP_FROM = 'noreply@eventflow.com';

    service.onModuleInit();
    await service.sendEmail('user@example.com', 'Hello', '<p>Welcome</p>');

    expect(sendMailMock).toHaveBeenCalledWith({
      from: '"EventFlow" <noreply@eventflow.com>',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Welcome</p>',
    });
  });

  it('should catch and log error when sendMail fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Connection refused'));

    service.onModuleInit();
    await expect(
      service.sendEmail('user@example.com', 'Hello', '<p>Welcome</p>'),
    ).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});


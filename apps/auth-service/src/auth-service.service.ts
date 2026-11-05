import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Connected to Kafka broker successfully');
    } catch (error) {
      this.logger.error(
        'Failed to connect to Kafka broker. Ensure Kafka is running.',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async simulateUserRegister(email: string) {
    // Publish message to Kafka
    this.kafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      email,
      timestamp: new Date().toISOString(),
    });

    return { message: `User ${email} register event published successfully` };
  }
}

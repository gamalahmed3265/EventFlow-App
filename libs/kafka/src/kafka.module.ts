import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

export const KAFKA_SERVICE = 'KAFKA_SERVICE';

@Module({})
export class KafkaModule {
  static register(consumerGroup?: string): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: KAFKA_SERVICE,
            useFactory: (configService: ConfigService) => {
              const broker = configService.get<string>(
                'KAFKA_BROKER',
                'localhost:9092',
              );
              const clientId = configService.get<string>(
                'KAFKA_CLIENT_ID',
                'eventflow-app',
              );
              const defaultGroup = configService.get<string>(
                'KAFKA_CONSUMER_GROUP_ID',
                'eventflow-consumer',
              );

              return {
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId,
                    brokers: [broker],
                  },
                  consumer: {
                    groupId: consumerGroup ?? defaultGroup,
                  },
                },
              };
            },
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}

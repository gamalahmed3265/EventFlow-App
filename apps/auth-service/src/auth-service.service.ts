import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import { DatabaseService, users } from '@app/database';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthServiceService implements OnModuleInit {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
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

  async register(email: string, password: string, name: string) {
    const existUser = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();
    if (existUser.length > 0) {
      throw new ConflictException('User already exists');
    }
    // Hash the password before storing it
    const hashPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [newUser] = await this.dbService.db
      .insert(users)
      .values({
        email,
        password: hashPassword,
        name,
      })
      .returning()
      .execute();
    this.logger.log(`User ${email} registered successfully`);

    // Emit a Kafka event for user registration
    this.kafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      userId: newUser.id,
      email,
      timestamp: new Date().toISOString(),
    });
    return {
      message: 'User registered successfully',
      userId: newUser.id,
    };
  }

  async login(email: string, password: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();

      // Check if the user exists
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
// Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
// Generate a JWT token for the authenticated user
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    this.logger.log(`User ${email} logged in successfully`);

    // 
    this.kafkaClient.emit(KAFKA_TOPICS.USER_LOGGED_IN, {
      userId: user.id,
      email,
      timestamp: new Date().toISOString(),
    });
    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
 
  async getProfile(userId: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

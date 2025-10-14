import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../shared/types';
import { generateClientSeed } from '../shared/utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(handle: string, email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { handle },
          { email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this handle or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        handle,
        email,
        password: hashedPassword,
      },
    });

    // Create default fairness seed for user
    await this.createUserFairnessSeed(user.id);

    return this.generateTokens(user);
  }

  async login(handle: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { handle },
          { email: handle },
        ],
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  async validateUser(userId: string): Promise<UserPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      sub: user.id,
      handle: user.handle,
      email: user.email,
    };
  }

  private async generateTokens(user: any) {
    const payload: UserPayload = {
      sub: user.id,
      handle: user.handle,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        handle: user.handle,
        email: user.email,
      },
    };
  }

  private async createUserFairnessSeed(userId: string) {
    const serverSeed = this.generateServerSeed();
    const serverSeedHash = await this.sha256(serverSeed);

    await this.prisma.fairnessSeed.create({
      data: {
        userId,
        serverSeed,
        serverSeedHash,
        active: true,
      },
    });
  }

  private generateServerSeed(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async sha256(input: string): Promise<string> {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

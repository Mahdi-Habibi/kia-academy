import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  CompleteProfileDto,
  LearnerState,
  ProfileDetails,
  RequestOtpResponse,
} from '@kia-academy/shared';
import {
  containsUnsafeText,
  isValidEmail,
  normalizeIranianPhone,
  resolveModeratorAdminAccess,
  sanitizeProfileText,
} from '@kia-academy/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { addDurationToDate, parseExpiresInSeconds } from './auth.utils';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse & { refreshToken: string }> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const settings = await this.siteSettings.get();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        profileComplete: true,
        bootcampProfile: {
          create: {
            rank: settings.bootcamp.defaultRank,
            points: settings.bootcamp.defaultPoints,
          },
        },
      },
    });

    await this.emailService.sendWelcome({
      id: user.id,
      name: user.name,
      email: user.email ?? email,
    });

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse & { refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async requestOtp(rawPhone: string): Promise<RequestOtpResponse> {
    const phone = normalizeIranianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid Iranian phone number');
    }

    const code = String(randomInt(100000, 999999));
    const codeHash = this.hashOtp(phone, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.phoneOtp.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.prisma.phoneOtp.create({
      data: { phone, codeHash, expiresAt },
    });

    const expose =
      this.configService.get<string>('OTP_DEV_EXPOSE') === 'true' ||
      this.configService.get<string>('NODE_ENV') !== 'production';

    if (expose) {
      console.info(`[otp] phone=${phone} code=${code}`);
    } else {
      console.info(`[otp] code sent to ${phone}`);
    }

    return {
      phone,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      ...(expose ? { devCode: code } : {}),
    };
  }

  async verifyOtp(
    rawPhone: string,
    code: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const phone = normalizeIranianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid Iranian phone number');
    }
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid verification code');
    }

    const otp = await this.prisma.phoneOtp.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Code expired or not found');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }

    const ok = otp.codeHash === this.hashOtp(phone, code);
    if (!ok) {
      await this.prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const settings = await this.siteSettings.get();
      user = await this.prisma.user.create({
        data: {
          phone,
          phoneVerified: true,
          name: '',
          profileComplete: false,
          bootcampProfile: {
            create: {
              rank: settings.bootcamp.defaultRank,
              points: settings.bootcamp.defaultPoints,
            },
          },
        },
      });
    } else if (!user.phoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const firstName = sanitizeProfileText(dto.firstName);
    const lastName = sanitizeProfileText(dto.lastName);
    const city = sanitizeProfileText(dto.city);
    const email = dto.email.trim().toLowerCase();

    if (!firstName || !lastName || !city) {
      throw new BadRequestException('All profile fields are required');
    }
    if (
      containsUnsafeText(firstName) ||
      containsUnsafeText(lastName) ||
      containsUnsafeText(city)
    ) {
      throw new BadRequestException('Profile contains unsafe content');
    }
    if (!isValidEmail(email) || containsUnsafeText(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const emailOwner = await this.prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== userId) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        city,
        email,
        name: `${firstName} ${lastName}`.trim(),
        profileComplete: true,
      },
    });

    if (user.email) {
      await this.emailService.sendWelcome({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async getProfileDetails(userId: string): Promise<ProfileDetails> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      city: user.city ?? '',
      email: user.email,
      phone: user.phone,
      name: user.name,
    };
  }

  async updateProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<AuthResponse & { refreshToken: string }> {
    // Same validation/path as onboarding; keeps profileComplete true for existing learners.
    return this.completeProfile(userId, dto);
  }

  async refresh(
    user: AuthUser,
    refreshToken: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id, token: refreshToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueAuthResponse(user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
      return;
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async validateUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.buildAuthUser(user) : null;
  }

  async validateRefreshToken(
    userId: string,
    tokenId: string,
    refreshToken: string,
  ): Promise<AuthUser | null> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { id: tokenId, userId, token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }

    return this.buildAuthUser(stored.user);
  }

  async getLearnerState(userId: string): Promise<LearnerState> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [roadmaps, readinessTests, examAttempts, entitlements, enrollments] = await Promise.all([
      this.prisma.roadmap.findMany({
        where: { userId },
        select: { enrolled: true },
      }),
      this.prisma.readinessTest.findMany({
        where: { userId },
        select: { id: true },
      }),
      this.prisma.examAttempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        select: { id: true },
      }),
      this.prisma.entitlement.findMany({ where: { userId } }),
      this.prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { slug: true } } },
      }),
    ]);

    const hasRoadmap = roadmaps.length > 0;
    const roadmapEnrolled = roadmaps.some((roadmap) => roadmap.enrolled);
    // Readiness test is free — legacy readinessPaid kept for client compatibility.
    const readinessPaid = true;

    const authUser = await this.buildAuthUser(user);

    return {
      user: authUser,
      hasRoadmap,
      roadmapEnrolled,
      readinessPaid,
      testCompleted: readinessTests.length > 0 || examAttempts.length > 0,
      profileComplete: authUser.profileComplete,
      entitlements: entitlements.map(
        (entitlement) => `${entitlement.resourceType}:${entitlement.resourceId}`,
      ),
      enrollments: enrollments.map((enrollment) => enrollment.course.slug),
    };
  }

  private hashOtp(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }

  private async issueAuthResponse(
    user: AuthUser,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const tokens = await this.createTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  private async createTokens(user: AuthUser): Promise<AuthTokens & { refreshToken: string }> {
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const refreshRecord = await this.prisma.refreshToken.create({
      data: {
        token: randomBytes(48).toString('hex'),
        userId: user.id,
        expiresAt: addDurationToDate(refreshExpiresIn),
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email ?? user.phone ?? '',
        role: user.role,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: parseExpiresInSeconds(accessExpiresIn),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, tokenId: refreshRecord.id },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: parseExpiresInSeconds(refreshExpiresIn),
      },
    );

    await this.prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { token: refreshToken },
    });

    return {
      accessToken,
      expiresIn: parseExpiresInSeconds(accessExpiresIn),
      refreshToken,
    };
  }

  private async buildAuthUser(user: {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    role: AuthUser['role'];
    profileComplete?: boolean;
    adminPanelAccess?: unknown;
  }): Promise<AuthUser> {
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      city: user.city ?? null,
      role: user.role,
      profileComplete: Boolean(user.profileComplete),
    };

    if (user.role === 'ADMIN') {
      const settings = await this.siteSettings.get();
      authUser.adminPanelAccess = resolveModeratorAdminAccess(
        user.adminPanelAccess,
        settings.adminAccess,
      );
    }

    return authUser;
  }
}

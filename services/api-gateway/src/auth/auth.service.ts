import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { RegisterDto, AuthResponseDto, UserResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email, active: true } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      role: registerDto.role || 'broker',
      entityId: registerDto.entityId,
    });

    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async login(user: User): Promise<AuthResponseDto> {
    return this.generateAuthResponse(user);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      entityId: user.entityId,
      createdAt: user.createdAt,
    };
  }

  async refreshToken(user: User): Promise<AuthResponseDto> {
    const freshUser = await this.userRepository.findOne({ where: { id: user.id } });
    if (!freshUser || !freshUser.active) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return this.generateAuthResponse(freshUser);
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      entityId: user.entityId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        entityId: user.entityId,
        createdAt: user.createdAt,
      },
    };
  }
}

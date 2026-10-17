import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticateUser } from '../application/authenticate-user.js';
import { RegisterUser } from '../application/register-user.js';

import { LoginDto } from './login.dto.js';
import { RegisterUserDto } from './register-user.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegisterUser)
    private readonly registerUser: RegisterUser,
    @Inject(AuthenticateUser)
    private readonly authenticateUser: AuthenticateUser,
  ) {}

  @ApiResponse({
    status: 201,
    description: 'Cuenta creada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado.',
  })
  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    try {
      const user = await this.registerUser.execute({
        email: body.email,
        password: body.password,
        name: body.name,
      });

      return {
        data: {
          id: user.id,
          email: user.email.value,
          name: user.name,
          status: user.currentStatus,
          role: user.currentRole,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'EMAIL_INVALID'
      ) {
        throw new BadRequestException('Email is not valid');
      }

      if (
        error instanceof Error &&
        error.message === 'PASSWORD_LENGTH_INVALID'
      ) {
        throw new BadRequestException(
          'Password length is not valid',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'PASSWORD_TOO_PREDICTABLE'
      ) {
        throw new BadRequestException(
          'Password is too predictable',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'USER_NAME_REQUIRED'
      ) {
        throw new BadRequestException('Name is required');
      }

      if (
        error instanceof Error &&
        error.message === 'EMAIL_ALREADY_REGISTERED'
      ) {
        throw new ConflictException(
          'Email is already registered',
        );
      }

      throw error;
    }
  }

  @ApiResponse({
    status: 200,
    description: 'Sesión iniciada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas.',
  })
  @ApiResponse({
    status: 403,
    description: 'La cuenta no está activa.',
  })
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: LoginDto) {
    try {
      const result = await this.authenticateUser.execute({
        email: body.email,
        password: body.password,
      });

      return { data: result };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'INVALID_LOGIN_REQUEST'
      ) {
        throw new BadRequestException(
          'Email and password are required',
        );
      }

      if (
        error instanceof Error &&
        error.message === 'INVALID_CREDENTIALS'
      ) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (
        error instanceof Error &&
        error.message === 'USER_NOT_ACTIVE'
      ) {
        throw new ForbiddenException('Account is not active');
      }

      throw error;
    }
  }
}
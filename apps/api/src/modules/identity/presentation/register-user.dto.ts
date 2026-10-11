import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../domain/password-policy.js';

export class RegisterUserDto {
  @ApiProperty({
    example: 'marta@example.com',
    description:
      'Email de la cuenta. Se normaliza a minúsculas.',
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'Sala-Mediterranea-2026',
    description:
      'Contraseña en claro. Solo viaja en esta petición.',
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiProperty({
    example: 'Marta Ferrer',
    description: 'Nombre visible de la persona.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
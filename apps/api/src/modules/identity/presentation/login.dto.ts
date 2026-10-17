import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'marta@example.com',
    description: 'Email de la cuenta.',
  })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Sala-Mediterranea-2026',
    description: 'Contraseña de la cuenta.',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
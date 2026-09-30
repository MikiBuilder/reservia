import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'booking-api-001',
    description: 'Identificador único de la reserva.',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    example: 'demo-resource-1',
    description:
      'Identificador del recurso que se quiere reservar.',
  })
  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @ApiProperty({
    example: 'customer-001',
    description: 'Identificador del cliente.',
  })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({
    example: '2026-08-31T10:00:00.000Z',
    description: 'Fecha de inicio en UTC.',
  })
  @IsISO8601()
  startsAt!: string;

  @ApiProperty({
    example: '2026-08-31T11:00:00.000Z',
    description: 'Fecha de finalización en UTC.',
  })
  @IsISO8601()
  endsAt!: string;
}
import {
  IsISO8601,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;
}
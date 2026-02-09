import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  /** User email address */
  @ApiProperty({ example: 'user@acme.com' })
  @IsEmail()
  email: string;

  /** Password (minimum 8 characters) */
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  /** First name */
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  /** Last name */
  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  /** User role */
  @ApiPropertyOptional({ enum: ['owner', 'admin', 'member'], default: 'member' })
  @IsOptional()
  @IsIn(['owner', 'admin', 'member'])
  role?: 'owner' | 'admin' | 'member';
}

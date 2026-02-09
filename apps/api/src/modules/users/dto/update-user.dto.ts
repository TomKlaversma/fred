import { IsEmail, IsOptional, IsString, MinLength, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  /** User email address */
  @ApiPropertyOptional({ example: 'user@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  /** New password (minimum 8 characters) */
  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

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
  @ApiPropertyOptional({ enum: ['owner', 'admin', 'member'] })
  @IsOptional()
  @IsIn(['owner', 'admin', 'member'])
  role?: 'owner' | 'admin' | 'member';

  /** Whether the user is active */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

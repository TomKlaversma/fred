import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  /** User email address */
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email: string;

  /** Password */
  @ApiProperty({ example: 'secureP@ss123' })
  @IsString()
  @MinLength(1)
  password: string;
}

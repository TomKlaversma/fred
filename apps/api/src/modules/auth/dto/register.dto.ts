import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  /** Name of the company to create */
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  /** User email address */
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email: string;

  /** Password (minimum 8 characters) */
  @ApiProperty({ example: 'secureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  /** User first name */
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  /** User last name */
  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

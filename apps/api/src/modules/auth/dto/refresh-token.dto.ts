import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  /** The refresh token received from login or previous refresh */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

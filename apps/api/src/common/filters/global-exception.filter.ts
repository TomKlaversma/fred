import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

interface ExceptionResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let response: ExceptionResponse;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        response = {
          statusCode: status,
          error: HttpStatus[status] || 'Error',
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        response = {
          statusCode: status,
          error: (resp.error as string) || HttpStatus[status] || 'Error',
          message: Array.isArray(resp.message)
            ? resp.message.join(', ')
            : (resp.message as string) || exception.message,
          details: resp.details || undefined,
        };
      } else {
        response = {
          statusCode: status,
          error: HttpStatus[status] || 'Error',
          message: exception.message,
        };
      }

      reply.status(status).send(response);
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );

      response = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };

      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(response);
    }
  }
}

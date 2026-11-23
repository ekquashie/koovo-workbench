import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/logger';

/** Validation failure carrying per-field messages for the frontend forms. */
export class FieldValidationException extends BadRequestException {
  constructor(public readonly errors: Record<string, string>) {
    super(
      Object.values(errors)[0] ?? 'Please check your details and try again.',
    );
  }

  static fromValidationErrors(errors: ValidationError[]) {
    const map: Record<string, string> = {};
    const walk = (list: ValidationError[], prefix = '') => {
      for (const e of list) {
        const key = prefix ? `${prefix}.${e.property}` : e.property;
        const first = e.constraints && Object.values(e.constraints)[0];
        if (first) map[key] = first;
        if (e.children?.length) walk(e.children, key);
      }
    };
    walk(errors);
    return new FieldValidationException(map);
  }
}

/**
 * Every error leaves the API as { code, message, data: null } — the same
 * envelope as successful responses. Unexpected errors are logged with their
 * trace and replaced by a generic message.
 */
@Catch()
export class CustomExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // HttpExceptions carry messages we wrote for customers (including 502s
    // like "You have not been charged"); anything else is an unexpected
    // crash whose details must never leave the server.
    let message = 'Something went wrong on our side. Please try again.';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const raw =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] }).message;
      message = (Array.isArray(raw) ? raw[0] : raw) ?? exception.message;
    }

    if (status >= 500) {
      const trace =
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception);
      this.logger.error(`${request.method} ${request.url} failed`, trace);
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      ...(exception instanceof FieldValidationException
        ? { errors: exception.errors }
        : {}),
    });
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

const RESPONSE_MESSAGE_KEY = 'responseMessage';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** Wraps every successful response as { code, message, data }. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      'Success';
    const res = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) =>
        // File downloads (e.g. CSV export) go out as-is.
        data instanceof StreamableFile
          ? (data as unknown as ApiResponse<T>)
          : { code: res.statusCode, message, data: data ?? (null as T) },
      ),
    );
  }
}

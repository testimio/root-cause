type ApiErrorCode =
  | 'E_UNAUTHENTICATED'
  | 'E_CREDENTIALS_DONT_MATCH'
  | 'E_CREATING_EXECUTION_FAILED'
  | 'E_UPLOAD_REQUEST_FAILED'
  | 'E_FILE_NOT_FOUND';
class TestimApiErrorBase extends Error {
  constructor(public code: ApiErrorCode, message: string) {
    super(message);
  }
}
export class TestimApiError extends TestimApiErrorBase {
  constructor(private originalError: Error, message: string, code: ApiErrorCode) {
    super(code, message);
  }
}
export class TestimNotFoundError extends TestimApiErrorBase {
  constructor(message: string) {
    super('E_FILE_NOT_FOUND', message);
  }
}

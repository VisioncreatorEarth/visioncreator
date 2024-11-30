import { OperationError } from '@wundergraph/sdk/operations';

export class UltravoxInitializationError extends OperationError {
  constructor(message: string) {
    super();
    this.message = message;
  }
  statusCode = 400;
  code = 'UltravoxInitializationError' as const;
}

export class UltravoxSubscriptionError extends OperationError {
  statusCode = 402;
  code = 'UltravoxSubscriptionError' as const;
  message = 'Ultravox subscription needs to be set up';
}

export class UltravoxAuthenticationError extends OperationError {
  statusCode = 401;
  code = 'UltravoxAuthenticationError' as const;
  message = 'Invalid or missing Ultravox API key';
}

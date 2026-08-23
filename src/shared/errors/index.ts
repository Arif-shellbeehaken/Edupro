/**
 * Domain & Application Errors
 * Never throw generic Error in business logic.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with id ${id} not found` : `${entity} not found`,
      "NOT_FOUND",
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class TenantIsolationError extends AppError {
  constructor() {
    super(
      "Tenant isolation violation: attempt to access data outside current tenant context",
      "TENANT_ISOLATION_VIOLATION",
      403
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

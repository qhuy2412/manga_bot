export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly details: Array<string>;

    constructor(message: string, statusCode: number = 500, errorCode: string = "INTERNAL_SERVER_ERROR", details: Array<string> = []) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;

        Error.captureStackTrace(this, AppError);
    }
}
export class BadRequestError extends AppError {
    constructor(message: string, errorCode: string = "BAD_REQUEST", details: Array<string> = []) {
        super(message, 400, errorCode, details);
    }
}
export class NotFoundError extends AppError {
    constructor(message: string, errorCode: string = "NOT_FOUND", details: Array<string> = []) {
        super(message, 404, errorCode, details);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message: string, errorCode: string = "UNAUTHORIZED", details: Array<string> = []) {
        super(message, 401, errorCode, details);
    }
}
export class ForbiddenError extends AppError {
    constructor(message: string, errorCode: string = "FORBIDDEN", details: Array<string> = []) {
        super(message, 403, errorCode);
    }
}
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const error_codes_1 = require("../constants/error-codes");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = error_codes_1.ErrorCodes.INTERNAL_ERROR;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                errorCode = resp.code || this.getDefaultErrorCode(status);
                message = resp.message || exception.message;
            }
            else {
                message = exceptionResponse;
                errorCode = this.getDefaultErrorCode(status);
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        response.status(status).json({
            success: false,
            error: {
                code: errorCode,
                message,
            },
            timestamp: new Date().toISOString(),
        });
    }
    getDefaultErrorCode(status) {
        switch (status) {
            case 400:
                return error_codes_1.ErrorCodes.VALIDATION_ERROR;
            case 401:
                return error_codes_1.ErrorCodes.AUTH_REQUIRED;
            case 403:
                return error_codes_1.ErrorCodes.FORBIDDEN;
            case 404:
                return error_codes_1.ErrorCodes.USER_NOT_FOUND;
            default:
                return error_codes_1.ErrorCodes.INTERNAL_ERROR;
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map
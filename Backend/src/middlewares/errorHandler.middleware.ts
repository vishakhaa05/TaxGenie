import { Response } from "express";
import { z, ZodError } from "zod";
import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/app-error";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { MulterError } from "multer";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errors: errors,
    errorCode: ErrorCodeEnum.VALIDATION_ERROR,
  });
};

const handleMulterError = (error: MulterError) => {
  const messages = {
    LIMIT_UNEXPECTED_FILE: "Invalid file field name. Please use 'file'",
    LIMIT_FILE_SIZE: "File size exceeds the limit",
    LIMIT_FILE_COUNT: "Too many files uploaded",
    default: "File upload error",
  };

  return {
    status: HTTPSTATUS.BAD_REQUEST,
    message: messages[error.code as keyof typeof messages] || messages.default,
    error: error.message,
  };
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.log("Error occurred on PATH:", req.path, "Error:", error);

  if (error instanceof ZodError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCodeEnum.VALIDATION_ERROR || "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.issues,
      },
      message: "Validation failed",
      errors: error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  if (error instanceof MulterError) {
    const { status, message, error: err } = handleMulterError(error);
    return res.status(status).json({
      success: false,
      error: {
        code: ErrorCodeEnum.FILE_UPLOAD_ERROR || "FILE_UPLOAD_ERROR",
        message,
      },
      message,
      errorCode: ErrorCodeEnum.FILE_UPLOAD_ERROR,
    });
  }

  if (error?.statusCode || error?.status) {
    const status = error.statusCode || error.status;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || error.errorCode || "REQUEST_ERROR",
        message: error.message || "An error occurred",
      },
      message: error.message,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.errorCode || "APPLICATION_ERROR",
        message: error.message,
      },
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error?.message || "Internal server error occurred",
    },
    message: "Internal Server Error",
  });
};

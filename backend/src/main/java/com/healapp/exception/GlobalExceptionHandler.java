package com.healapp.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;

import com.healapp.dto.ApiResponse;
import com.healapp.service.PasswordResetService;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                false,
                "Invalid information",
                errors,
                LocalDateTime.now());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse<String>> handleMultipartException(MultipartException ex) {
        ApiResponse<String> response = new ApiResponse<>(
                false,
                "File upload error: " + ex.getMessage(),
                null,
                LocalDateTime.now());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGlobalException(Exception ex) {
        ApiResponse<String> response = new ApiResponse<>(
                false,
                "An error occurred: " + ex.getMessage(),
                null,
                LocalDateTime.now());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(PasswordResetService.RateLimitException.class)
    public ResponseEntity<ApiResponse<String>> handleRateLimit(PasswordResetService.RateLimitException ex) {
        ApiResponse<String> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                LocalDateTime.now());
        return new ResponseEntity<>(response, HttpStatus.TOO_MANY_REQUESTS);
    }
}
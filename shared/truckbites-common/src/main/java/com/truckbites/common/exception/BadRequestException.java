package com.truckbites.common.exception;

/**
 * Thrown when a request is semantically invalid (e.g. a payment could not be
 * verified). Mapped to HTTP 400 by the shared {@link GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

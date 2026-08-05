package com.truckbites.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingFilterTest {

    private RateLimitingFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    @BeforeEach
    void setUp() throws Exception {
        filter = new RateLimitingFilter();
        lenient().when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
    }

    @Test
    @DisplayName("Should allow requests to non-auth endpoints without rate limiting")
    void doFilter_shouldAllowNonAuthEndpoints() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/trucks/search");
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("Should allow requests within rate limit")
    void doFilter_shouldAllowRequestsWithinLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        for (int i = 0; i < 20; i++) {
            filter.doFilter(request, response, chain);
        }
        verify(chain, times(20)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("Should reject requests exceeding rate limit")
    void doFilter_shouldRejectRequestsExceedingLimit() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("192.168.1.2");
        for (int i = 0; i < 21; i++) {
            filter.doFilter(request, response, chain);
        }
        verify(chain, times(20)).doFilter(request, response);
        verify(response).setStatus(429);
        verify(response).setContentType("application/json");
    }

    @Test
    @DisplayName("Should rate limit login and register endpoints independently")
    void doFilter_shouldRateLimitEndpointsIndependently() throws Exception {
        when(request.getRemoteAddr()).thenReturn("192.168.1.3");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        for (int i = 0; i < 20; i++) {
            filter.doFilter(request, response, chain);
        }
        when(request.getRequestURI()).thenReturn("/api/auth/register");
        for (int i = 0; i < 20; i++) {
            filter.doFilter(request, response, chain);
        }
        verify(chain, times(40)).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("Should rate limit different IPs independently")
    void doFilter_shouldRateLimitIpsIndependently() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        for (int i = 0; i < 21; i++) {
            filter.doFilter(request, response, chain);
        }
        verify(chain, times(20)).doFilter(request, response);
        verify(response).setStatus(429);
    }

    @Test
    @DisplayName("Should respect X-Forwarded-For header for client IP")
    void doFilter_shouldUseXForwardedForHeader() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/register");
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.5, 10.0.0.1");
        for (int i = 0; i < 21; i++) {
            filter.doFilter(request, response, chain);
        }
        verify(chain, times(20)).doFilter(request, response);
        verify(response).setStatus(429);
    }
}

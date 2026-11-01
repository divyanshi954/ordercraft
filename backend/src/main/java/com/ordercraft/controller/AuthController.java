package com.ordercraft.controller;

import com.ordercraft.dto.JwtAuthResponse;
import com.ordercraft.dto.LoginRequest;
import com.ordercraft.dto.UserSummaryDto;
import com.ordercraft.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and session info")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user credentials and returns JWT bearer token")
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns profile of currently authenticated user")
    public ResponseEntity<UserSummaryDto> getCurrentUser(Authentication authentication) {
        UserSummaryDto user = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(user);
    }
}

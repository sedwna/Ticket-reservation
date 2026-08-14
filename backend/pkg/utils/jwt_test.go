package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const testJWTSecret = "0123456789abcdef0123456789abcdef"

func TestValidateTokenAcceptsIssuedHS256Token(t *testing.T) {
	token, err := GenerateToken(uuid.New(), "user@example.com", "USER", "Test User", testJWTSecret, 1)
	if err != nil {
		t.Fatalf("GenerateToken() failed: %v", err)
	}

	if _, err := ValidateToken(token, testJWTSecret); err != nil {
		t.Fatalf("ValidateToken() rejected a legitimate token: %v", err)
	}
}

func TestValidateTokenRejectsDifferentHMACAlgorithm(t *testing.T) {
	claims := &Claims{
		UserID: uuid.NewString(),
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "ticket-reservation-system",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS512, claims).SignedString([]byte(testJWTSecret))
	if err != nil {
		t.Fatalf("failed to create test token: %v", err)
	}

	if _, err := ValidateToken(token, testJWTSecret); err == nil {
		t.Fatal("expected HS512 token to be rejected")
	}
}

func TestValidateTokenRequiresIssuerAndExpiration(t *testing.T) {
	claims := &Claims{UserID: uuid.NewString()}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testJWTSecret))
	if err != nil {
		t.Fatalf("failed to create test token: %v", err)
	}

	if _, err := ValidateToken(token, testJWTSecret); err == nil {
		t.Fatal("expected token without issuer and expiration to be rejected")
	}
}

package config

import (
	"strings"
	"testing"
)

func setRequiredEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "test")
	t.Setenv("DB_PASSWORD", "test-database-password")
	t.Setenv("JWT_SECRET", strings.Repeat("s", 32))
	t.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	t.Setenv("DEMO_MODE", "false")
}

func TestLoadConfigAcceptsExplicitSecureSettings(t *testing.T) {
	setRequiredEnvironment(t)

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig() returned an error: %v", err)
	}
	if cfg.Environment != "test" {
		t.Fatalf("expected test environment, got %q", cfg.Environment)
	}
	if len(cfg.CORSAllowedOrigins) != 1 || cfg.CORSAllowedOrigins[0] != "http://localhost:3000" {
		t.Fatalf("unexpected CORS origins: %#v", cfg.CORSAllowedOrigins)
	}
	if cfg.DemoMode {
		t.Fatal("demo mode must be disabled by default")
	}
}

func TestLoadConfigRejectsWeakJWTSecret(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("JWT_SECRET", "short")

	if _, err := LoadConfig(); err == nil {
		t.Fatal("expected a weak JWT secret to be rejected")
	}
}

func TestLoadConfigRequiresStrongDemoPassword(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("DEMO_MODE", "true")
	t.Setenv("DEMO_ADMIN_PASSWORD", "too-short")

	if _, err := LoadConfig(); err == nil {
		t.Fatal("expected a weak demo password to be rejected")
	}
}

func TestLoadConfigRejectsDemoModeInProduction(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("DEMO_MODE", "true")
	t.Setenv("DEMO_ADMIN_PASSWORD", "a-strong-demo-password")

	if _, err := LoadConfig(); err == nil {
		t.Fatal("expected demo mode to be rejected in production")
	}
}

func TestLoadConfigRejectsWildcardCORSWithCredentials(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("CORS_ALLOWED_ORIGINS", "*")

	if _, err := LoadConfig(); err == nil {
		t.Fatal("expected wildcard CORS origin to be rejected")
	}
}

func TestLoadConfigRejectsInvalidJWTExpiry(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("JWT_EXPIRY_HOURS", "0")

	if _, err := LoadConfig(); err == nil {
		t.Fatal("expected invalid JWT expiry to be rejected")
	}
}

func TestParseCSVTrimsAndDeduplicates(t *testing.T) {
	items := parseCSV(" https://one.example,https://two.example,https://one.example, ")
	if len(items) != 2 || items[0] != "https://one.example" || items[1] != "https://two.example" {
		t.Fatalf("unexpected parsed values: %#v", items)
	}
}

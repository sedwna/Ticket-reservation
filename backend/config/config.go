package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment            string
	ServerPort             string
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPassword             string
	DBName                 string
	DBSSLMode              string
	JWTSecret              string
	JWTExpiry              int // hours
	EmailDomainCheck       bool
	EmailDNSTimeoutSeconds int
	CORSAllowedOrigins     []string
	DemoMode               bool
	DemoAdminStudentID     string
	DemoAdminEmail         string
	DemoAdminPassword      string
}

func LoadConfig() (*Config, error) {
	godotenv.Load()

	environment := strings.ToLower(strings.TrimSpace(getEnv("APP_ENV", "development")))
	if environment != "development" && environment != "test" && environment != "production" {
		return nil, errors.New("APP_ENV must be development, test, or production")
	}

	dbPassword := strings.TrimSpace(os.Getenv("DB_PASSWORD"))
	if dbPassword == "" || strings.HasPrefix(dbPassword, "replace-") {
		return nil, errors.New("DB_PASSWORD must be set to a non-placeholder value")
	}

	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) < 32 || strings.HasPrefix(jwtSecret, "replace-") {
		return nil, errors.New("JWT_SECRET must be a non-placeholder value of at least 32 characters")
	}

	corsOrigins := parseCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"))
	if err := validateOrigins(corsOrigins); err != nil {
		return nil, err
	}
	if environment == "production" {
		if _, configured := os.LookupEnv("CORS_ALLOWED_ORIGINS"); !configured || len(corsOrigins) == 0 {
			return nil, errors.New("CORS_ALLOWED_ORIGINS must be explicitly set in production")
		}
	}

	cfg := &Config{
		Environment: environment,
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: dbPassword,
		DBName:     getEnv("DB_NAME", "ticket_reservation"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		JWTSecret:  jwtSecret,
		CORSAllowedOrigins: corsOrigins,
	}

	expiry, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	if err != nil || expiry < 1 || expiry > 168 {
		return nil, errors.New("JWT_EXPIRY_HOURS must be an integer between 1 and 168")
	}
	cfg.JWTExpiry = expiry

	domainCheck, err := strconv.ParseBool(getEnv("EMAIL_DOMAIN_CHECK", "true"))
	if err != nil {
		domainCheck = true
	}
	cfg.EmailDomainCheck = domainCheck

	dnsTimeout, err := strconv.Atoi(getEnv("EMAIL_DNS_TIMEOUT_SECONDS", "4"))
	if err != nil || dnsTimeout < 1 {
		dnsTimeout = 4
	}
	cfg.EmailDNSTimeoutSeconds = dnsTimeout

	demoMode, err := strconv.ParseBool(getEnv("DEMO_MODE", "false"))
	if err != nil {
		return nil, errors.New("DEMO_MODE must be true or false")
	}
	cfg.DemoMode = demoMode
	if demoMode {
		if environment == "production" {
			return nil, errors.New("DEMO_MODE cannot be enabled in production")
		}
		cfg.DemoAdminStudentID = strings.TrimSpace(getEnv("DEMO_ADMIN_STUDENT_ID", "4000000001"))
		cfg.DemoAdminEmail = strings.ToLower(strings.TrimSpace(getEnv("DEMO_ADMIN_EMAIL", "ticket.reservation.demo+system-admin@gmail.com")))
		cfg.DemoAdminPassword = os.Getenv("DEMO_ADMIN_PASSWORD")
		if len(cfg.DemoAdminPassword) < 12 || strings.HasPrefix(cfg.DemoAdminPassword, "replace-") {
			return nil, errors.New("DEMO_ADMIN_PASSWORD must be a non-placeholder value of at least 12 characters when DEMO_MODE=true")
		}
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func parseCSV(value string) []string {
	items := make([]string, 0)
	seen := make(map[string]struct{})
	for _, raw := range strings.Split(value, ",") {
		item := strings.TrimSpace(raw)
		if item == "" {
			continue
		}
		if _, exists := seen[item]; exists {
			continue
		}
		seen[item] = struct{}{}
		items = append(items, item)
	}
	return items
}

func validateOrigins(origins []string) error {
	for _, origin := range origins {
		if origin == "*" {
			return errors.New("CORS_ALLOWED_ORIGINS cannot contain a wildcard")
		}
		parsed, err := url.Parse(origin)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" ||
			(parsed.Path != "" && parsed.Path != "/") || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.User != nil {
			return fmt.Errorf("CORS_ALLOWED_ORIGINS contains an invalid origin: %q", origin)
		}
	}
	return nil
}

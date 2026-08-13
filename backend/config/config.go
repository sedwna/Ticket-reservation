package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
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
	EmailAllowedDomains    []string
	EmailDNSTimeoutSeconds int
}

func LoadConfig() (*Config, error) {
	godotenv.Load()

	cfg := &Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "ticket_reservation"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
	}

	expiry, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	if err != nil {
		expiry = 24
	}
	cfg.JWTExpiry = expiry

	domainCheck, err := strconv.ParseBool(getEnv("EMAIL_DOMAIN_CHECK", "true"))
	if err != nil {
		domainCheck = true
	}
	cfg.EmailDomainCheck = domainCheck
	cfg.EmailAllowedDomains = parseCSV(getEnv("EMAIL_ALLOWED_DOMAINS", ""))

	dnsTimeout, err := strconv.Atoi(getEnv("EMAIL_DNS_TIMEOUT_SECONDS", "4"))
	if err != nil || dnsTimeout < 1 {
		dnsTimeout = 4
	}
	cfg.EmailDNSTimeoutSeconds = dnsTimeout

	return cfg, nil
}

func parseCSV(value string) []string {
	items := make([]string, 0)
	for _, item := range strings.Split(value, ",") {
		item = strings.ToLower(strings.TrimSpace(item))
		if item != "" {
			items = append(items, item)
		}
	}
	return items
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

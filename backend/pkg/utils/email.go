package utils

import (
	"context"
	"errors"
	"net"
	"net/mail"
	"regexp"
	"strings"
	"sync"
	"time"
)

var (
	localPartPattern   = regexp.MustCompile(`^[a-z0-9.!#$%&'*+/=?^_{|}~-]+$`)
	domainLabelPattern = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)
)

type emailDomainCacheEntry struct {
	valid     bool
	expiresAt time.Time
}

// EmailValidator validates the mailbox syntax and, when enabled, verifies that
// its domain can receive mail. DNS results are cached to keep registration fast.
type EmailValidator struct {
	checkDomain    bool
	allowedDomains []string
	timeout        time.Duration
	resolver       *net.Resolver
	mu             sync.RWMutex
	cache          map[string]emailDomainCacheEntry
}

func NewEmailValidator(checkDomain bool, allowedDomains []string, timeout time.Duration) *EmailValidator {
	if timeout <= 0 {
		timeout = 4 * time.Second
	}
	normalizedAllowedDomains := make([]string, 0, len(allowedDomains))
	for _, domain := range allowedDomains {
		domain = strings.ToLower(strings.TrimSpace(domain))
		if domain != "" {
			normalizedAllowedDomains = append(normalizedAllowedDomains, domain)
		}
	}
	return &EmailValidator{
		checkDomain:    checkDomain,
		allowedDomains: normalizedAllowedDomains,
		timeout:        timeout,
		resolver:       net.DefaultResolver,
		cache:          make(map[string]emailDomainCacheEntry),
	}
}

func (v *EmailValidator) Validate(ctx context.Context, rawEmail string) (string, error) {
	email, domain, err := NormalizeAndValidateEmail(rawEmail)
	if err != nil {
		return "", err
	}

	if !v.isAllowedDomain(domain) {
		return "", errors.New("دامنه این ایمیل برای ثبت‌نام مجاز نیست")
	}
	if !v.checkDomain {
		return email, nil
	}
	if valid, found := v.cachedDomainResult(domain); found {
		if valid {
			return email, nil
		}
		return "", errors.New("دامنه ایمیل معتبر نیست یا امکان دریافت ایمیل ندارد")
	}

	lookupContext, cancel := context.WithTimeout(ctx, v.timeout)
	defer cancel()

	mxRecords, mxErr := v.resolver.LookupMX(lookupContext, domain)
	for _, record := range mxRecords {
		if strings.TrimSpace(record.Host) != "." {
			v.cacheDomainResult(domain, true)
			return email, nil
		}
	}
	if mxErr == nil && len(mxRecords) > 0 {
		// A sole null MX (".") explicitly states that the domain accepts no mail.
		v.cacheDomainResult(domain, false)
		return "", errors.New("دامنه ایمیل امکان دریافت ایمیل ندارد")
	}

	// RFC 5321 allows delivery to a domain address record when no MX exists.
	ipRecords, ipErr := v.resolver.LookupIPAddr(lookupContext, domain)
	if ipErr == nil && len(ipRecords) > 0 {
		v.cacheDomainResult(domain, true)
		return email, nil
	}

	if lookupContext.Err() != nil || isTemporaryDNSError(mxErr) || isTemporaryDNSError(ipErr) {
		return "", errors.New("در حال حاضر امکان بررسی دامنه ایمیل وجود ندارد؛ دوباره تلاش کنید")
	}

	v.cacheDomainResult(domain, false)
	return "", errors.New("دامنه ایمیل معتبر نیست یا امکان دریافت ایمیل ندارد")
}

func NormalizeAndValidateEmail(rawEmail string) (string, string, error) {
	email := strings.ToLower(strings.TrimSpace(rawEmail))
	if len(email) < 3 || len(email) > 254 || strings.Count(email, "@") != 1 {
		return "", "", errors.New("ساختار ایمیل معتبر نیست")
	}

	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Name != "" || parsed.Address != email {
		return "", "", errors.New("ساختار ایمیل معتبر نیست")
	}

	parts := strings.SplitN(email, "@", 2)
	localPart, domain := parts[0], parts[1]
	if len(localPart) == 0 || len(localPart) > 64 ||
		strings.HasPrefix(localPart, ".") || strings.HasSuffix(localPart, ".") ||
		strings.Contains(localPart, "..") || !localPartPattern.MatchString(localPart) {
		return "", "", errors.New("ساختار ایمیل معتبر نیست")
	}

	if len(domain) > 253 || strings.Contains(domain, "..") || net.ParseIP(domain) != nil {
		return "", "", errors.New("دامنه ایمیل معتبر نیست")
	}
	domainLabels := strings.Split(domain, ".")
	if len(domainLabels) < 2 || len(domainLabels[len(domainLabels)-1]) < 2 {
		return "", "", errors.New("دامنه ایمیل معتبر نیست")
	}
	for _, label := range domainLabels {
		if !domainLabelPattern.MatchString(label) {
			return "", "", errors.New("دامنه ایمیل معتبر نیست")
		}
	}

	return email, domain, nil
}

func (v *EmailValidator) isAllowedDomain(domain string) bool {
	if len(v.allowedDomains) == 0 {
		return true
	}
	for _, allowedDomain := range v.allowedDomains {
		if domain == allowedDomain || strings.HasSuffix(domain, "."+allowedDomain) {
			return true
		}
	}
	return false
}

func (v *EmailValidator) cachedDomainResult(domain string) (bool, bool) {
	v.mu.RLock()
	entry, found := v.cache[domain]
	v.mu.RUnlock()
	if !found || time.Now().After(entry.expiresAt) {
		return false, false
	}
	return entry.valid, true
}

func (v *EmailValidator) cacheDomainResult(domain string, valid bool) {
	ttl := 10 * time.Minute
	if !valid {
		ttl = time.Minute
	}
	v.mu.Lock()
	v.cache[domain] = emailDomainCacheEntry{valid: valid, expiresAt: time.Now().Add(ttl)}
	v.mu.Unlock()
}

func isTemporaryDNSError(err error) bool {
	var dnsErr *net.DNSError
	return errors.As(err, &dnsErr) && (dnsErr.IsTimeout || dnsErr.IsTemporary)
}

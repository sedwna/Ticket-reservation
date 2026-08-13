package utils

import (
	"context"
	"testing"
	"time"
)

func TestNormalizeAndValidateEmail(t *testing.T) {
	tests := []struct {
		name       string
		input      string
		wantEmail  string
		wantDomain string
		wantError  bool
	}{
		{name: "normalizes a valid address", input: " User.Name+tag@Student.BASU.AC.IR ", wantEmail: "user.name+tag@student.basu.ac.ir", wantDomain: "student.basu.ac.ir"},
		{name: "missing at sign", input: "user.example.com", wantError: true},
		{name: "double dot in local part", input: "user..name@example.com", wantError: true},
		{name: "leading local dot", input: ".user@example.com", wantError: true},
		{name: "single label domain", input: "user@localhost", wantError: true},
		{name: "domain label starts with dash", input: "user@-example.com", wantError: true},
		{name: "display name is rejected", input: "User <user@example.com>", wantError: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			email, domain, err := NormalizeAndValidateEmail(test.input)
			if test.wantError {
				if err == nil {
					t.Fatalf("expected an error, got email %q", email)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if email != test.wantEmail || domain != test.wantDomain {
				t.Fatalf("got (%q, %q), want (%q, %q)", email, domain, test.wantEmail, test.wantDomain)
			}
		})
	}
}

func TestEmailValidatorAllowedDomains(t *testing.T) {
	validator := NewEmailValidator(false, []string{"gmail.com"}, time.Second)

	if email, err := validator.Validate(context.Background(), " User.Name+tag@GMAIL.COM "); err != nil {
		t.Fatalf("expected gmail.com to be allowed: %v", err)
	} else if email != "user.name+tag@gmail.com" {
		t.Fatalf("unexpected normalized email: %q", email)
	}
	if _, err := validator.Validate(context.Background(), "user@example.com"); err == nil {
		t.Fatal("expected an unlisted domain to be rejected")
	}
	if _, err := validator.Validate(context.Background(), "user@mail.gmail.com"); err == nil {
		t.Fatal("expected a gmail.com subdomain to be rejected")
	}
}

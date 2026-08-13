package utils

import "testing"

func TestNormalizeAndValidateStudentID(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		want      string
		wantError bool
	}{
		{name: "ten digits", input: "4012345678", want: "4012345678"},
		{name: "trims whitespace", input: "  401234567890  ", want: "401234567890"},
		{name: "too short", input: "401234567", wantError: true},
		{name: "letters are rejected", input: "401234567A", wantError: true},
		{name: "symbols are rejected", input: "40123-45678", wantError: true},
		{name: "more than database limit", input: "123456789012345678901", wantError: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			studentID, err := NormalizeAndValidateStudentID(test.input)
			if test.wantError {
				if err == nil {
					t.Fatalf("expected an error, got %q", studentID)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if studentID != test.want {
				t.Fatalf("got %q, want %q", studentID, test.want)
			}
		})
	}
}

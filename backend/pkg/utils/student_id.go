package utils

import (
	"errors"
	"regexp"
	"strings"
)

var studentIDPattern = regexp.MustCompile(`^[0-9]{10,20}$`)

// NormalizeAndValidateStudentID trims the value and requires 10 to 20 ASCII digits.
// The upper bound matches the users.student_id database column.
func NormalizeAndValidateStudentID(rawStudentID string) (string, error) {
	studentID := strings.TrimSpace(rawStudentID)
	if !studentIDPattern.MatchString(studentID) {
		return "", errors.New("شماره دانشجویی باید فقط عدد و حداقل ۱۰ رقم باشد")
	}

	return studentID, nil
}

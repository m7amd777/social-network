package utils

import (
	"errors"
	"regexp"
	"strings"
	"time"
	"unicode"
)

// ValidationError holds multiple validation errors
type ValidationError struct {
	Fields map[string]string `json:"fields"`
}

func (v *ValidationError) Error() string {
	return "validation failed"
}

func (v *ValidationError) HasErrors() bool {
	return len(v.Fields) > 0
}

func (v *ValidationError) AddError(field, message string) {
	if v.Fields == nil {
		v.Fields = make(map[string]string)
	}
	v.Fields[field] = message
}

// NewValidationError creates a new ValidationError
func NewValidationError() *ValidationError {
	return &ValidationError{
		Fields: make(map[string]string),
	}
}

// ValidateEmail checks if email is valid format
func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return errors.New("email is required")
	}

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return errors.New("invalid email format")
	}

	return nil
}

// ValidatePassword checks password strength
// Requirements: min 6 chars, at least 1 letter and 1 number
func ValidatePassword(password string) error {
	if password == "" {
		return errors.New("password is required")
	}

	if len(password) < 6 {
		return errors.New("password must be at least 6 characters")
	}

	var hasLetter, hasNumber bool
	for _, char := range password {
		if unicode.IsLetter(char) {
			hasLetter = true
		}
		if unicode.IsDigit(char) {
			hasNumber = true
		}
	}

	if !hasLetter {
		return errors.New("password must contain at least one letter")
	}

	if !hasNumber {
		return errors.New("password must contain at least one number")
	}

	return nil
}

// ValidateName checks if name is valid (2-50 characters)
func ValidateName(name, fieldName string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New(fieldName + " is required")
	}

	if len(name) < 2 {
		return errors.New(fieldName + " must be at least 2 characters")
	}

	if len(name) > 50 {
		return errors.New(fieldName + " must be at most 50 characters")
	}

	return nil
}

// ValidateDateOfBirth checks if DOB is valid and user is 13+
func ValidateDateOfBirth(dob string) error {
	dob = strings.TrimSpace(dob)
	if dob == "" {
		return errors.New("date of birth is required")
	}

	parsedDate, err := time.Parse("2006-01-02", dob)
	if err != nil {
		return errors.New("invalid date format (use YYYY-MM-DD)")
	}

	now := time.Now()
	age := now.Year() - parsedDate.Year()

	if now.YearDay() < parsedDate.YearDay() {
		age--
	}

	if age < 13 {
		return errors.New("you must be at least 13 years old")
	}

	if age > 120 {
		return errors.New("invalid date of birth")
	}

	return nil
}

// ValidateNickname checks nickname (optional, 2-30 chars if provided)
func ValidateNickname(nickname string) error {
	nickname = strings.TrimSpace(nickname)
	if nickname == "" {
		return nil
	}

	if len(nickname) < 2 {
		return errors.New("nickname must be at least 2 characters")
	}

	if len(nickname) > 30 {
		return errors.New("nickname must be at most 30 characters")
	}

	return nil
}

// ValidateAboutMe checks about me text (optional, max 500 chars)
func ValidateAboutMe(aboutMe string) error {
	if len(aboutMe) > 500 {
		return errors.New("about me must be at most 500 characters")
	}
	return nil
}

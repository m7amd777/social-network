package utils

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

var (
	ErrInvalidBase64Format = errors.New("invalid base64 image format")
	ErrImageTooSmall       = errors.New("image is too small (minimum 1KB)")
	ErrImageTooLarge       = errors.New("image is too large (maximum 5MB)")
	ErrInvalidImageType    = errors.New("invalid image type (only JPEG, PNG, GIF are allowed)")
)

const (
	MinImageSize = 1024            // 1KB
	MaxImageSize = 5 * 1024 * 1024 // 5MB
)

// ValidateImageBase64 decodes a dataURI and checks its size, MIME type, and magic numbers.
func ValidateImageBase64(dataURI string) error {
	if dataURI == "" {
		return nil // No image provided is usually valid, up to the caller to enforce if required
	}

	// data:image/jpeg;base64,...
	parts := strings.SplitN(dataURI, ",", 2)
	if len(parts) != 2 {
		return ErrInvalidBase64Format
	}

	header := parts[0]
	// Basic string check before actual decoding
	if !strings.HasPrefix(header, "data:image/") || !strings.HasSuffix(header, ";base64") {
		return ErrInvalidBase64Format
	}

	base64Data := parts[1]

	// Check estimated size before decoding to save memory
	// Base64 string length is ~4/3 of the decoded size
	estimatedSize := (len(base64Data) * 3) / 4
	if estimatedSize < MinImageSize {
		return ErrImageTooSmall
	}
	if estimatedSize > MaxImageSize+(MaxImageSize/10) { // add 10% tolerance for estimation
		return ErrImageTooLarge
	}

	// Decode base64
	decoded, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return ErrInvalidBase64Format
	}

	// Exact size check
	if len(decoded) < MinImageSize {
		return ErrImageTooSmall
	}
	if len(decoded) > MaxImageSize {
		return ErrImageTooLarge
	}

	// Extract first 512 bytes (or less) to determine content type via magic numbers
	snippet := decoded
	if len(snippet) > 512 {
		snippet = snippet[:512]
	}

	contentType := http.DetectContentType(snippet)

	// Validate allowed types based on header
	switch contentType {
	case "image/jpeg", "image/png", "image/gif":
		return nil
	default:
		return fmt.Errorf("%w: detected %s", ErrInvalidImageType, contentType)
	}
}

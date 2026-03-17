package utils

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	UploadDir = "uploads"
)

// ImageType represents the type of image being stored
type ImageType string

const (
	ImageTypeAvatar  ImageType = "avatars"
	ImageTypePost    ImageType = "posts"
	ImageTypeGroup   ImageType = "groups"
	ImageTypeComment ImageType = "comments"
)

// SaveImageFromBase64 decodes a base64 data URI, saves it to the filesystem,
// and returns the relative URL path to access the image.
// Returns empty string if dataURI is empty.
func SaveImageFromBase64(dataURI string, imageType ImageType) (string, error) {
	if dataURI == "" {
		return "", nil
	}

	// Validate the image first
	if err := ValidateImageBase64(dataURI); err != nil {
		return "", err
	}

	// Parse the data URI: data:image/jpeg;base64,...
	parts := strings.SplitN(dataURI, ",", 2)
	if len(parts) != 2 {
		return "", ErrInvalidBase64Format
	}

	header := parts[0]
	base64Data := parts[1]

	// Extract MIME type from header
	mimeType := extractMimeType(header)
	ext := mimeTypeToExtension(mimeType)

	// Decode base64 data
	decoded, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", ErrInvalidBase64Format
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// Create directory structure
	dir := filepath.Join(UploadDir, string(imageType))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Full file path
	filePath := filepath.Join(dir, filename)

	// Write file
	if err := os.WriteFile(filePath, decoded, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %w", err)
	}

	// Return the URL path (not filesystem path)
	urlPath := fmt.Sprintf("/uploads/%s/%s", imageType, filename)
	return urlPath, nil
}

// DeleteImage removes an image file from the filesystem
func DeleteImage(urlPath string) error {
	if urlPath == "" {
		return nil
	}

	// Convert URL path to filesystem path
	// /uploads/avatars/abc.jpg -> uploads/avatars/abc.jpg
	filePath := strings.TrimPrefix(urlPath, "/")

	// Check if file exists before deleting
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to delete
	}

	return os.Remove(filePath)
}

// IsBase64Image checks if the string is a base64 data URI
func IsBase64Image(s string) bool {
	return strings.HasPrefix(s, "data:image/")
}

// extractMimeType extracts the MIME type from a data URI header
// e.g., "data:image/jpeg;base64" -> "image/jpeg"
func extractMimeType(header string) string {
	// Remove "data:" prefix
	header = strings.TrimPrefix(header, "data:")
	// Remove ";base64" suffix
	header = strings.TrimSuffix(header, ";base64")
	return header
}

// mimeTypeToExtension converts MIME type to file extension
func mimeTypeToExtension(mimeType string) string {
	switch mimeType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	default:
		return ".jpg" // default to jpg
	}
}

// GetMimeTypeFromPath returns the MIME type based on file extension
func GetMimeTypeFromPath(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		// Try to detect from file content
		data, err := os.ReadFile(path)
		if err != nil {
			return "application/octet-stream"
		}
		return http.DetectContentType(data[:512])
	}
}

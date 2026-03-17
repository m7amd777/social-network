package services

import (
	"context"
	"database/sql"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"social-network/internal/utils"
	"strings"
	"time"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email is already registered")
	ErrUserNotFound       = errors.New("user not found")
	ErrSessionNotFound    = errors.New("session not found")
)

// Session duration (1 day)
const SessionDuration = 24 * time.Hour

type AuthService struct {
	authRepo    *repositories.AuthRepo
	sessionRepo *repositories.SessionRepo
}

func NewAuthService(authRepo *repositories.AuthRepo, sessionRepo *repositories.SessionRepo) *AuthService {
	return &AuthService{
		authRepo:    authRepo,
		sessionRepo: sessionRepo,
	}
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	// 1. Validate input
	validationErr := s.validateRegisterRequest(req)
	if validationErr.HasErrors() {
		return nil, validationErr
	}

	// 2. Normalize email
	email := strings.TrimSpace(strings.ToLower(req.Email))

	// 3. Check if email already exists
	exists, err := s.authRepo.EmailExists(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailTaken
	}

	// 4. Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 5. Save avatar to filesystem if provided
	avatarPath := ""
	if strings.TrimSpace(req.Avatar) != "" {
		avatarPath, err = utils.SaveImageFromBase64(strings.TrimSpace(req.Avatar), utils.ImageTypeAvatar)
		if err != nil {
			return nil, err
		}
	}

	// 6. Create user
	user := &models.User{
		Email:        email,
		PasswordHash: passwordHash,
		FirstName:    strings.TrimSpace(req.FirstName),
		LastName:     strings.TrimSpace(req.LastName),
		DateOfBirth:  req.DateOfBirth,
		Avatar:       avatarPath,
		Nickname:     strings.TrimSpace(req.Nickname),
		AboutMe:      strings.TrimSpace(req.AboutMe),
		IsPrivate:    false,
	}

	// 7. Save to database
	err = s.authRepo.CreateUser(ctx, user)
	if err != nil {
		// Clean up avatar file if user creation fails
		if avatarPath != "" {
			_ = utils.DeleteImage(avatarPath)
		}
		return nil, err
	}

	return user, nil
}

// Login authenticates a user and creates a session
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.User, *models.Session, error) {
	// 1. Validate input
	validationErr := s.validateLoginRequest(req)
	if validationErr.HasErrors() {
		return nil, nil, validationErr
	}

	// 2. Normalize email
	email := strings.TrimSpace(strings.ToLower(req.Email))

	// 3. Find user by email
	user, err := s.authRepo.GetUserByEmail(ctx, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	// 4. Check password
	err = utils.CheckPassword(req.Password, user.PasswordHash)
	if err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	// 5. Delete existing sessions (enforce single active session)
	if err := s.sessionRepo.DeleteUserSessions(ctx, user.ID); err != nil {
		return nil, nil, err
	}

	// 6. Create session
	session, err := s.sessionRepo.CreateSession(ctx, user.ID, SessionDuration)
	if err != nil {
		return nil, nil, err
	}

	return user, session, nil
}

// Logout destroys a session
func (s *AuthService) Logout(ctx context.Context, sessionID string) error {
	return s.sessionRepo.DeleteSession(ctx, sessionID)
}

// GetUserBySession retrieves user from session ID
func (s *AuthService) GetUserBySession(ctx context.Context, sessionID string) (*models.User, error) {
	session, err := s.sessionRepo.GetSession(ctx, sessionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}

	user, err := s.authRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// GetUserByID retrieves user by ID
func (s *AuthService) GetUserByID(ctx context.Context, userID int64) (*models.User, error) {
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

// UpdateProfile updates user profile
func (s *AuthService) UpdateProfile(ctx context.Context, userID int64, req *models.UpdateProfileRequest) (*models.User, error) {
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.FirstName != nil {
		if err := utils.ValidateName(*req.FirstName, "first name"); err != nil {
			ve := utils.NewValidationError()
			ve.AddError("firstName", err.Error())
			return nil, ve
		}
		user.FirstName = strings.TrimSpace(*req.FirstName)
	}

	if req.LastName != nil {
		if err := utils.ValidateName(*req.LastName, "last name"); err != nil {
			ve := utils.NewValidationError()
			ve.AddError("lastName", err.Error())
			return nil, ve
		}
		user.LastName = strings.TrimSpace(*req.LastName)
	}

	if req.DateOfBirth != nil {
		if err := utils.ValidateDateOfBirth(*req.DateOfBirth); err != nil {
			ve := utils.NewValidationError()
			ve.AddError("dateOfBirth", err.Error())
			return nil, ve
		}
		user.DateOfBirth = *req.DateOfBirth
	}

	if req.Nickname != nil {
		if err := utils.ValidateNickname(*req.Nickname); err != nil {
			ve := utils.NewValidationError()
			ve.AddError("nickname", err.Error())
			return nil, ve
		}
		user.Nickname = strings.TrimSpace(*req.Nickname)
	}

	if req.AboutMe != nil {
		if err := utils.ValidateAboutMe(*req.AboutMe); err != nil {
			ve := utils.NewValidationError()
			ve.AddError("aboutMe", err.Error())
			return nil, ve
		}
		user.AboutMe = strings.TrimSpace(*req.AboutMe)
	}

	if req.Avatar != nil && strings.TrimSpace(*req.Avatar) != "" {
		// Check if it's a base64 image (new upload) vs existing path
		avatarData := strings.TrimSpace(*req.Avatar)
		if utils.IsBase64Image(avatarData) {
			// Save new avatar to filesystem - SaveImageFromBase64 validates internally
			newAvatarPath, err := utils.SaveImageFromBase64(avatarData, utils.ImageTypeAvatar)
			if err != nil {
				ve := utils.NewValidationError()
				ve.AddError("avatar", err.Error())
				return nil, ve
			}
			// Delete old avatar if exists
			if user.Avatar != "" {
				_ = utils.DeleteImage(user.Avatar)
			}
			user.Avatar = newAvatarPath
		}
		// If not base64, keep existing path (no change)
	} else if req.Avatar != nil {
		// Clear avatar - delete old file
		if user.Avatar != "" {
			_ = utils.DeleteImage(user.Avatar)
		}
		user.Avatar = ""
	}

	err = s.authRepo.UpdateUser(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// UpdatePrivacy toggles user privacy setting
func (s *AuthService) UpdatePrivacy(ctx context.Context, userID int64, isPrivate bool) error {
	return s.authRepo.UpdatePrivacy(ctx, userID, isPrivate)
}

// Validation helpers

func (s *AuthService) validateRegisterRequest(req *models.RegisterRequest) *utils.ValidationError {
	ve := utils.NewValidationError()

	if err := utils.ValidateEmail(req.Email); err != nil {
		ve.AddError("email", err.Error())
	}

	if err := utils.ValidatePassword(req.Password); err != nil {
		ve.AddError("password", err.Error())
	}

	if err := utils.ValidateName(req.FirstName, "first name"); err != nil {
		ve.AddError("firstName", err.Error())
	}

	if err := utils.ValidateName(req.LastName, "last name"); err != nil {
		ve.AddError("lastName", err.Error())
	}

	if err := utils.ValidateDateOfBirth(req.DateOfBirth); err != nil {
		ve.AddError("dateOfBirth", err.Error())
	}

	if err := utils.ValidateNickname(req.Nickname); err != nil {
		ve.AddError("nickname", err.Error())
	}

	if err := utils.ValidateAboutMe(req.AboutMe); err != nil {
		ve.AddError("aboutMe", err.Error())
	}

	// Note: Avatar validation happens during SaveImageFromBase64 in Register()

	return ve
}

func (s *AuthService) validateLoginRequest(req *models.LoginRequest) *utils.ValidationError {
	ve := utils.NewValidationError()

	if strings.TrimSpace(req.Email) == "" {
		ve.AddError("email", "email is required")
	}

	if req.Password == "" {
		ve.AddError("password", "password is required")
	}

	return ve
}

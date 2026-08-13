package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/config"
	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/repository"
	"ticket-reservation-system/pkg/utils"
)

type AuthService struct {
	userRepo       *repository.UserRepository
	config         *config.Config
	emailValidator *utils.EmailValidator
}

const registrationEmailDomain = "gmail.com"

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		config:   cfg,
		emailValidator: utils.NewEmailValidator(
			cfg.EmailDomainCheck,
			[]string{registrationEmailDomain},
			time.Duration(cfg.EmailDNSTimeoutSeconds)*time.Second,
		),
	}
}

func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.UserResponse, error) {
	studentID, err := utils.NormalizeAndValidateStudentID(req.StudentID)
	if err != nil {
		return nil, err
	}
	req.StudentID = studentID

	normalizedEmail, err := s.emailValidator.Validate(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	req.Email = normalizedEmail

	// Check if email already exists
	existingUser, _ := s.userRepo.FindByEmail(req.Email)
	if existingUser != nil {
		return nil, errors.New("این ایمیل قبلاً ثبت شده است")
	}

	// Check if student ID already exists
	existingUser, _ = s.userRepo.FindByStudentID(req.StudentID)
	if existingUser != nil {
		return nil, errors.New("این شماره دانشجویی قبلاً ثبت شده است")
	}

	user := &models.User{
		StudentID: req.StudentID,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Role:      "USER",
		IsActive:  true,
	}

	if err := user.SetPassword(req.Password); err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	response := user.ToResponse()
	return &response, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (string, *models.UserResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, errors.New("ایمیل یا رمز عبور اشتباه است")
		}
		return "", nil, fmt.Errorf("failed to find user: %w", err)
	}

	if !user.IsActive {
		return "", nil, errors.New("حساب کاربری شما غیرفعال شده است")
	}

	if !user.CheckPassword(req.Password) {
		return "", nil, errors.New("ایمیل یا رمز عبور اشتباه است")
	}

	fullName := user.FirstName + " " + user.LastName
	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, fullName, s.config.JWTSecret, s.config.JWTExpiry)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	response := user.ToResponse()
	return token, &response, nil
}

func (s *AuthService) ChangePassword(userID uuid.UUID, req *models.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("کاربر یافت نشد")
	}

	if !user.CheckPassword(req.OldPassword) {
		return errors.New("رمز عبور فعلی اشتباه است")
	}

	if err := user.SetPassword(req.NewPassword); err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	return s.userRepo.Update(user)
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

type UpdateProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *UpdateProfileRequest) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("کاربر یافت نشد")
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Email != "" {
		normalizedEmail, validationErr := s.emailValidator.Validate(ctx, req.Email)
		if validationErr != nil {
			return nil, validationErr
		}
		if normalizedEmail != user.Email {
			existing, _ := s.userRepo.FindByEmail(normalizedEmail)
			if existing != nil {
				return nil, errors.New("این ایمیل قبلاً استفاده شده است")
			}
			user.Email = normalizedEmail
		}
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return user, nil
}

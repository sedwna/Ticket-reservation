package services

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/repository"
)

type AdminUserService struct {
	userRepo      *repository.UserRepository
	auditLogRepo  *repository.AuditLogRepository
	reservationRepo *repository.ReservationRepository
}

func NewAdminUserService(userRepo *repository.UserRepository, auditLogRepo *repository.AuditLogRepository,
	reservationRepo *repository.ReservationRepository) *AdminUserService {
	return &AdminUserService{
		userRepo:      userRepo,
		auditLogRepo:  auditLogRepo,
		reservationRepo: reservationRepo,
	}
}

type UserDetail struct {
	models.UserResponse
	ReservationCount int64 `json:"reservation_count"`
}

func (s *AdminUserService) GetAllUsers() ([]UserDetail, error) {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	details := make([]UserDetail, 0, len(users))
	for _, u := range users {
		count, _ := s.reservationRepo.CountByUser(u.ID)
		details = append(details, UserDetail{
			UserResponse:     u.ToResponse(),
			ReservationCount: count,
		})
	}

	return details, nil
}

func (s *AdminUserService) ToggleUserStatus(userID uuid.UUID, adminID uuid.UUID) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("کاربر یافت نشد")
	}

	// Don't allow self-deactivation
	if user.ID == adminID {
		return errors.New("نمی‌توانید حساب کاربری خود را غیرفعال کنید")
	}

	if err := s.userRepo.ToggleStatus(userID); err != nil {
		return fmt.Errorf("failed to toggle user status: %w", err)
	}

	details, _ := json.Marshal(map[string]interface{}{
		"user_id": userID,
		"action":  "toggle_status",
	})
	s.auditLogRepo.Create(&models.AuditLog{
		AdminID:    adminID,
		Action:     models.ActionToggleUser,
		TargetID:   &userID,
		TargetType: "USER",
		Details:    details,
	})

	return nil
}

func (s *AdminUserService) ChangeUserRole(userID uuid.UUID, role string, adminID uuid.UUID) error {
	if role != "ADMIN" && role != "USER" {
		return errors.New("نقش نامعتبر است")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("کاربر یافت نشد")
	}

	// Don't allow self-role change
	if user.ID == adminID {
		return errors.New("نمی‌توانید نقش خود را تغییر دهید")
	}

	// Inactive accounts must be activated before receiving admin privileges.
	// Demoting an already-invalid inactive admin remains allowed so the state can be repaired.
	if role == "ADMIN" && user.Role != "ADMIN" && !user.IsActive {
		return errors.New("کاربر غیرفعال نمی‌تواند مدیر شود؛ ابتدا حساب کاربر را فعال کنید")
	}

	if err := s.userRepo.ChangeRole(userID, role); err != nil {
		return fmt.Errorf("failed to change role: %w", err)
	}

	details, _ := json.Marshal(map[string]interface{}{
		"user_id":  userID,
		"new_role": role,
	})
	s.auditLogRepo.Create(&models.AuditLog{
		AdminID:    adminID,
		Action:     models.ActionChangeRole,
		TargetID:   &userID,
		TargetType: "USER",
		Details:    details,
	})

	return nil
}

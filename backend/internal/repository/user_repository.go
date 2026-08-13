package repository

import (
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/internal/models"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	err := r.db.Where("LOWER(email) = ?", normalizedEmail).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByStudentID(studentID string) (*models.User, error) {
	var user models.User
	err := r.db.Where("student_id = ?", studentID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Order("created_at DESC").Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}

func (r *UserRepository) ToggleStatus(id uuid.UUID) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("is_active", gorm.Expr("NOT is_active")).Error
}

func (r *UserRepository) ChangeRole(id uuid.UUID, role string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("role", role).Error
}

func (r *UserRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

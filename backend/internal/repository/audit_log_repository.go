package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/internal/models"
)

type AuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditLogRepository) FindByAdmin(adminID uuid.UUID) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("admin_id = ?", adminID).
		Order("created_at DESC").
		Limit(50).
		Find(&logs).Error
	return logs, err
}

func (r *AuditLogRepository) FindRecent(limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Preload("Admin").
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

func (r *AuditLogRepository) FindAll() ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Preload("Admin").
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

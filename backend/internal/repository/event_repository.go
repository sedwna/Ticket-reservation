package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/internal/models"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

func (r *EventRepository) FindByID(id uuid.UUID) (*models.Event, error) {
	var event models.Event
	err := r.db.Preload("Creator").Preload("Seats").First(&event, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *EventRepository) FindAllActive() ([]models.Event, error) {
	var events []models.Event
	err := r.db.Where("status = ?", "ACTIVE").
		Where("event_date >= ?", time.Now().Format("2006-01-02")).
		Order("event_date ASC").
		Preload("Creator").
		Find(&events).Error
	return events, err
}

func (r *EventRepository) FindAll(filters map[string]interface{}) ([]models.Event, error) {
	var events []models.Event
	query := r.db.Preload("Creator")

	if status, ok := filters["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if dateFrom, ok := filters["date_from"]; ok && dateFrom != "" {
		query = query.Where("event_date >= ?", dateFrom)
	}
	if dateTo, ok := filters["date_to"]; ok && dateTo != "" {
		query = query.Where("event_date <= ?", dateTo)
	}
	if search, ok := filters["search"]; ok && search != "" {
		query = query.Where("title ILIKE ?", "%"+search.(string)+"%")
	}

	err := query.Order("event_date DESC").Find(&events).Error
	return events, err
}

func (r *EventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

func (r *EventRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Event{}, "id = ?", id).Error
}

func (r *EventRepository) CountActive() (int64, error) {
	var count int64
	err := r.db.Model(&models.Event{}).Where("status = ?", "ACTIVE").
		Where("event_date >= ?", time.Now().Format("2006-01-02")).
		Count(&count).Error
	return count, err
}

func (r *EventRepository) CountThisWeek() (int64, error) {
	var count int64
	now := time.Now()
	weekEnd := now.AddDate(0, 0, 7)
	err := r.db.Model(&models.Event{}).
		Where("event_date BETWEEN ? AND ?", now.Format("2006-01-02"), weekEnd.Format("2006-01-02")).
		Count(&count).Error
	return count, err
}

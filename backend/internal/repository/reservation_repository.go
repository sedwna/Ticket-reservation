package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/internal/models"
)

type ReservationRepository struct {
	db *gorm.DB
}

func NewReservationRepository(db *gorm.DB) *ReservationRepository {
	return &ReservationRepository{db: db}
}

func (r *ReservationRepository) Create(tx *gorm.DB, reservation *models.Reservation) error {
	return tx.Create(reservation).Error
}

func (r *ReservationRepository) FindByID(id uuid.UUID) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.Preload("User").Preload("Event").Preload("Seat").
		First(&reservation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

func (r *ReservationRepository) FindByUserID(userID uuid.UUID) ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.Where("user_id = ?", userID).
		Preload("Event").
		Preload("Seat").
		Order("reserved_at DESC").
		Find(&reservations).Error
	return reservations, err
}

func (r *ReservationRepository) FindActiveByUser(userID uuid.UUID) ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.Where("user_id = ? AND status = ?", userID, "ACTIVE").
		Preload("Event").
		Preload("Seat").
		Order("reserved_at DESC").
		Find(&reservations).Error
	return reservations, err
}

func (r *ReservationRepository) FindHistoryByUser(userID uuid.UUID) ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.Where("user_id = ? AND (status = ? OR status = ?)", userID, "CANCELLED", "COMPLETED").
		Preload("Event").
		Preload("Seat").
		Order("cancelled_at DESC").
		Find(&reservations).Error
	return reservations, err
}

func (r *ReservationRepository) FindByEventID(eventID uuid.UUID) ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.Where("event_id = ?", eventID).
		Preload("User").Preload("Seat").
		Order("reserved_at DESC").
		Find(&reservations).Error
	return reservations, err
}

func (r *ReservationRepository) FindActiveByUserAndEvent(userID, eventID uuid.UUID) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.Where("user_id = ? AND event_id = ? AND status = ?", userID, eventID, "ACTIVE").
		First(&reservation).Error
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

func (r *ReservationRepository) FindAll(filters map[string]interface{}) ([]models.Reservation, error) {
	var reservations []models.Reservation
	query := r.db.Preload("User").Preload("Event").Preload("Seat")

	if eventIDs, ok := filters["event_ids"].([]uuid.UUID); ok && len(eventIDs) > 0 {
		query = query.Where("event_id IN ?", eventIDs)
	} else if eventID, ok := filters["event_id"]; ok && eventID != "" {
		query = query.Where("event_id = ?", eventID)
	}
	if dateFrom, ok := filters["date_from"]; ok && dateFrom != "" {
		query = query.Where("reserved_at >= ?", dateFrom)
	}
	if dateTo, ok := filters["date_to"]; ok && dateTo != "" {
		dateToString, isString := dateTo.(string)
		if parsedDate, err := time.Parse("2006-01-02", dateToString); isString && err == nil {
			query = query.Where("reserved_at < ?", parsedDate.AddDate(0, 0, 1).Format("2006-01-02"))
		} else {
			query = query.Where("reserved_at <= ?", dateTo)
		}
	}
	if status, ok := filters["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("reserved_at DESC").Find(&reservations).Error
	return reservations, err
}

func (r *ReservationRepository) UpdateStatus(tx *gorm.DB, id uuid.UUID, status string) error {
	return tx.Model(&models.Reservation{}).Where("id = ?", id).
		Update("status", status).Error
}

func (r *ReservationRepository) SetCancelled(tx *gorm.DB, id uuid.UUID) error {
	now := time.Now()
	return tx.Model(&models.Reservation{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       "CANCELLED",
			"cancelled_at": &now,
		}).Error
}

func (r *ReservationRepository) CountByEvent(eventID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("event_id = ? AND status IN ?", eventID, []string{"ACTIVE", "COMPLETED"}).
		Count(&count).Error
	return count, err
}

func (r *ReservationRepository) CountToday() (int64, error) {
	var count int64
	today := time.Now().Format("2006-01-02")
	err := r.db.Model(&models.Reservation{}).
		Where("DATE(reserved_at) = ?", today).
		Count(&count).Error
	return count, err
}

func (r *ReservationRepository) GetReservationTrend(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	startDate := time.Now().AddDate(0, 0, -days).Format("2006-01-02")

	err := r.db.Model(&models.Reservation{}).
		Select("DATE(reserved_at) as date, COUNT(*) as count").
		Where("reserved_at >= ?", startDate).
		Group("DATE(reserved_at)").
		Order("date ASC").
		Find(&results).Error
	return results, err
}

func (r *ReservationRepository) CountByUser(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("user_id = ? AND status = ?", userID, "ACTIVE").
		Count(&count).Error
	return count, err
}

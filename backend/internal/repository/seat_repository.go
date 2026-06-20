package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"ticket-reservation-system/internal/models"
)

type SeatRepository struct {
	db *gorm.DB
}

func NewSeatRepository(db *gorm.DB) *SeatRepository {
	return &SeatRepository{db: db}
}

func (r *SeatRepository) Create(seat *models.Seat) error {
	return r.db.Create(seat).Error
}

func (r *SeatRepository) BatchCreate(seats []models.Seat) error {
	return r.db.CreateInBatches(seats, 50).Error
}

func (r *SeatRepository) FindByEventID(eventID uuid.UUID) ([]models.Seat, error) {
	var seats []models.Seat
	err := r.db.Where("event_id = ?", eventID).
		Order("row_number ASC, seat_number ASC").
		Find(&seats).Error
	return seats, err
}

func (r *SeatRepository) FindByID(id uuid.UUID) (*models.Seat, error) {
	var seat models.Seat
	err := r.db.First(&seat, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &seat, nil
}

func (r *SeatRepository) FindByIDForUpdate(tx *gorm.DB, id uuid.UUID) (*models.Seat, error) {
	var seat models.Seat
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("id = ? AND status = ?", id, "AVAILABLE").
		First(&seat).Error
	if err != nil {
		return nil, err
	}
	return &seat, nil
}

func (r *SeatRepository) UpdateStatus(tx *gorm.DB, id uuid.UUID, status string) error {
	return tx.Model(&models.Seat{}).Where("id = ?", id).Update("status", status).Error
}

func (r *SeatRepository) CountAvailableByEvent(eventID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Seat{}).
		Where("event_id = ? AND status = ?", eventID, "AVAILABLE").
		Count(&count).Error
	return count, err
}

func (r *SeatRepository) CountReservedByEvent(eventID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Seat{}).
		Where("event_id = ? AND status = ?", eventID, "RESERVED").
		Count(&count).Error
	return count, err
}

func (r *SeatRepository) DeleteByEventID(eventID uuid.UUID) error {
	return r.db.Where("event_id = ?", eventID).Delete(&models.Seat{}).Error
}

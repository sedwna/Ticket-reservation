package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/repository"
)

type ReservationService struct {
	db                *gorm.DB
	reservationRepo   *repository.ReservationRepository
	seatRepo          *repository.SeatRepository
	eventRepo         *repository.EventRepository
}

func NewReservationService(db *gorm.DB, reservationRepo *repository.ReservationRepository,
	seatRepo *repository.SeatRepository, eventRepo *repository.EventRepository) *ReservationService {
	return &ReservationService{
		db:              db,
		reservationRepo: reservationRepo,
		seatRepo:        seatRepo,
		eventRepo:       eventRepo,
	}
}

func (s *ReservationService) CreateReservation(userID, eventID, seatID uuid.UUID) (*models.ReservationResponse, error) {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Lock the seat row to prevent race conditions (SELECT FOR UPDATE)
	var seat models.Seat
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("id = ? AND status = ?", seatID, "AVAILABLE").
		First(&seat).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("این صندلی در دسترس نیست")
		}
		return nil, fmt.Errorf("failed to lock seat: %w", err)
	}

	// Verify event exists and is active
	var event models.Event
	if err := tx.First(&event, "id = ?", eventID).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("رویداد یافت نشد")
	}
	if event.Status != "ACTIVE" {
		tx.Rollback()
		return nil, errors.New("این رویداد فعال نیست")
	}

	// Check user hasn't already reserved in this event
	var existingCount int64
	if err := tx.Model(&models.Reservation{}).
		Where("user_id = ? AND event_id = ? AND status = ?", userID, eventID, "ACTIVE").
		Count(&existingCount).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to check existing reservation: %w", err)
	}
	if existingCount > 0 {
		tx.Rollback()
		return nil, errors.New("شما قبلاً در این رویداد رزرو داشته‌اید")
	}

	// Update seat status to RESERVED
	if err := tx.Model(&seat).Update("status", "RESERVED").Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update seat: %w", err)
	}

	// Create the reservation record
	reservation := &models.Reservation{
		UserID:     userID,
		EventID:    eventID,
		SeatID:     seatID,
		Status:     "ACTIVE",
		ReservedAt: time.Now(),
	}

	if err := tx.Create(reservation).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create reservation: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Build response
	response := &models.ReservationResponse{
		ID:         reservation.ID,
		UserID:     reservation.UserID,
		EventID:    reservation.EventID,
		SeatID:     reservation.SeatID,
		Status:     reservation.Status,
		ReservedAt: reservation.ReservedAt.Format(time.RFC3339),
		EventTitle: event.Title,
		EventDate:  event.EventDate.Format("2006-01-02"),
		StartTime:  event.StartTime,
		EndTime:    event.EndTime,
		SeatLabel:  seat.SeatLabel,
		RowNumber:  seat.RowNumber,
		SeatNumber: seat.SeatNumber,
	}

	return response, nil
}

func (s *ReservationService) GetUserReservations(userID uuid.UUID) ([]models.ReservationResponse, error) {
	reservations, err := s.reservationRepo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch reservations: %w", err)
	}

	responses := make([]models.ReservationResponse, 0, len(reservations))
	for _, r := range reservations {
		resp := s.toReservationResponse(&r)
		responses = append(responses, resp)
	}

	return responses, nil
}

func (s *ReservationService) GetActiveReservations(userID uuid.UUID) ([]models.ReservationResponse, error) {
	reservations, err := s.reservationRepo.FindActiveByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch active reservations: %w", err)
	}

	responses := make([]models.ReservationResponse, 0, len(reservations))
	for _, r := range reservations {
		resp := s.toReservationResponse(&r)
		responses = append(responses, resp)
	}

	return responses, nil
}

func (s *ReservationService) GetReservationHistory(userID uuid.UUID) ([]models.ReservationResponse, error) {
	reservations, err := s.reservationRepo.FindHistoryByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch reservation history: %w", err)
	}

	responses := make([]models.ReservationResponse, 0, len(reservations))
	for _, r := range reservations {
		resp := s.toReservationResponse(&r)
		responses = append(responses, resp)
	}

	return responses, nil
}

func (s *ReservationService) CancelReservation(reservationID, userID uuid.UUID) error {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find the reservation
	var reservation models.Reservation
	if err := tx.First(&reservation, "id = ?", reservationID).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("رزرو یافت نشد")
		}
		return fmt.Errorf("failed to find reservation: %w", err)
	}

	// Check ownership
	if reservation.UserID != userID {
		tx.Rollback()
		return errors.New("شما مجاز به لغو این رزرو نیستید")
	}

	// Check if already cancelled
	if reservation.Status != "ACTIVE" {
		tx.Rollback()
		return errors.New("این رزرو قبلاً لغو شده است")
	}

	// Mark reservation as cancelled
	now := time.Now()
	if err := tx.Model(&reservation).Updates(map[string]interface{}{
		"status":       "CANCELLED",
		"cancelled_at": &now,
	}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to cancel reservation: %w", err)
	}

	// Free up the seat
	if err := tx.Model(&models.Seat{}).Where("id = ?", reservation.SeatID).
		Update("status", "AVAILABLE").Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to free seat: %w", err)
	}

	return tx.Commit().Error
}

func (s *ReservationService) GetAllReservations(filters map[string]interface{}) ([]models.ReservationResponse, error) {
	reservations, err := s.reservationRepo.FindAll(filters)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch reservations: %w", err)
	}

	responses := make([]models.ReservationResponse, 0, len(reservations))
	for _, r := range reservations {
		resp := s.toReservationResponse(&r)
		responses = append(responses, resp)
	}

	return responses, nil
}

func (s *ReservationService) toReservationResponse(r *models.Reservation) models.ReservationResponse {
	resp := models.ReservationResponse{
		ID:         r.ID,
		UserID:     r.UserID,
		EventID:    r.EventID,
		SeatID:     r.SeatID,
		Status:     r.Status,
		ReservedAt: r.ReservedAt.Format(time.RFC3339),
	}

	if r.CancelledAt != nil {
		cancelled := r.CancelledAt.Format(time.RFC3339)
		resp.CancelledAt = &cancelled
	}

	if r.Event.Title != "" {
		resp.EventTitle = r.Event.Title
		resp.EventDate = r.Event.EventDate.Format("2006-01-02")
		resp.StartTime = r.Event.StartTime
		resp.EndTime = r.Event.EndTime
	}

	if r.Seat.SeatLabel != "" {
		resp.SeatLabel = r.Seat.SeatLabel
		resp.RowNumber = r.Seat.RowNumber
		resp.SeatNumber = r.Seat.SeatNumber
	}

	if r.User.FirstName != "" {
		resp.UserFullName = r.User.FirstName + " " + r.User.LastName
		resp.UserStudentID = r.User.StudentID
	}

	return resp
}

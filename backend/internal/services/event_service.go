package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/repository"
)

type EventService struct {
	db              *gorm.DB
	eventRepo       *repository.EventRepository
	seatRepo        *repository.SeatRepository
	reservationRepo *repository.ReservationRepository
	auditLogRepo    *repository.AuditLogRepository
}

func NewEventService(db *gorm.DB, eventRepo *repository.EventRepository, seatRepo *repository.SeatRepository,
	reservationRepo *repository.ReservationRepository, auditLogRepo *repository.AuditLogRepository) *EventService {
	return &EventService{
		db:              db,
		eventRepo:       eventRepo,
		seatRepo:        seatRepo,
		reservationRepo: reservationRepo,
		auditLogRepo:    auditLogRepo,
	}
}

func (s *EventService) GetActiveEvents() ([]models.EventListResponse, error) {
	events, err := s.eventRepo.FindAllActive()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch events: %w", err)
	}

	responses := make([]models.EventListResponse, 0, len(events))
	for _, event := range events {
		reservedCount, _ := s.reservationRepo.CountByEvent(event.ID)
		availableCount := event.TotalCapacity - int(reservedCount)
		occupancyRate := float64(0)
		if event.TotalCapacity > 0 {
			occupancyRate = float64(reservedCount) / float64(event.TotalCapacity) * 100
		}

		responses = append(responses, models.EventListResponse{
			ID:             event.ID,
			Title:          event.Title,
			Description:    event.Description,
			EventDate:      event.EventDate.Format("2006-01-02"),
			StartTime:      event.StartTime,
			EndTime:        event.EndTime,
			TotalCapacity:  event.TotalCapacity,
			PosterURL:      event.PosterURL,
			Status:         event.Status,
			ReservedCount:  int(reservedCount),
			AvailableCount: availableCount,
			OccupancyRate:  occupancyRate,
		})
	}

	return responses, nil
}

func (s *EventService) GetEventByID(id uuid.UUID) (*models.Event, error) {
	event, err := s.eventRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("رویداد یافت نشد")
		}
		return nil, fmt.Errorf("failed to fetch event: %w", err)
	}
	return event, nil
}

func (s *EventService) GetSeatMap(eventID uuid.UUID, userID uuid.UUID) (*models.SeatMapResponse, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("رویداد یافت نشد")
		}
		return nil, fmt.Errorf("failed to fetch event: %w", err)
	}

	seats, err := s.seatRepo.FindByEventID(eventID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch seats: %w", err)
	}

	rows := make(map[int][]models.SeatResponse)
	availableCount := 0
	reservedCount := 0

	for _, seat := range seats {
		seatResp := models.SeatResponse{
			ID:         seat.ID,
			EventID:    seat.EventID,
			RowNumber:  seat.RowNumber,
			SeatNumber: seat.SeatNumber,
			SeatLabel:  seat.SeatLabel,
			SeatType:   seat.SeatType,
			Status:     seat.Status,
		}

		if seat.Status == "RESERVED" {
			reservedCount++
			var reservation models.Reservation
			s.db.Where("seat_id = ? AND event_id = ? AND status = ?", seat.ID, eventID, "ACTIVE").
				First(&reservation)
			if reservation.UserID == userID {
				seatResp.Status = "RESERVED_BY_USER"
			}
		} else {
			availableCount++
		}

		rows[seat.RowNumber] = append(rows[seat.RowNumber], seatResp)
	}

	return &models.SeatMapResponse{
		EventID:        eventID,
		EventTitle:     event.Title,
		PosterURL:      event.PosterURL,
		TotalCapacity:  event.TotalCapacity,
		AvailableSeats: availableCount,
		ReservedSeats:  reservedCount,
		Rows:           rows,
	}, nil
}

func (s *EventService) CreateEvent(req *models.CreateEventRequest, adminID uuid.UUID) (*models.Event, error) {
	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, errors.New("فرمت تاریخ نامعتبر است")
	}

	event := &models.Event{
		Title:         req.Title,
		Description:   req.Description,
		EventDate:     eventDate,
		StartTime:     req.StartTime,
		EndTime:       req.EndTime,
		TotalCapacity: req.TotalCapacity,
		PosterURL:     req.PosterURL,
		CreatedBy:     adminID,
		Status:        "ACTIVE",
	}

	tx := s.db.Begin()

	if err := tx.Create(event).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	// Generate seats based on row_config or legacy rows/seats_per_row
	seats := make([]models.Seat, 0, req.TotalCapacity)
	seatCount := 0
	rowLabel := 0

	if len(req.RowConfig) > 0 {
		// Per-row customized configuration
		for _, rc := range req.RowConfig {
			rowLabel++
			rowLetter := string(rune('A' + rowLabel - 1))
			seatType := rc.SeatType
			if seatType == "" {
				seatType = "REGULAR"
			}
			for seatNum := 1; seatNum <= rc.Seats && seatCount < req.TotalCapacity; seatNum++ {
				label := fmt.Sprintf("%s%d", rowLetter, seatNum)
				seats = append(seats, models.Seat{
					EventID:    event.ID,
					RowNumber:  rowLabel,
					SeatNumber: seatNum,
					SeatLabel:  label,
					SeatType:   seatType,
					Status:     "AVAILABLE",
				})
				seatCount++
			}
		}
	} else {
		// Legacy uniform layout
		rows := req.Rows
		seatsPerRow := req.SeatsPerRow
		if rows == 0 || seatsPerRow == 0 {
			rows = max(1, req.TotalCapacity/10)
			seatsPerRow = req.TotalCapacity / rows
		}
		for row := 1; row <= rows && seatCount < req.TotalCapacity; row++ {
			rowLetter := string(rune('A' + row - 1))
			for seatNum := 1; seatNum <= seatsPerRow && seatCount < req.TotalCapacity; seatNum++ {
				label := fmt.Sprintf("%s%d", rowLetter, seatNum)
				seats = append(seats, models.Seat{
					EventID:    event.ID,
					RowNumber:  row,
					SeatNumber: seatNum,
					SeatLabel:  label,
					SeatType:   "REGULAR",
					Status:     "AVAILABLE",
				})
				seatCount++
			}
		}
	}

	if err := tx.CreateInBatches(seats, 50).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create seats: %w", err)
	}

	details, _ := json.Marshal(map[string]interface{}{
		"title":          event.Title,
		"total_capacity": event.TotalCapacity,
		"event_date":     event.EventDate,
	})
	s.auditLogRepo.Create(&models.AuditLog{
		AdminID:    adminID,
		Action:     models.ActionCreateEvent,
		TargetID:   &event.ID,
		TargetType: "EVENT",
		Details:    details,
	})

	tx.Commit()

	return event, nil
}

func (s *EventService) UpdateEvent(eventID uuid.UUID, req *models.UpdateEventRequest, adminID uuid.UUID) (*models.Event, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, errors.New("رویداد یافت نشد")
	}

	if req.Title != "" {
		event.Title = req.Title
	}
	if req.Description != "" {
		event.Description = req.Description
	}
	if req.EventDate != "" {
		eventDate, err := time.Parse("2006-01-02", req.EventDate)
		if err != nil {
			return nil, errors.New("فرمت تاریخ نامعتبر است")
		}
		event.EventDate = eventDate
	}
	if req.StartTime != "" {
		event.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		event.EndTime = req.EndTime
	}
	if req.TotalCapacity > 0 {
		event.TotalCapacity = req.TotalCapacity
	}
	if req.PosterURL != "" {
		event.PosterURL = req.PosterURL
	}
	if req.Status != "" {
		validStatuses := map[string]bool{"ACTIVE": true, "CANCELLED": true, "COMPLETED": true, "CLOSED": true}
		if validStatuses[req.Status] {
			event.Status = req.Status
		}
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}

	details, _ := json.Marshal(map[string]interface{}{
		"title": event.Title,
	})
	s.auditLogRepo.Create(&models.AuditLog{
		AdminID:    adminID,
		Action:     models.ActionUpdateEvent,
		TargetID:   &event.ID,
		TargetType: "EVENT",
		Details:    details,
	})

	return event, nil
}

func (s *EventService) DeleteEvent(eventID uuid.UUID, adminID uuid.UUID) error {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return errors.New("رویداد یافت نشد")
	}

	details, _ := json.Marshal(map[string]interface{}{
		"title": event.Title,
	})
	s.auditLogRepo.Create(&models.AuditLog{
		AdminID:    adminID,
		Action:     models.ActionDeleteEvent,
		TargetID:   &event.ID,
		TargetType: "EVENT",
		Details:    details,
	})

	return s.eventRepo.Delete(eventID)
}

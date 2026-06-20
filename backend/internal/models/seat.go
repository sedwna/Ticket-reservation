package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Seat struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EventID    uuid.UUID `gorm:"type:uuid;not null;index" json:"event_id"`
	RowNumber  int       `gorm:"not null" json:"row_number"`
	SeatNumber int       `gorm:"not null" json:"seat_number"`
	SeatLabel  string    `gorm:"type:varchar(10);not null" json:"seat_label"`
	SeatType   string    `gorm:"type:varchar(10);default:REGULAR;check:seat_type IN ('REGULAR','VIP')" json:"seat_type"`
	Status     string    `gorm:"type:varchar(10);default:AVAILABLE;check:status IN ('AVAILABLE','RESERVED')" json:"status"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	Event        Event         `gorm:"foreignKey:EventID" json:"-"`
	Reservations []Reservation `gorm:"foreignKey:SeatID" json:"-"`
}

func (s *Seat) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.Status == "" {
		s.Status = "AVAILABLE"
	}
	if s.SeatType == "" {
		s.SeatType = "REGULAR"
	}
	return nil
}

type SeatResponse struct {
	ID         uuid.UUID  `json:"id"`
	EventID    uuid.UUID  `json:"event_id"`
	RowNumber  int        `json:"row_number"`
	SeatNumber int        `json:"seat_number"`
	SeatLabel  string     `json:"seat_label"`
	SeatType   string     `json:"seat_type"`
	Status     string     `json:"status"`
	ReservedBy *uuid.UUID `json:"reserved_by,omitempty"`
}

type SeatMapResponse struct {
	EventID        uuid.UUID                 `json:"event_id"`
	EventTitle     string                    `json:"event_title"`
	PosterURL      string                    `json:"poster_url"`
	TotalCapacity  int                       `json:"total_capacity"`
	AvailableSeats int                       `json:"available_seats"`
	ReservedSeats  int                       `json:"reserved_seats"`
	Rows           map[int][]SeatResponse    `json:"rows"`
}

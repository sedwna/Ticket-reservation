package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Event struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title         string     `gorm:"type:varchar(200);not null" json:"title"`
	Description   string     `gorm:"type:text" json:"description"`
	EventDate     time.Time  `gorm:"type:date;not null" json:"event_date"`
	StartTime     string     `gorm:"type:varchar(5);not null" json:"start_time"`
	EndTime       string     `gorm:"type:varchar(5);not null" json:"end_time"`
	TotalCapacity int        `gorm:"not null;check:total_capacity > 0" json:"total_capacity"`
	PosterURL     string     `gorm:"type:varchar(500)" json:"poster_url"`
	Status        string     `gorm:"type:varchar(20);default:ACTIVE;check:status IN ('ACTIVE','CANCELLED','COMPLETED','CLOSED')" json:"status"`
	CreatedBy     uuid.UUID  `gorm:"type:uuid;not null" json:"created_by"`
	Creator       User       `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	// Relations
	Seats        []Seat        `gorm:"foreignKey:EventID" json:"seats,omitempty"`
	Reservations []Reservation `gorm:"foreignKey:EventID" json:"reservations,omitempty"`
}

func (e *Event) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	if e.Status == "" {
		e.Status = "ACTIVE"
	}
	return nil
}

type EventResponse struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	EventDate      string    `json:"event_date"`
	StartTime      string    `json:"start_time"`
	EndTime        string    `json:"end_time"`
	TotalCapacity  int       `json:"total_capacity"`
	PosterURL      string    `json:"poster_url"`
	Status         string    `json:"status"`
	CreatedBy      uuid.UUID `json:"created_by"`
	CreatedAt      string    `json:"created_at"`
	ReservedCount  int       `json:"reserved_count"`
	AvailableCount int       `json:"available_count"`
	OccupancyRate  float64   `json:"occupancy_rate"`
}

type EventListResponse struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	EventDate      string    `json:"event_date"`
	StartTime      string    `json:"start_time"`
	EndTime        string    `json:"end_time"`
	TotalCapacity  int       `json:"total_capacity"`
	PosterURL      string    `json:"poster_url"`
	Status         string    `json:"status"`
	ReservedCount  int       `json:"reserved_count"`
	AvailableCount int       `json:"available_count"`
	OccupancyRate  float64   `json:"occupancy_rate"`
}

// RowConfig defines per-row customization
type RowConfig struct {
	RowNumber int    `json:"row_number"`
	Seats     int    `json:"seats"`
	SeatType  string `json:"seat_type"` // REGULAR, VIP
}

// DTOs
type CreateEventRequest struct {
	Title         string      `json:"title" binding:"required"`
	Description   string      `json:"description"`
	EventDate     string      `json:"event_date" binding:"required"`
	StartTime     string      `json:"start_time" binding:"required"`
	EndTime       string      `json:"end_time" binding:"required"`
	TotalCapacity int         `json:"total_capacity" binding:"required,min=1"`
	PosterURL     string      `json:"poster_url"`
	Rows          int         `json:"rows"`        // legacy: uniform rows
	SeatsPerRow   int         `json:"seats_per_row"` // legacy: uniform seats per row
	RowConfig     []RowConfig `json:"row_config"`  // new: per-row customization
}

type UpdateEventRequest struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	EventDate     string `json:"event_date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	TotalCapacity int    `json:"total_capacity"`
	PosterURL     string `json:"poster_url"`
	Status        string `json:"status"`
}

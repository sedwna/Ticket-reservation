package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Reservation struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	EventID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"event_id"`
	SeatID      uuid.UUID  `gorm:"type:uuid;not null" json:"seat_id"`
	Status      string     `gorm:"type:varchar(10);default:ACTIVE;check:status IN ('ACTIVE','CANCELLED','COMPLETED')" json:"status"`
	ReservedAt  time.Time  `gorm:"not null" json:"reserved_at"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`

	// Relations
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Event Event `gorm:"foreignKey:EventID" json:"event,omitempty"`
	Seat  Seat  `gorm:"foreignKey:SeatID" json:"seat,omitempty"`
}

func (r *Reservation) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if r.Status == "" {
		r.Status = "ACTIVE"
	}
	return nil
}

type ReservationResponse struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	EventID       uuid.UUID `json:"event_id"`
	SeatID        uuid.UUID `json:"seat_id"`
	Status        string    `json:"status"`
	ReservedAt    string    `json:"reserved_at"`
	CancelledAt   *string   `json:"cancelled_at,omitempty"`
	EventTitle    string    `json:"event_title"`
	EventDate     string    `json:"event_date"`
	StartTime     string    `json:"start_time"`
	EndTime       string    `json:"end_time"`
	SeatLabel     string    `json:"seat_label"`
	RowNumber     int       `json:"row_number"`
	SeatNumber    int       `json:"seat_number"`
	UserFullName  string    `json:"user_full_name,omitempty"`
	UserStudentID string    `json:"user_student_id,omitempty"`
}

type CreateReservationRequest struct {
	EventID string `json:"event_id" binding:"required"`
	SeatID  string `json:"seat_id" binding:"required"`
}

package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID         uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	AdminID    uuid.UUID       `gorm:"type:uuid;not null;index" json:"admin_id"`
	Action     string          `gorm:"type:varchar(50);not null" json:"action"`
	TargetID   *uuid.UUID      `gorm:"type:uuid" json:"target_id,omitempty"`
	TargetType string          `gorm:"type:varchar(50)" json:"target_type"`
	Details    json.RawMessage `gorm:"type:jsonb" json:"details,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`

	// Relation
	Admin User `gorm:"foreignKey:AdminID" json:"admin,omitempty"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// Action constants
const (
	ActionCreateEvent = "CREATE_EVENT"
	ActionUpdateEvent = "UPDATE_EVENT"
	ActionDeleteEvent = "DELETE_EVENT"
	ActionToggleUser  = "TOGGLE_USER"
	ActionChangeRole  = "CHANGE_ROLE"
)

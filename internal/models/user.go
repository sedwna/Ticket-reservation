package models

import "time"

type User struct {
	ID           int64
	Name         string
	Phone        string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
}

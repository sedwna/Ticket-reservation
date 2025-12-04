package models

import "time"

type Ticket struct {
	ID        int64     `db:"id" json:"id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	Title     string    `db:"title" json:"title"`
	Date      string    `db:"date" json:"date"`
	Status    string    `db:"status" json:"status"` // "pending", "confirmed", "canceled"
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

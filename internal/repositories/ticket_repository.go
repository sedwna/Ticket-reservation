package repositories

import (
	"database/sql"
	"github.com/sedwna/Ticket-reservation/internal/models"
)

type TicketRepository struct {
	DB *sql.DB
}

func NewTicketRepository(db *sql.DB) *TicketRepository {
	return &TicketRepository{DB: db}
}

func (r *TicketRepository) GetTicketsByUser(userID int64) ([]models.Ticket, error) {
	rows, err := r.DB.Query("SELECT id, user_id, title, date, status, created_at FROM tickets WHERE user_id=$1", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []models.Ticket
	for rows.Next() {
		var t models.Ticket
		if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Date, &t.Status, &t.CreatedAt); err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

func (r *TicketRepository) CreateTicket(t *models.Ticket) error {
	return r.DB.QueryRow(
		"INSERT INTO tickets (user_id, title, date, status, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id",
		t.UserID, t.Title, t.Date, t.Status, t.CreatedAt,
	).Scan(&t.ID)
}

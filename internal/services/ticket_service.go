package services

import (
	"github.com/sedwna/Ticket-reservation/internal/models"
	"github.com/sedwna/Ticket-reservation/internal/repositories"
	"time"
)

type TicketService struct {
	Repo *repositories.TicketRepository
}

func NewTicketService(repo *repositories.TicketRepository) *TicketService {
	return &TicketService{Repo: repo}
}

func (s *TicketService) GetTicketsByUser(userID int64) ([]models.Ticket, error) {
	return s.Repo.GetTicketsByUser(userID)
}

func (s *TicketService) CreateTicket(userID int64, title, date string) (*models.Ticket, error) {
	t := &models.Ticket{
		UserID:    userID,
		Title:     title,
		Date:      date,
		Status:    "pending",
		CreatedAt: time.Now(),
	}
	if err := s.Repo.CreateTicket(t); err != nil {
		return nil, err
	}
	return t, nil
}

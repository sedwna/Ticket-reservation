package services

import (
    "github.com/sedwna/Ticket-reservation/internal/models"
    "github.com/sedwna/Ticket-reservation/internal/repositories"
)

type UserService struct {
    Repo *repositories.UserRepository
}

func NewUserService(repo *repositories.UserRepository) *UserService {
    return &UserService{Repo: repo}
}

func (s *UserService) GetAllUsers() ([]models.User, error) {
    return s.Repo.GetAllUsers()
}
func (s *UserService) GetUserByID(id int64) (*models.User, error) {
	return s.Repo.GetByID(id)
}
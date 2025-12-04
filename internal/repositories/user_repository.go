package repositories

import (
    "database/sql"
    "github.com/sedwna/Ticket-reservation/internal/models"
)

type UserRepository struct {
    DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
    return &UserRepository{DB: db}
}

// گرفتن همه کاربران
func (r *UserRepository) GetAllUsers() ([]models.User, error) {
    rows, err := r.DB.Query("SELECT id, name, phone, password_hash, role, created_at FROM users")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    users := []models.User{}
    for rows.Next() {
        var u models.User
        err := rows.Scan(&u.ID, &u.Name, &u.Phone, &u.PasswordHash, &u.Role, &u.CreatedAt)
        if err != nil {
            return nil, err
        }
        users = append(users, u)
    }
    return users, nil
}

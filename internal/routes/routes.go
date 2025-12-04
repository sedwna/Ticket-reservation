package routes

import (
    "database/sql"
    "github.com/sedwna/Ticket-reservation/internal/handlers"
    "github.com/sedwna/Ticket-reservation/internal/repositories"
    "github.com/sedwna/Ticket-reservation/internal/services"

    "github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB) {
    // Repository و Service
    userRepo := repositories.NewUserRepository(db)
    userService := services.NewUserService(userRepo)
    userHandler := handlers.NewUserHandler(userService)

    // مسیر GET /api/users
    r.GET("/api/users", userHandler.GetAllUsers)
}

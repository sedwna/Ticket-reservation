package routes

import (
    "database/sql"
    "github.com/sedwna/Ticket-reservation/internal/handlers"
    "github.com/sedwna/Ticket-reservation/internal/repositories"
    "github.com/sedwna/Ticket-reservation/internal/services"
	"github.com/sedwna/Ticket-reservation/internal/middleware"


    "github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB) {
	// Users
	userRepo := repositories.NewUserRepository(db)
	userService := services.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(userService)

	// Tickets
	ticketRepo := repositories.NewTicketRepository(db)
	ticketService := services.NewTicketService(ticketRepo)
	ticketHandler := handlers.NewTicketHandler(ticketService)

	// Middleware JWT
	authMiddleware := middleware.JWTAuth()

	// Users
	userRoutes := r.Group("/api")
	userRoutes.Use(authMiddleware)
	{
		userRoutes.GET("/users", userHandler.GetAllUsers)
		userRoutes.GET("/users/:id", userHandler.GetUserByID)
	}

	// Tickets
	ticketRoutes := r.Group("/api")
	ticketRoutes.Use(authMiddleware)
	{
		ticketRoutes.GET("/tickets", ticketHandler.GetTickets)
		ticketRoutes.POST("/tickets", ticketHandler.CreateTicket)
	}
}

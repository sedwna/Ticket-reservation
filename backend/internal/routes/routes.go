package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ticket-reservation-system/config"
	"ticket-reservation-system/internal/handlers"
	"ticket-reservation-system/internal/middleware"
	"ticket-reservation-system/internal/repository"
	"ticket-reservation-system/internal/services"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	seatRepo := repository.NewSeatRepository(db)
	reservationRepo := repository.NewReservationRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	eventService := services.NewEventService(db, eventRepo, seatRepo, reservationRepo, auditLogRepo)
	reservationService := services.NewReservationService(db, reservationRepo, seatRepo, eventRepo)
	reportService := services.NewReportService(eventRepo, reservationRepo, seatRepo, userRepo)
	adminUserService := services.NewAdminUserService(userRepo, auditLogRepo, reservationRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	eventHandler := handlers.NewEventHandler(eventService)
	reservationHandler := handlers.NewReservationHandler(reservationService)
	adminHandler := handlers.NewAdminHandler(adminUserService)
	reportHandler := handlers.NewReportHandler(reportService)
	uploadHandler := handlers.NewUploadHandler("uploads")

	// Serve uploaded files statically
	r.Static("/uploads", "./uploads")

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "ticket-reservation-system"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Public routes
		v1.GET("/public/stats", reportHandler.GetPublicStats)

		// Public auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Auth (authenticated)
			protected.POST("/auth/logout", authHandler.Logout)
			protected.PUT("/auth/change-password", authHandler.ChangePassword)
			protected.GET("/auth/profile", authHandler.GetProfile)
			protected.PUT("/auth/profile", authHandler.UpdateProfile)

			// Events (authenticated users)
			protected.GET("/events", eventHandler.GetActiveEvents)
			protected.GET("/events/:id", eventHandler.GetEventByID)
			protected.GET("/events/:id/seats", eventHandler.GetSeatMap)

			// Reservations (authenticated users)
			protected.POST("/reservations", reservationHandler.CreateReservation)
			protected.GET("/reservations/my", reservationHandler.GetMyReservations)
			protected.DELETE("/reservations/:id", reservationHandler.CancelReservation)
		}

		// Admin routes (require admin role)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		admin.Use(middleware.AdminMiddleware())
		{
			// Event management
			admin.GET("/events", eventHandler.GetAllEvents)
			admin.POST("/events", eventHandler.CreateEvent)
			admin.PUT("/events/:id", eventHandler.UpdateEvent)
			admin.DELETE("/events/:id", eventHandler.DeleteEvent)

			// Poster upload
			admin.POST("/upload/poster", uploadHandler.UploadPoster)

			// Reservation management
			admin.GET("/reservations", reservationHandler.GetAllReservations)

			// User management
			admin.GET("/users", adminHandler.GetAllUsers)
			admin.PUT("/users/:id/toggle-status", adminHandler.ToggleUserStatus)
			admin.PUT("/users/:id/change-role", adminHandler.ChangeUserRole)

			// Reports
			admin.GET("/reports/stats", reportHandler.GetDashboardStats)
			admin.GET("/reports/events/:id", reportHandler.GetEventReport)
			admin.GET("/reports/occupancy", reportHandler.GetOccupancyReport)
			admin.GET("/reports/export", reportHandler.ExportCSV)
		}
	}
}

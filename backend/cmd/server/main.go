package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"ticket-reservation-system/config"
	"ticket-reservation-system/internal/middleware"
	"ticket-reservation-system/internal/routes"
	"ticket-reservation-system/pkg/database"
)

// @title Ticket Reservation System API
// @version 5.7.1
// @description API for Seat Reservation System - Bu-Ali Sina University Amphitheater
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Printf("Warning: Could not connect to database: %v", err)
		log.Println("App will start without database — some features may not work")
		os.Exit(1)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed the optional demo administrator only in explicit demo mode.
	if cfg.DemoMode {
		if err := database.SeedAdmin(db, cfg); err != nil {
			log.Fatalf("Failed to seed demo admin user: %v", err)
		}
	}

	// Setup Gin router
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = "debug"
	}
	gin.SetMode(ginMode)

	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.CORSMiddleware(cfg.CORSAllowedOrigins))

	// Setup routes
	routes.SetupRoutes(r, db, cfg)

	// Start server
	port := cfg.ServerPort
	log.Printf("Server starting on port %s", port)
	log.Printf("Health check: http://localhost:%s/health", port)
	log.Printf("API base: http://localhost:%s/api/v1", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

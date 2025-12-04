package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sedwna/Ticket-reservation/internal/db"
	"github.com/sedwna/Ticket-reservation/internal/handlers"
	"github.com/sedwna/Ticket-reservation/internal/routes"
)

func main() {
	// بارگذاری فایل .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// اتصال به دیتابیس
	dbConn, err := db.NewDBFromEnv()
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	// ایجاد سرور Gin
	r := gin.Default()

	// ثبت مسیرهای Auth (Register/Login)
	handlers.RegisterAuthRoutes(r, dbConn)

	// ثبت مسیرهای Users و Tickets
	routes.RegisterRoutes(r, dbConn)

	// پورت سرور
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server running on port:", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}

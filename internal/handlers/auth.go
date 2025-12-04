package handlers

import (
	"database/sql"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func RegisterAuthRoutes(r *gin.Engine, db *sql.DB) {
	api := r.Group("/api")
	{
		api.POST("/register", register(db))
		api.POST("/login", login(db))
	}
}

func register(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name     string `json:"name"`
			Phone    string `json:"phone"`
			Password string `json:"password"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}

		hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

		_, err := db.Exec(`
			INSERT INTO users (name, phone, password_hash)
			VALUES ($1, $2, $3)
		`, req.Name, req.Phone, string(hash))

		if err != nil {
			c.JSON(409, gin.H{"error": "user already exists"})
			return
		}

		c.JSON(201, gin.H{"message": "registered successfully"})
	}
}

func login(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Phone    string `json:"phone"`
			Password string `json:"password"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid input"})
			return
		}

		var id int64
		var hash, role string

		err := db.QueryRow(`
			SELECT id, password_hash, role FROM users WHERE phone=$1
		`, req.Phone).Scan(&id, &hash, &role)

		if err != nil {
			c.JSON(401, gin.H{"error": "invalid credentials"})
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
			c.JSON(401, gin.H{"error": "invalid credentials"})
			return
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":  id,
			"role": role,
			"exp":  time.Now().Add(24 * time.Hour).Unix(),
		})

		signed, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

		c.JSON(200, gin.H{"token": signed})
	}
}

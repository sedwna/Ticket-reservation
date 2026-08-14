package middleware

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
)

type fakeUserReader struct {
	user *models.User
	err  error
}

func (f fakeUserReader) FindByID(uuid.UUID) (*models.User, error) {
	return f.user, f.err
}

func TestAdminMiddlewareRevalidatesCurrentRoleAndStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)
	id := uuid.New()

	tests := []struct {
		name       string
		reader     fakeUserReader
		userID     any
		wantStatus int
	}{
		{
			name:       "active admin is allowed",
			reader:     fakeUserReader{user: &models.User{ID: id, Role: "ADMIN", IsActive: true}},
			userID:     id.String(),
			wantStatus: http.StatusNoContent,
		},
		{
			name:       "stale admin claim cannot bypass demotion",
			reader:     fakeUserReader{user: &models.User{ID: id, Role: "USER", IsActive: true}},
			userID:     id.String(),
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "inactive admin is denied",
			reader:     fakeUserReader{user: &models.User{ID: id, Role: "ADMIN", IsActive: false}},
			userID:     id.String(),
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "repository failure is denied",
			reader:     fakeUserReader{err: errors.New("database unavailable")},
			userID:     id.String(),
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "malformed identity is unauthorized",
			reader:     fakeUserReader{},
			userID:     "not-a-uuid",
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				c.Set("userID", tt.userID)
				c.Set("userRole", "ADMIN")
			})
			router.Use(AdminMiddleware(tt.reader))
			router.GET("/admin", func(c *gin.Context) { c.Status(http.StatusNoContent) })

			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/admin", nil))
			if response.Code != tt.wantStatus {
				t.Fatalf("status = %d; want %d", response.Code, tt.wantStatus)
			}
		})
	}
}

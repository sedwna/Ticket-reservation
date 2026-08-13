package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/services"
	"ticket-reservation-system/pkg/utils"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register godoc
// @Summary Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration data"
// @Success 201 {object} utils.APIResponse
// @Failure 400,422 {object} utils.APIResponse
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً تمام فیلدهای ضروری را پر کنید", err.Error())
		return
	}

	user, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusCreated, "ثبت‌نام با موفقیت انجام شد", user)
}

// Login godoc
// @Summary Login to the system
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} utils.APIResponse
// @Failure 401 {object} utils.APIResponse
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً ایمیل و رمز عبور را وارد کنید", err.Error())
		return
	}

	token, user, err := h.authService.Login(&req)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// Logout godoc
// @Summary Logout from the system
// @Tags auth
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// With JWT, logout is handled client-side by removing the token
	utils.SuccessMessage(c, http.StatusOK, "خروج با موفقیت انجام شد", nil)
}

// ChangePassword godoc
// @Summary Change user password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.ChangePasswordRequest true "Password change data"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/auth/change-password [put]
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً فیلدها را به درستی پر کنید", err.Error())
		return
	}

	if err := h.authService.ChangePassword(userID, &req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "رمز عبور با موفقیت تغییر کرد", nil)
}

// GetProfile returns the current user's profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		utils.NotFound(c, "کاربر یافت نشد")
		return
	}

	utils.Success(c, http.StatusOK, user.ToResponse())
}

// UpdateProfile updates the current user's profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))

	var req services.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً فیلدها را به درستی پر کنید", err.Error())
		return
	}

	user, err := h.authService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "پروفایل با موفقیت به‌روزرسانی شد", user.ToResponse())
}

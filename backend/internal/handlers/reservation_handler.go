package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/services"
	"ticket-reservation-system/pkg/utils"
)

func parseEventIDs(value string) ([]uuid.UUID, error) {
	parts := strings.Split(value, ",")
	ids := make([]uuid.UUID, 0, len(parts))
	seen := make(map[uuid.UUID]struct{}, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}

		id, err := uuid.Parse(trimmed)
		if err != nil {
			return nil, err
		}
		if _, exists := seen[id]; exists {
			continue
		}

		seen[id] = struct{}{}
		ids = append(ids, id)
	}

	return ids, nil
}

type ReservationHandler struct {
	reservationService *services.ReservationService
}

func NewReservationHandler(reservationService *services.ReservationService) *ReservationHandler {
	return &ReservationHandler{reservationService: reservationService}
}

// CreateReservation godoc
// @Summary Reserve a seat
// @Tags reservations
// @Accept json
// @Produce json
// @Param request body models.CreateReservationRequest true "Reservation data"
// @Success 201 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/reservations [post]
func (h *ReservationHandler) CreateReservation(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))

	var req models.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً فیلدها را به درستی پر کنید", err.Error())
		return
	}

	eventID, err := uuid.Parse(req.EventID)
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	seatID, err := uuid.Parse(req.SeatID)
	if err != nil {
		utils.BadRequest(c, "شناسه صندلی نامعتبر است")
		return
	}

	reservation, err := h.reservationService.CreateReservation(userID, eventID, seatID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusCreated, "رزرو با موفقیت انجام شد", reservation)
}

// GetMyReservations godoc
// @Summary Get current user's reservations
// @Tags reservations
// @Produce json
// @Param tab query string false "tab: active or history"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/reservations/my [get]
func (h *ReservationHandler) GetMyReservations(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))
	tab := c.DefaultQuery("tab", "active")

	var reservations []models.ReservationResponse
	var err error

	if tab == "history" {
		reservations, err = h.reservationService.GetReservationHistory(userID)
	} else {
		reservations, err = h.reservationService.GetActiveReservations(userID)
	}

	if err != nil {
		utils.InternalError(c, "خطا در دریافت رزروها")
		return
	}

	utils.Success(c, http.StatusOK, reservations)
}

// CancelReservation godoc
// @Summary Cancel a reservation
// @Tags reservations
// @Produce json
// @Param id path string true "Reservation ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/reservations/{id} [delete]
func (h *ReservationHandler) CancelReservation(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("userID"))

	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رزرو نامعتبر است")
		return
	}

	if err := h.reservationService.CancelReservation(reservationID, userID); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "رزرو با موفقیت لغو شد", nil)
}

// Admin: GetAllReservations
func (h *ReservationHandler) GetAllReservations(c *gin.Context) {
	filters := make(map[string]interface{})

	if eventIDsValue := c.Query("event_ids"); eventIDsValue != "" {
		eventIDs, err := parseEventIDs(eventIDsValue)
		if err != nil || len(eventIDs) == 0 {
			utils.BadRequest(c, "شناسه یکی از رویدادها نامعتبر است")
			return
		}
		filters["event_ids"] = eventIDs
	} else if eventID := c.Query("event_id"); eventID != "" {
		filters["event_id"] = eventID
	}
	if dateFrom := c.Query("date_from"); dateFrom != "" {
		filters["date_from"] = dateFrom
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		filters["date_to"] = dateTo
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	reservations, err := h.reservationService.GetAllReservations(filters)
	if err != nil {
		utils.InternalError(c, "خطا در دریافت رزروها")
		return
	}

	utils.Success(c, http.StatusOK, reservations)
}

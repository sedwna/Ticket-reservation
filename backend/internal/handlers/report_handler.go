package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/services"
	"ticket-reservation-system/pkg/utils"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

// GetPublicStats godoc
// @Summary Get public stats for landing page
// @Tags reports
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Router /api/v1/public/stats [get]
func (h *ReportHandler) GetPublicStats(c *gin.Context) {
	stats, err := h.reportService.GetPublicStats()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت آمار")
		return
	}
	utils.Success(c, http.StatusOK, stats)
}

// GetDashboardStats godoc
// @Summary Get dashboard statistics (Admin)
// @Tags reports
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/reports/stats [get]
func (h *ReportHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.reportService.GetDashboardStats()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت آمار")
		return
	}

	utils.Success(c, http.StatusOK, stats)
}

// GetEventReport godoc
// @Summary Get report for a specific event (Admin)
// @Tags reports
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/reports/events/{id} [get]
func (h *ReportHandler) GetEventReport(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	report, err := h.reportService.GetEventReport(eventID)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, report)
}

// GetOccupancyReport godoc
// @Summary Get occupancy data for charts (Admin)
// @Tags reports
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/reports/occupancy [get]
func (h *ReportHandler) GetOccupancyReport(c *gin.Context) {
	data, err := h.reportService.GetOccupancyData()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت داده‌های اشغال")
		return
	}

	utils.Success(c, http.StatusOK, data)
}

// ExportCSV godoc
// @Summary Export reservations report as CSV (Admin)
// @Tags reports
// @Produce text/csv
// @Param event_id query string false "Event ID filter"
// @Param event_ids query string false "Comma-separated event IDs filter"
// @Param date_from query string false "Start date filter"
// @Param date_to query string false "End date filter"
// @Success 200 {file} text/csv
// @Security BearerAuth
// @Router /api/v1/admin/reports/export [get]
func (h *ReportHandler) ExportCSV(c *gin.Context) {
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

	csvData, err := h.reportService.GenerateCSV(filters)
	if err != nil {
		utils.InternalError(c, "خطا در تولید فایل CSV")
		return
	}

	filename := fmt.Sprintf("reservations_report_%s.csv", time.Now().Format("2006-01-02_150405"))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", csvData)
}

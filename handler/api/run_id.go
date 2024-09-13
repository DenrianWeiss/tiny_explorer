package api

import (
	"github.com/gin-gonic/gin"
	"math/rand"
	"strconv"
)

var runId = 0

func init() {
	// Generate a random run id
	runId = rand.Int()
}

func GetRunId(c *gin.Context) {
	c.JSON(200, gin.H{
		"run_id": strconv.Itoa(runId),
	})
}

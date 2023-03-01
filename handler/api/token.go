package api

import (
	"github.com/gin-gonic/gin"
	"regexp"
	"resolver_explorer/service/db"
	"strings"
)

const tokenPrefix = "token"

type AddTokenReq struct {
	Name    string `json:"name" binding:"required"`
	Address string `json:"address" binding:"required"`
}

func AddDisplayToken(c *gin.Context) {
	req := AddTokenReq{}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}
	// Validate eth address.
	if ok, err := regexp.Match(`^0x[a-fA-F0-9]{40}$`, []byte(req.Address)); !ok || err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "invalid eth address",
		})
		return
	}

	err = db.Set(db.GetDb(), []byte(tokenPrefix+"_"+req.Address), []byte(req.Name))
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"status": "ok",
	})
}

func GetDisplayToken(c *gin.Context) {
	keys, err := db.Keys(db.GetDb(), []byte(tokenPrefix))
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}
	result := make(map[string]string)
	for _, key := range keys {
		name, err := db.Get(db.GetDb(), key)
		if err != nil {
			continue
		}
		result[string(name)] = strings.TrimPrefix(string(key), tokenPrefix+"_")
	}
	c.JSON(200, result)
}

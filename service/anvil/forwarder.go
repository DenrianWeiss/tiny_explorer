package anvil

import (
	"bytes"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"strconv"
)

func ForwardToRpc(c *gin.Context) {
	// Forward to RPC.
	/// First, get the RPC address from the request path
	port := c.Param("path")
	/// Ensure the port is integer
	_, err := strconv.ParseInt(port, 10, 64)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"status": "error",
			"detail": "port is not integer",
		})
		return
	}
	targetUrl := "http://localhost:" + port
	reqBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"detail": "read request body failed",
		})
		return
	}
	// Create a new reader from the request body
	rFlow := bytes.NewReader(reqBody)
	req, _ := http.NewRequest(c.Request.Method, targetUrl, rFlow)
	// Clone the request headers
	req.Header = c.Request.Header
	// Send the request to the target URL
	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"status": "error",
			"detail": "rpc server is down",
		})
		return
	}
	// Read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"detail": "read response body failed",
		})
		return
	}
	// Forward the response to the client
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), respBody)
	c.Next()
}

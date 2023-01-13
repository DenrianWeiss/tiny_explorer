package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"strings"
)

func SearchHandler(c *gin.Context) {
	p := c.Query("search")
	if p == "" {
		c.Redirect(http.StatusFound, "/")
		return
	} else if len(p) == 66 && strings.HasPrefix(p, "0x") {
		c.Redirect(http.StatusFound, "/tx.html?tx="+p)
		return
	} else if _, err := strconv.Atoi(p); err == nil {
		c.Redirect(http.StatusFound, "/block.html?block="+p)
		return
	} else {
		c.Data(http.StatusOK, "text/html", []byte(""+
			"<script>setTimeout(function(){window.location.href='/';}, 1000);</script>"+
			"<h1>Invalid search</h1>"+
			"<p>Redirecting to home page...</p>"))
	}
}

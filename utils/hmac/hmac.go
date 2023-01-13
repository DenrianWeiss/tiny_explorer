package hmac

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"github.com/google/uuid"
	"resolver_explorer/utils/hx"
	"strings"
)

var nonce string

func init() {
	nonce = uuid.New().String()
}

func GetNonce() string {
	return nonce
}

func SignWithNonce(s string) string {
	hmacV := hmac.New(sha256.New, []byte(GetNonce()))
	hash := hmacV.Sum([]byte(s))
	return hex.EncodeToString(hash)
}

func Validate(s, sig string) bool {
	sHash := SignWithNonce(strings.TrimRight(s, "\x00"))
	sHex := hx.HexStringToBytes(sHash)
	sigHex := hx.HexStringToBytes(sig)
	return hmac.Equal(sHex, sigHex)
}

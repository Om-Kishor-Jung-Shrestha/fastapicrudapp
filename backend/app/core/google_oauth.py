from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class GoogleOAuthClient:
    """Implements the standard OAuth2 authorization-code flow against Google.

    Flow:
      1. build_authorize_url()  -> browser redirects user to Google's consent screen
      2. Google redirects back to our callback with a `code`
      3. exchange_code_for_token(code) -> access_token
      4. fetch_userinfo(access_token) -> verified email, name, picture, google sub id
    """

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_CALLBACK_URL

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def build_authorize_url(self, state: str) -> str:
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured on the server (missing client id/secret).",
            )
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "prompt": "select_account",
            "state": state,
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    def exchange_code_for_token(self, code: str) -> str:
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        with httpx.Client(timeout=10) as client:
            resp = client.post(GOOGLE_TOKEN_URL, data=data)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code with Google",
            )
        return resp.json()["access_token"]

    def fetch_userinfo(self, access_token: str) -> dict:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch Google user profile",
            )
        return resp.json()


google_oauth_client = GoogleOAuthClient()

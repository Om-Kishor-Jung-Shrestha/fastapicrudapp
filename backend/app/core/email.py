import smtplib
import ssl
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("email")


class EmailService:
    """Sends transactional emails (OTP codes, password reset) over SMTP.

    Works with any standard SMTP provider (Gmail, SendGrid, Mailgun, SES SMTP,
    etc.) -- just set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD.
    If SMTP is not configured, emails are logged instead of sent so local
    development still works without real credentials.
    """

    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS

    def _configured(self) -> bool:
        return bool(self.user and self.password and self.from_email)

    def send(self, to_email: str, subject: str, html_body: str, text_body: str = "") -> None:
        if not self._configured():
            logger.warning(
                "SMTP not configured -- printing email instead of sending.\nTo: %s\nSubject: %s\n%s",
                to_email,
                subject,
                text_body or html_body,
            )
            return

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email

        if text_body:
            message.attach(MIMEText(text_body, "plain"))
        message.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP(self.host, self.port) as server:
            if self.use_tls:
                server.starttls(context=context)
            server.login(self.user, self.password)
            server.sendmail(self.from_email, to_email, message.as_string())

    def send_otp_email(self, to_email: str, code: str, purpose: str = "password reset") -> None:
        subject = "Your verification code"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2>Your one-time code</h2>
          <p>Use the code below to complete your {purpose}. This code expires in
             {settings.OTP_EXPIRE_MINUTES} minutes.</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                      background:#f1f5f9;padding:16px;border-radius:8px;text-align:center">
            {code}
          </div>
          <p style="color:#64748b;font-size:13px;margin-top:24px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        """
        text = f"Your verification code is {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
        self.send(to_email, subject, html, text)

    def send_welcome_email(self, to_email: str, full_name: str) -> None:
        subject = "Welcome to Product Manager"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2>Welcome, {full_name or to_email}!</h2>
          <p>Your account has been created successfully. You can now sign in and
             start managing your product catalog.</p>
        </div>
        """
        self.send(to_email, subject, html, f"Welcome {full_name}! Your account was created.")


email_service = EmailService()

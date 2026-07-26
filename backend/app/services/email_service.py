"""
Email service for AgroSense AI.

Supports four modes (EMAIL_MODE env var):
  - console:  logs emails to stdout (development)
  - smtp:     Gmail / SMTP server with app password
  - sendgrid: SendGrid HTTP API
  - resend:   Resend HTTP API
"""

import logging
import smtplib

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.core.config import get_settings


logger = logging.getLogger("agrosense.email")
settings = get_settings()


def _build_html(title: str, body: str, button_text: str, button_url: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;
                background:#0f172a;border-radius:16px;padding:32px;color:#f1f5f9">

      <h1 style="color:#22c55e;font-size:22px;margin-bottom:8px">
        🌱 AgroSense AI
      </h1>

      <h2 style="font-size:18px">{title}</h2>

      <p style="color:#94a3b8;line-height:1.6">
        {body}
      </p>

      <a href="{button_url}"
         style="display:inline-block;margin:24px 0;
         background:#22c55e;color:#ffffff;text-decoration:none;
         padding:12px 32px;border-radius:10px;font-weight:bold">

        {button_text}

      </a>

      <p style="color:#64748b;font-size:12px">
        If the button doesn't work, copy this link:
        <br>
        {button_url}
      </p>

      <p style="color:#64748b;font-size:12px">
        If you didn't request this, you can safely ignore this email.
      </p>

    </div>
    """


# -----------------------------
# Console Email
# -----------------------------

def _send_console(to_email: str, subject: str, html: str, url: str) -> bool:

    logger.info("=" * 60)
    logger.info("EMAIL (console mode) -> %s", to_email)
    logger.info("Subject: %s", subject)
    logger.info("Action link: %s", url)
    logger.info("=" * 60)

    return True



# -----------------------------
# SMTP Email
# -----------------------------

def _send_smtp(to_email: str, subject: str, html: str) -> bool:

    try:

        msg = MIMEMultipart("alternative")

        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        msg.attach(
            MIMEText(html, "html")
        )


        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=20
        ) as server:

            server.starttls()

            server.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD
            )

            server.sendmail(
                settings.SMTP_USER,
                to_email,
                msg.as_string()
            )


        logger.info(
            "SMTP email sent to %s",
            to_email
        )

        return True


    except Exception as e:

        logger.error(
            "SMTP email failed: %s",
            e
        )

        return False




# -----------------------------
# SendGrid Email
# -----------------------------

def _send_sendgrid(to_email: str, subject: str, html: str) -> bool:

    try:

        resp = httpx.post(

            "https://api.sendgrid.com/v3/mail/send",

            headers={

                "Authorization":
                    f"Bearer {settings.SENDGRID_API_KEY}",

                "Content-Type":
                    "application/json",

            },


            json={

                "personalizations":[
                    {
                        "to":[
                            {
                                "email":to_email
                            }
                        ]
                    }
                ],


                "from":{
                    "email":
                    settings.EMAIL_FROM
                },


                "subject":
                    subject,


                "content":[
                    {
                        "type":"text/html",
                        "value":html
                    }
                ]

            },

            timeout=20

        )


        if resp.status_code in (200,201,202):

            logger.info(
                "SendGrid email sent to %s",
                to_email
            )

            return True


        logger.error(
            "SendGrid failed: %s %s",
            resp.status_code,
            resp.text
        )


        return False



    except Exception as e:

        logger.error(
            "SendGrid email failed: %s",
            e
        )

        return False





# -----------------------------
# Resend Email
# -----------------------------

def _send_resend(to_email: str, subject: str, html: str) -> bool:

    try:

        response = httpx.post(

            "https://api.resend.com/emails",

            headers={

                "Authorization":
                    f"Bearer {settings.RESEND_API_KEY}",

                "Content-Type":
                    "application/json"

            },


            json={

                "from":
                    settings.EMAIL_FROM,


                "to":[
                    to_email
                ],


                "subject":
                    subject,


                "html":
                    html

            },


            timeout=20

        )


        if response.status_code in (200,201):

            logger.info(
                "Resend email sent to %s",
                to_email
            )

            return True



        logger.error(

            "Resend failed (%s): %s",

            response.status_code,

            response.text

        )


        return False



    except Exception as e:


        logger.error(
            "Resend email failed: %s",
            e
        )


        return False





# -----------------------------
# Email Router
# -----------------------------

def _send(
    to_email: str,
    subject: str,
    html: str,
    url: str
) -> bool:


    mode = settings.EMAIL_MODE.lower()


    logger.info(
        "Email mode selected: %s",
        mode
    )



    if mode == "smtp" and settings.SMTP_USER and settings.SMTP_PASSWORD:

        return _send_smtp(
            to_email,
            subject,
            html
        )



    if mode == "sendgrid" and settings.SENDGRID_API_KEY:

        return _send_sendgrid(
            to_email,
            subject,
            html
        )



    if mode == "resend" and settings.RESEND_API_KEY:

        return _send_resend(
            to_email,
            subject,
            html
        )



    return _send_console(
        to_email,
        subject,
        html,
        url
    )





# -----------------------------
# Verification Email
# -----------------------------

def send_verification_email(
    to_email: str,
    username: str,
    token: str
) -> bool:


    url = (
        f"{settings.FRONTEND_URL}/verify/{token}"
    )


    html = _build_html(

        title="Verify your AgroSense AI account",

        body=(
            f"Hi {username}, welcome to AgroSense AI! "
            "Please confirm your email address "
            "to activate your account."
        ),

        button_text="Verify Email",

        button_url=url

    )


    return _send(

        to_email,

        "Verify your AgroSense AI account",

        html,

        url

    )





# -----------------------------
# Password Reset Email
# -----------------------------

def send_password_reset_email(
    to_email: str,
    username: str,
    token: str
) -> bool:


    url = (
        f"{settings.FRONTEND_URL}/reset-password/{token}"
    )


    html = _build_html(

        title="Reset your password",

        body=(
            f"Hi {username}, we received a request "
            "to reset your AgroSense AI password. "
            "This link expires in 1 hour."
        ),

        button_text="Reset Password",

        button_url=url

    )


    return _send(

        to_email,

        "Reset your AgroSense AI password",

        html,

        url

    )
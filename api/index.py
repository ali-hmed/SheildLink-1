from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.config import settings

app = FastAPI(
    title="LinkShield API",
    description="Local static URL security analyzer with optional Google Safe Browsing reputation check.",
    version="1.0.0"
)

# CORS restricted to ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Global Request body size limit check (Max 64KB for safety)
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 65536:
        return JSONResponse(
            status_code=413,
            content={"detail": "Payload Too Large. Request body exceeds maximum allowed size (64KB)."}
        )
    return await call_next(request)

# Consistent error format without stack traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the URL."}
    )

app.include_router(router)

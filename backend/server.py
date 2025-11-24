from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import logging
import socketio

# Import database
from database import connect_to_mongo, close_mongo_connection

# Import routes
from routes import auth, barbers, services, products, bookings, reviews, favorites, subscriptions

# Import WebSocket
from ws_handler import sio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ZenChair Barber Marketplace API",
    description="Multi-tenant barber marketplace platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(barbers.router)
app.include_router(services.router)
app.include_router(products.router)
app.include_router(bookings.router)
app.include_router(reviews.router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path='/socket.io'
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    logger.info("✅ ZenChair API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    logger.info("❌ ZenChair API shutdown")

@app.get("/")
async def root():
    return {
        "message": "Welcome to ZenChair Barber Marketplace API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Export the socket_app for uvicorn
app = socket_app

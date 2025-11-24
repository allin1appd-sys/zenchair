import socketio
from typing import Dict, Set
import asyncio

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Track connected users
connected_users: Dict[str, str] = {}  # {user_id: sid}
barber_subscriptions: Dict[str, Set[str]] = {}  # {shop_id: {sid1, sid2, ...}}

@sio.event
async def connect(sid, environ, auth):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Remove from tracking
    for user_id, user_sid in list(connected_users.items()):
        if user_sid == sid:
            del connected_users[user_id]
            break
    
    for shop_id, sids in barber_subscriptions.items():
        if sid in sids:
            sids.remove(sid)

@sio.event
async def user_online(sid, data):
    """Register user as online"""
    user_id = data.get('user_id')
    if user_id:
        connected_users[user_id] = sid
        print(f"User {user_id} is now online")

@sio.event
async def subscribe_to_shop(sid, data):
    """Barber subscribes to their shop notifications"""
    shop_id = data.get('shop_id')
    if shop_id:
        if shop_id not in barber_subscriptions:
            barber_subscriptions[shop_id] = set()
        barber_subscriptions[shop_id].add(sid)
        print(f"Barber subscribed to shop {shop_id}")

async def notify_new_booking(shop_id: str, booking_data: dict):
    """Notify barber of new booking"""
    if shop_id in barber_subscriptions:
        for sid in barber_subscriptions[shop_id]:
            await sio.emit('new_booking', booking_data, room=sid)

async def notify_booking_cancelled(shop_id: str, booking_id: str):
    """Notify barber of cancelled booking"""
    if shop_id in barber_subscriptions:
        data = {'booking_id': booking_id, 'status': 'cancelled'}
        for sid in barber_subscriptions[shop_id]:
            await sio.emit('booking_cancelled', data, room=sid)

async def notify_booking_updated(shop_id: str, booking_data: dict):
    """Notify barber of updated booking"""
    if shop_id in barber_subscriptions:
        for sid in barber_subscriptions[shop_id]:
            await sio.emit('booking_updated', booking_data, room=sid)

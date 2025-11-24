# Mock Tranzila Payment Service for Testing
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timedelta

class TranzilaPaymentRequest(BaseModel):
    amount: float
    currency: str = "ILS"
    customer_email: str
    customer_name: str
    plan: str  # "monthly" or "yearly"

class TranzilaPaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    standing_order_id: Optional[str] = None
    message: str
    payment_token: str

def process_tranzila_payment(request: TranzilaPaymentRequest) -> TranzilaPaymentResponse:
    """
    MOCK TRANZILA PAYMENT - FOR TESTING ONLY
    
    In production, this will integrate with real Tranzila API.
    For now, it simulates a successful payment.
    
    TODO: Replace with real Tranzila integration when credentials provided:
    - Terminal Name
    - API Key
    - Production/Test mode flag
    """
    
    # Generate mock IDs
    transaction_id = f"trx_test_{uuid.uuid4().hex[:12]}"
    standing_order_id = f"so_test_{uuid.uuid4().hex[:12]}"
    payment_token = f"tok_test_{uuid.uuid4().hex[:16]}"
    
    # Simulate processing delay (would be real API call)
    print(f"[MOCK TRANZILA] Processing payment:")
    print(f"  Amount: {request.amount} {request.currency}")
    print(f"  Customer: {request.customer_name} ({request.customer_email})")
    print(f"  Plan: {request.plan}")
    print(f"  Transaction ID: {transaction_id}")
    print(f"  Standing Order ID: {standing_order_id}")
    
    # Always succeed in test mode
    return TranzilaPaymentResponse(
        success=True,
        transaction_id=transaction_id,
        standing_order_id=standing_order_id,
        message="Payment successful (TEST MODE)",
        payment_token=payment_token
    )

def cancel_tranzila_standing_order(standing_order_id: str) -> bool:
    """
    MOCK TRANZILA CANCELLATION - FOR TESTING ONLY
    """
    print(f"[MOCK TRANZILA] Cancelling standing order: {standing_order_id}")
    return True

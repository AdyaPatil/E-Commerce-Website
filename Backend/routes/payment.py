from fastapi import APIRouter, HTTPException, Depends
from db import payments_collection, orders_collection
from models import Payment, PaymentResponse
from datetime import datetime
from .auth import get_current_user 

router = APIRouter()


# Example Payment Statuses
PAYMENT_STATUSES = ["Success", "Failed", "Pending"]


@router.post("/payments/checkout", response_model=PaymentResponse)
async def process_payment(payment_request: Payment, current_user: dict = Depends(get_current_user)):
    """
    Processes the payment for an order and stores the payment details in the database.
    """

    # Verify that the user is a customer
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can make payments")

    # Check if the order exists
    order = await orders_collection.find_one({"order_id": payment_request.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify the order belongs to the current user
    if str(order["user_id"]) != str(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="You cannot make a payment for this order")

    # Generate the next sequential payment_id
    last_payment = await payments_collection.find_one(sort=[("payment_id", -1)])
    payment_id = 1 if not last_payment else int(last_payment["payment_id"]) + 1

    # Create a new payment entry
    payment = {
        "payment_id": str(payment_id),  # Store as string to maintain consistency
        "order_id": payment_request.order_id,
        "user_id": str(current_user["user_id"]),  # Convert user_id to string
        "amount": payment_request.amount,
        "payment_method": payment_request.payment_method,
        "billing_address": payment_request.billing_address,
        "status": "Success",  # For simplicity, assuming payments are always successful
        "created_date": datetime.utcnow()
    }

    # Insert payment into the database
    await payments_collection.insert_one(payment)

    # Update the order status to "Paid"
    await orders_collection.update_one(
        {"order_id": payment_request.order_id},
        {"$set": {"status": "Paid"}}
    )

    return PaymentResponse(**payment)




@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment_details(payment_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieves the payment details for a given payment ID.
    """
    # Fetch the payment from the database
    payment = await payments_collection.find_one({"payment_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Ensure only the payment owner or an admin can access the payment details
    if str(payment["user_id"]) != str(current_user["user_id"]) and str(current_user["role"] != "admin"):
        raise HTTPException(status_code=403, detail="Access forbidden")

    return PaymentResponse(**payment)

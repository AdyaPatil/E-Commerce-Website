from fastapi import APIRouter, HTTPException, Depends
from db import orders_collection 
from models import OrderRequest, OrderResponse, BillingDetails
from pydantic import BaseModel
from datetime import datetime
from typing import List
from .auth import get_current_user 

router = APIRouter()

    
    
@router.post("/orders/", response_model=OrderResponse)
async def place_order(order_request: OrderRequest, current_user: dict = Depends(get_current_user)):
    # Ensure only customers can place orders
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place orders")

    # Automatically fetch the next sequential order_id
    last_order = await orders_collection.find_one(sort=[("order_id", -1)])  # Get the last inserted order
    next_order_id = int(last_order["order_id"]) + 1 if last_order else 1  # Increment or start from 1

    # Create the order object
    order = {
        "order_id": str(next_order_id),  # Convert order_id to string
        "user_id": str(current_user["user_id"]),  # Convert user_id to string
        "user_details": {
            "full_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
            "email": current_user.get("email", ""),
            "address": current_user.get("address", ""),
            "state": current_user.get("state", ""),
            "district": current_user.get("district", ""),
            "taluka": current_user.get("taluka", ""),
            "village": current_user.get("village", ""),
            "pincode": current_user.get("pincode", ""),
        },  # Fetch user details dynamically

        "billing_details": order_request.billing_details.model_dump(),  # ✅ Convert Pydantic model to dictionary
        "items": [item.model_dump() for item in order_request.items],  # ✅ Convert list of Pydantic models
        "total_amount": order_request.total_amount,  # ✅ Total amount
        "shipping_address": order_request.shipping_address,  # ✅ Shipping address
        "status": "Pending",  # ✅ Initial order status
        "created_date": datetime.utcnow(),  # ✅ Order creation time
        "updated_date": None  # ✅ Updated date (None initially)
    }

    # Insert order into database
    await orders_collection.insert_one(order)

    return OrderResponse(**order)  # ✅ Return the response model



@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await orders_collection.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Ensure only the owner or an admin can access the order
    if str(order["user_id"]) != str(current_user["user_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    return OrderResponse(**order)


@router.get("/orders/user/{user_id}", response_model=List[OrderResponse])
async def get_user_orders(user_id: str, current_user: dict = Depends(get_current_user)):
    # Only allow the user or an admin to retrieve user orders
    if str(user_id) != str(current_user["user_id"]) and str(current_user["role"] != "admin"):
        raise HTTPException(status_code=403, detail="Access forbidden")

    orders = await orders_collection.find({"user_id": user_id}).to_list(length=100)
    return [OrderResponse(**order) for order in orders]

class UpdateOrderStatusRequest(BaseModel):
    status: str  # New status (e.g., "Processing", "Shipped", "Delivered", "Cancelled")
    

@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: str, update_request: UpdateOrderStatusRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update order status")

    order = await orders_collection.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update the order status
    await orders_collection.update_one(
        {"order_id": order_id},
        {"$set": {"status": update_request.status, "updated_date": datetime.utcnow()}}
    )

    # Get the updated order
    updated_order = await orders_collection.find_one({"order_id": order_id})
    return OrderResponse(**updated_order)


@router.delete("/orders/{order_id}", response_model=dict)
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await orders_collection.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Allow only the order owner or an admin to cancel the order
    if str(order["user_id"]) != str(current_user["user_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Delete the order
    await orders_collection.delete_one({"order_id": order_id})
    return {"message": "Order cancelled successfully"}

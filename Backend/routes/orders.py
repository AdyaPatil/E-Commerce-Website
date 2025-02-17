from fastapi import APIRouter, HTTPException, Depends, status
from db import orders_collection 
from models import OrderRequest, OrderResponse, BillingDetails
from pydantic import BaseModel
from datetime import datetime
from typing import List
from .auth import get_current_user 

router = APIRouter()

    
    
@router.post("/orders/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(order_request: OrderRequest, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "customer":
            raise HTTPException(status_code=403, detail="Only customers can place orders")

        last_order = await orders_collection.find_one(sort=[("order_id", -1)])
        next_order_id = int(last_order["order_id"]) + 1 if last_order else 1

        order = {
            "order_id": str(next_order_id),
            "user_id": str(current_user["user_id"]),
            "user_details": {
                "full_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
                "email": current_user.get("email", ""),
                "address": current_user.get("address", ""),
                "state": current_user.get("state", ""),
                "district": current_user.get("district", ""),
                "taluka": current_user.get("taluka", ""),
                "village": current_user.get("village", ""),
                "pincode": current_user.get("pincode", ""),
            },
            "billing_details": order_request.billing_details.model_dump(),
            "items": [item.model_dump() for item in order_request.items],
            "total_amount": order_request.total_amount,
            "shipping_address": order_request.shipping_address,
            "status": "Pending",
            "created_date": datetime.utcnow(),
            "updated_date": None
        }
        await orders_collection.insert_one(order)
        return OrderResponse(**order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/orders/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        order = await orders_collection.find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if str(order["user_id"]) != str(current_user["user_id"]) and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        return OrderResponse(**order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/orders/user/{user_id}", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
async def get_user_orders(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if str(user_id) != str(current_user["user_id"]) and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        orders = await orders_collection.find({"user_id": user_id}).to_list(length=100)
        return [OrderResponse(**order) for order in orders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class UpdateOrderStatusRequest(BaseModel):
    status: str

@router.put("/orders/{order_id}/status", response_model=OrderResponse, status_code=status.HTTP_200_OK)
async def update_order_status(order_id: str, update_request: UpdateOrderStatusRequest, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update order status")

        order = await orders_collection.find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        await orders_collection.update_one(
            {"order_id": order_id},
            {"$set": {"status": update_request.status, "updated_date": datetime.utcnow()}}
        )

        updated_order = await orders_collection.find_one({"order_id": order_id})
        return OrderResponse(**updated_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/orders/{order_id}", response_model=dict, status_code=status.HTTP_200_OK)
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        order = await orders_collection.find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if str(order["user_id"]) != str(current_user["user_id"]) and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access forbidden")

        await orders_collection.delete_one({"order_id": order_id})
        return {"message": "Order cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
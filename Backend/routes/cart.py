from fastapi import APIRouter, HTTPException, Depends, status
from db import shopping_cart_collection  # MongoDB categories collection
from models import ShoppingCart, CartItemResponse, UpdateCartItemRequest
from fastapi.encoders import jsonable_encoder
from typing import List
from .auth import get_current_user  # Assuming the authentication route is implemented elsewhere


router = APIRouter()



@router.post("/cart/add", response_model=CartItemResponse,status_code=status.HTTP_200_OK)
async def add_to_cart(cart_item: ShoppingCart, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "customer":
            raise HTTPException(status_code=403, detail="Only customers can add items to the cart")

        user_cart = await shopping_cart_collection.find_one({"user_id": current_user["user_id"]})

        if not user_cart:
            await shopping_cart_collection.insert_one({"user_id": current_user["user_id"], "items": []})
            cart_id = 1
        else:
            cart_id = max(
                [int(item["cart_id"]) for item in user_cart["items"]] if user_cart["items"] else [0]
            ) + 1

        cart_item_dict = cart_item.dict()
        cart_item_dict["cart_id"] = str(cart_id)
        cart_item_dict["user_id"] = str(current_user["user_id"])

        await shopping_cart_collection.update_one(
            {"user_id": current_user["user_id"]},
            {"$push": {"items": cart_item_dict}}
        )

        return cart_item_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cart/", response_model=List[CartItemResponse],status_code=status.HTTP_200_OK)
async def get_cart_items(current_user: dict = Depends(get_current_user)):
    try:
        user_cart = await shopping_cart_collection.find_one({"user_id": current_user["user_id"]})
        if not user_cart or not user_cart["items"]:
            raise HTTPException(status_code=404, detail="Cart is empty")
        return user_cart["items"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/cart/update/{cart_id}", response_model=CartItemResponse,status_code=status.HTTP_200_OK)
async def update_cart_item(cart_id: str, update_request: UpdateCartItemRequest, current_user: dict = Depends(get_current_user)):
    try:
        if update_request.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

        user_cart = await shopping_cart_collection.find_one({"user_id": current_user["user_id"]})
        if not user_cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        item_to_update = next((item for item in user_cart["items"] if item["cart_id"] == cart_id), None)
        if not item_to_update:
            raise HTTPException(status_code=404, detail="Item not found")

        await shopping_cart_collection.update_one(
            {"user_id": current_user["user_id"], "items.cart_id": cart_id},
            {"$set": {"items.$.quantity": update_request.quantity}}
        )

        item_to_update["quantity"] = update_request.quantity
        return CartItemResponse(**item_to_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.delete("/cart/remove/{cart_id}",status_code=status.HTTP_200_OK)
async def remove_from_cart(cart_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_cart = await shopping_cart_collection.find_one({"user_id": current_user["user_id"]})
        if not user_cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Remove the item from the cart
        result = await shopping_cart_collection.update_one(
            {"user_id": current_user["user_id"]},
            {"$pull": {"items": {"cart_id": cart_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return {"message": "Item removed from cart successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import APIRouter, HTTPException, Depends, status
from db import reviews_collection, products_collection
from models import Review, ReviewResponse
from datetime import datetime
from typing import List
from .auth import get_current_user 

router = APIRouter()


    
# Add a new review
@router.post("/reviews/", response_model=ReviewResponse, status_code=201)
async def add_review(review_request: Review, current_user: dict = Depends(get_current_user)):
    try:
        if str(current_user["role"]) != "customer":
            raise HTTPException(status_code=403, detail="Only customers can add reviews")

        # Check if the product exists
        product = await products_collection.find_one({"product_id": review_request.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Generate the next sequential review_id
        last_review = await reviews_collection.find_one(sort=[("review_id", -1)])  # Find the highest review_id
        review_id = 1 if not last_review else int(last_review["review_id"]) + 1

        # Create a new review
        review = {
            "review_id": str(review_id),  # Store as a string for consistency
            "product_id": review_request.product_id,
            "user_id": str(current_user["user_id"]),
            "rating": review_request.rating,
            "review": review_request.review,
            "created_at": datetime.utcnow(),
            "updated_at": None,
        }

        # Insert the review into the database
        await reviews_collection.insert_one(review)

        return ReviewResponse(**review)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get reviews for a product
@router.get("/reviews/{product_id}", response_model=List[ReviewResponse], status_code=200)
async def get_reviews(product_id: str):
    try:
        reviews = await reviews_collection.find({"product_id": product_id}).to_list(length=None)
        if not reviews:
            raise HTTPException(status_code=404, detail="No reviews found for this product")

        return [ReviewResponse(**review) for review in reviews]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update an existing review
@router.put("/reviews/{review_id}", response_model=ReviewResponse, status_code=200)
async def update_review(review_id: str, review_request: Review, current_user: dict = Depends(get_current_user)):
    try:
        # Check if the review exists
        review = await reviews_collection.find_one({"review_id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Ensure the review belongs to the current user
        if str(review["user_id"]) != str(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="You can only update your own reviews")

        # Update the review
        updated_review = {
            "rating": review_request.rating,
            "review": review_request.review,
            "updated_at": datetime.utcnow(),
        }
        await reviews_collection.update_one({"review_id": review_id}, {"$set": updated_review})

        review.update(updated_review)  # Update local copy to return updated data
        return ReviewResponse(**review)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete an existing review
@router.delete("/reviews/{review_id}", status_code=200)
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Check if the review exists
        review = await reviews_collection.find_one({"review_id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Ensure the review belongs to the current user
        if str(review["user_id"]) != str(current_user["user_id"]):
            raise HTTPException(status_code=403, detail="You can only delete your own reviews")

        # Delete the review
        await reviews_collection.delete_one({"review_id": review_id})

        return {"detail": "Review deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

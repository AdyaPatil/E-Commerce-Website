from fastapi import APIRouter, HTTPException, Depends
from db import categories_collection  # MongoDB categories collection
from models import Category, CategoryResponse
from typing import List
from .auth import get_current_user  # Assuming the authentication route is implemented elsewhere
import re

router = APIRouter()



# Add Category (Admin only)
@router.post("/categories/", response_model=CategoryResponse)
async def add_category(category: Category, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Fetch the highest category_id from the database, sorted in descending order
    last_category = await categories_collection.find().sort("category_id", -1).limit(1).to_list(length=1)
    
    if last_category:
        # If categories exist, get the last category_id and increment it by 1
        try:
            # Extract category_id as a string and check if it is numeric
            last_category_id = last_category[0]["category_id"]
            
            # Ensure that category_id is numeric
            if not re.match(r'^\d+$', last_category_id):  # Ensure it's numeric
                raise ValueError("Non-numeric category_id found")
            
            new_category_id = str(int(last_category_id) + 1)  # Increment the last category_id by 1
        except ValueError:
            raise HTTPException(status_code=500, detail="Invalid category_id format in database")
    else:
        # If no categories exist, start with category_id = 1
        new_category_id = "1"
    
    # Convert the category to a dictionary and add the generated category_id
    category_dict = category.dict()
    category_dict["category_id"] = new_category_id
    
    # Insert the category into MongoDB
    insert_result = await categories_collection.insert_one(category_dict)

    # Check if insertion was successful and return response with the new category_id
    if insert_result.inserted_id:
        return CategoryResponse(**category_dict)
    else:
        raise HTTPException(status_code=500, detail="Failed to insert category into database")

# Get All Categories
@router.get("/categories/", response_model=List[CategoryResponse])
async def get_all_categories():
    # Fetch all categories from the database (MongoDB)
    categories_cursor = categories_collection.find()  # This returns an AsyncIOMotorCursor
    categories = await categories_cursor.to_list(length=None)  # Convert the cursor to a list
    
    # Debug: Print the raw categories data
    print(categories)
    
    return [CategoryResponse(**category) for category in categories]

# Get Category by ID
@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category_details(category_id: str):
    # Fetch category by category_id from the database (MongoDB)
    category = await categories_collection.find_one({"category_id": category_id})
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Ensure the category data is correctly passed to the response model
    return CategoryResponse(**category)

# Update Category (Admin only)
@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category_update: Category, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Logic to update the category by category_id in the database
    updated_category = category_update.dict(exclude_unset=True)
    updated_category["category_id"] = category_id  # Retain the existing category_id
    
    # Perform the update in the database
    result = await categories_collection.update_one(
        {"category_id": category_id},
        {"$set": updated_category}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Fetch the updated category from the database
    updated_category = await categories_collection.find_one({"category_id": category_id})
    
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Make sure the category_id is included in the response
    return CategoryResponse(**updated_category)


# Delete Category (Admin only)
@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Perform the delete operation
    result = await categories_collection.delete_one({"category_id": category_id})
    
    # Check if the category was deleted
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

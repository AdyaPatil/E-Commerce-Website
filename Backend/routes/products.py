from fastapi import APIRouter, HTTPException, Depends
from db import products_collection, categories_collection
from models import Product, ProductResponse, ProductUpdateRequest
from typing import List
from .auth import get_current_user  # Assuming the authentication route is implemented elsewhere


router = APIRouter()


# Function to get the next product_id by finding the max value of current product_ids
async def get_next_product_id():
    last_product = await products_collection.find_one(
        {}, 
        projection={"product_id": 1}, 
        sort=[("product_id", -1)]  # Sort by product_id in descending order
    )
    
    if last_product and last_product["product_id"].isdigit():
        # Convert product_id to integer and increment by 1 if it is a valid integer string
        return str(int(last_product["product_id"]) + 1)  # Convert back to string
    else:
        # Return "1" as the starting product_id if no valid product_id is found
        return "1"  # Ensure it is returned as a string


# Post request to add a new product
@router.post("/products/", response_model=ProductResponse)
async def add_product(product: Product, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get the next product_id by finding the maximum existing product_id
    product_id = await get_next_product_id()

    # Convert ProductRequest model to dictionary for MongoDB insertion
    new_product = product.dict(exclude_unset=True)
    new_product["product_id"] = product_id  # Assign the custom product_id to the product

    # Insert the product into the MongoDB collection
    result = await products_collection.insert_one(new_product)

    # Return the created product with the custom product_id
    new_product["product_id"] = product_id  # Ensure product_id is part of the response
    return ProductResponse(**new_product)


# Get all products
from fastapi import APIRouter, HTTPException
from typing import List
from pymongo import ASCENDING

# Assuming you have a categories collection
@router.get("/products/", response_model=List[ProductResponse])
async def get_all_products():
    products = await products_collection.find().to_list(100)  # Retrieve up to 100 products
    
    # Create a list to store the updated product data with category names
    enriched_products = []
    
    for product in products:
        # Fetch the category based on the category_id
        category = await categories_collection.find_one({"category_id": product["category_id"]})
        
        if not category:
            raise HTTPException(status_code=404, detail=f"Category not found for ID {product['category_id']}")
        
        # Add the category name to the product data
        product["category_name"] = category["name"]
        enriched_products.append(ProductResponse(**product))
    
    return enriched_products


# Get product details by product_id
@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_details(product_id: str):
    # Query by 'product_id' field instead of '_id'
    product = await products_collection.find_one({"product_id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Return the product details
    return ProductResponse(**product)

# Update product details
@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find the product by product_id (not by _id)
    product = await products_collection.find_one({"product_id": product_id})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Create a dictionary with only the updated fields (exclude unset fields)
    update_fields = product_update.dict(exclude_unset=True)

    # If there are no fields to update, return the existing product
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update only the fields that are provided
    await products_collection.update_one(
        {"product_id": product_id},
        {"$set": update_fields}
    )

    # Fetch the updated product
    updated_product = await products_collection.find_one({"product_id": product_id})

    return ProductResponse(**updated_product)




# Delete a product by product_id
@router.delete("/products/{product_id}", response_model=dict)
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find the product by product_id (not by _id)
    product = await products_collection.find_one({"product_id": product_id})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete the product by product_id
    await products_collection.delete_one({"product_id": product_id})

    return {"message": "Product deleted successfully"}


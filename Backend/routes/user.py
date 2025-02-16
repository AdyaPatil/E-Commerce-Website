from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from db import users_collection, contact_collection
from models import UserProfile, UserUpdateRequest, Contactquery
from typing import List
from .auth import get_current_user  # Assuming the authentication route is implemented elsewhere
import logging
from fastapi.encoders import jsonable_encoder

router = APIRouter()


# Dependency for user authentication, assuming JWT-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Get User Profile
@router.get("/users/{user_id}", response_model=UserProfile)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):

    if str(current_user["user_id"]) != str(user_id) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await users_collection.find_one({"user_id": int(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfile(**user)


# Update User Profile
@router.put("/users/{user_id}", response_model=UserProfile)
async def update_user(user_id: str, user_update: UserUpdateRequest, current_user: dict = Depends(get_current_user)):
    logging.info(f"Attempting to update user {user_id} by {current_user}")  # Debugging log

    # Ensure user_id is a string for proper comparison
    user_id_str = str(user_id)
    current_user_id_str = str(current_user["user_id"])

    # Authorization check: Allow self-update or admin access
    if current_user_id_str != user_id_str and current_user["role"] != "admin":
        logging.warning(f"Unauthorized update attempt by {current_user}")
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find user in the database
    user = await users_collection.find_one({"user_id": int(user_id)})
    if not user:
        logging.error(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")

    # Apply only the provided updates
    updated_fields = user_update.dict(exclude_unset=True)  # Ignore unset fields

    if not updated_fields:
        logging.info(f"No fields provided for update in user {user_id}")
        raise HTTPException(status_code=400, detail="No updates provided")

    # Update the database only with provided fields
    update_result = await users_collection.update_one(
        {"user_id": int(user_id)}, {"$set": updated_fields}
    )

    if update_result.modified_count == 0:
        logging.warning(f"No changes made to user {user_id}")

    # Fetch updated user
    updated_user = await users_collection.find_one({"user_id": int(user_id)})
    return UserProfile(**updated_user)


# Delete User Account
@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await users_collection.find_one({"user_id": int(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user from the database
    await users_collection.delete_one({"user_id": int(user_id)})
    
    return {"message": f"User with id {user_id} has been deleted"}

# Get a List of All Users (Admin Only)
@router.get("/users/", response_model=List[UserProfile])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await users_collection.find().to_list(100)  # Fetch all users

    # Filter out users with role 'admin'
    filtered_users = [user for user in users if user.get("role") != "admin"]

    return [UserProfile(**user) for user in filtered_users]


@router.post("/contact/submit", response_model=dict)
async def submit_contact_query(contact: Contactquery):
    try:
        contact_data = jsonable_encoder(contact)

        # Insert into MongoDB
        result = await contact_collection.insert_one(contact_data)

        # Convert ObjectId to string for response
        contact_data["_id"] = str(result.inserted_id)

        return {"message": "Contact query submitted successfully", "data": contact_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting contact query: {str(e)}")
    
    
@router.get("/contact/all", response_model=dict)
async def get_all_contact_queries():
    try:
        contacts_cursor = contact_collection.find()
        contacts = []
        async for contact in contacts_cursor:
            contact["_id"] = str(contact["_id"])  # Convert ObjectId to string
            contacts.append(contact)

        return {"message": "Contact queries retrieved successfully", "data": contacts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving contact queries: {str(e)}")
from app.models.user import UserModel
import uuid

# Initialize the user model
user_model = UserModel()

# Example: Create a new user after Supabase Auth registration
def create_new_user_example():
    # This user_id comes from Supabase Auth after successful registration
    user_id = str(uuid.uuid4())  # In real app, this comes from auth.users.id
    username = "alice"
    
    # These would come from your crypto key generation
    ml_dsa_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."  # Base64 encoded
    kyber_key = "BgIAAC4AAAC4AAAA8AAAAPAAAAD..."  # Base64 encoded
    
    try:
        new_user = user_model.create_user(user_id, username, ml_dsa_key, kyber_key)
        print(f"Created user: {new_user}")
    except Exception as e:
        print(f"Error: {e}")

# Example: Get user info
def get_user_example():
    try:
        # Get by username (for finding someone to message)
        user = user_model.get_user_by_username("alice")
        if user:
            print(f"Found user: {user['username']}")
            print(f"User ID: {user['id']}")
            print(f"Created: {user['created_at']}")
        
        # Get just the public keys (for crypto operations)
        keys = user_model.get_public_keys(user['id'])
        if keys:
            print(f"ML-DSA Key: {keys['ml_dsa_public_key'][:50]}...")
            print(f"Kyber Key: {keys['kyber_public_key'][:50]}...")
            
    except Exception as e:
        print(f"Error: {e}")

# Example: Check if username is available
def check_username_example():
    username = "bob"
    if user_model.user_exists(username):
        print(f"Username '{username}' is taken")
    else:
        print(f"Username '{username}' is available")

if __name__ == "__main__":
    # Run examples (make sure your .env file has SUPABASE_URL and SUPABASE_ANON_KEY)
    create_new_user_example()
    get_user_example()
    check_username_example()
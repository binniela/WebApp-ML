from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.messages import router as messages_router
from app.routes.users import router as users_router
from app.routes.chat_requests import router as chat_requests_router
from app.routes.contacts import router as contacts_router
from app.routes.crypto_keys import router as crypto_router
from app.routes.websocket import router as websocket_router

app = FastAPI(title="LockBox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(messages_router)
app.include_router(users_router)
app.include_router(chat_requests_router)
app.include_router(contacts_router)
app.include_router(crypto_router)
app.include_router(websocket_router)

@app.get("/")
def read_root():
    return {"message": "LockBox API is running!"}
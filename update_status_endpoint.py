@app.post("/chat-requests/update-status")
async def update_chat_request_status(request: dict, user_id: str = Depends(verify_token)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    request_id = request.get("request_id")
    status = request.get("status")
    
    if not request_id or not status:
        raise HTTPException(status_code=400, detail="Missing request_id or status")
    
    conn = get_db()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                UPDATE chat_requests 
                SET status = %s, updated_at = NOW() 
                WHERE id::text = %s AND to_user_id::text = %s
            """, (status, request_id, user_id))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Chat request {request_id} updated to {status}")
            return {"message": f"Chat request {status}", "status": status}
            
        except Exception as e:
            if conn: conn.close()
            print(f"Status update error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")
    
    raise HTTPException(status_code=500, detail="Database connection failed")
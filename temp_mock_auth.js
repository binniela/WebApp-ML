// Simple mock authentication for testing
const mockAuth = {
  register: (username, password) => ({
    access_token: `mock_token_${Date.now()}`,
    token_type: "bearer",
    user: { id: `user_${Date.now()}`, username }
  }),
  login: (username, password) => ({
    access_token: `mock_token_${Date.now()}`,
    token_type: "bearer", 
    user: { id: `user_${Date.now()}`, username }
  })
};

console.log("Mock auth created for testing");

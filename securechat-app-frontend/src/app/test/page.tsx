"use client"

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testDirectCall = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://52.53.221.141/health')
      const text = await response.text()
      setResult(`SUCCESS: ${text}`)
    } catch (error: any) {
      setResult(`ERROR: ${error.message}`)
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://52.53.221.141/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      })
      const data = await response.json()
      setResult(`REGISTER: ${JSON.stringify(data)}`)
    } catch (error: any) {
      setResult(`REGISTER ERROR: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-4">LockBox Connection Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testDirectCall}
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded mr-4"
        >
          Test Health Check
        </button>
        
        <button 
          onClick={testRegister}
          disabled={loading}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Test Register
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-lg mb-2">Result:</h2>
        <pre className="text-sm">{loading ? 'Loading...' : result}</pre>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>Expected: Mixed Content Policy will block HTTP requests from HTTPS</p>
        <p>Backend: http://52.53.221.141</p>
        <p>Frontend: https://web-app-ml.vercel.app</p>
      </div>
    </div>
  )
}
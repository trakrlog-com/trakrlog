import { useState } from 'react'
import { isValidEmail } from '@trakrlog/common'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [isValid, setIsValid] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setIsValid(isValidEmail(newEmail))
  }

  return (
    <div className="card">
      <h1>Email Validation Test</h1>
      <div>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter email to validate"
          style={{ padding: '8px', margin: '10px 0' }}
        />
        <p style={{ color: isValid ? 'green' : 'red' }}>
          Email is {isValid ? 'valid' : 'invalid'}
        </p>
      </div>
    </div>
  )
}

export default App

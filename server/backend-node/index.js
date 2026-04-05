const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Test route first
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow Node API is running! 🚀' })
})

// Only add routes if files exist
try {
  const authRoutes = require('./routes/auth')
  const taskRoutes = require('./routes/tasks')
  app.use('/auth', authRoutes)
  app.use('/tasks', taskRoutes)
  console.log('✅ Routes loaded successfully')
} catch (err) {
  console.error('Routes error:', err.message)
}

app.listen(PORT, () => {
  console.log(`Node server running on port ${PORT}`)
})
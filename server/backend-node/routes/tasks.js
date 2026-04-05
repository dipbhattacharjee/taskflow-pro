const express = require('express')
const router = express.Router()
const pool = require('../db')
const verifyToken = require('../middleware/auth')

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', verifyToken, async (req, res) => {
  const { title, description, status = 'todo', priority = 'medium', due_date } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, title, description, status, priority, due_date || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params
  const { title, description, status, priority, due_date } = req.body
  try {
    const result = await pool.query(
      'UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status), priority=COALESCE($4,priority), due_date=COALESCE($5,due_date) WHERE id=$6 AND user_id=$7 RETURNING *',
      [title, description, status, priority, due_date || null, id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2 RETURNING id', [id, req.user.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' })
    res.json({ message: 'Task deleted', id: result.rows[0].id })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

module.exports = router

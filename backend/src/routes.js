const express = require('express');
const router = express.Router();
const db = require('./db.js')


router.get('/users', async (req, res) => {
  try{
    const result = await db.query('SELECT * FROM users')
    res.json(result.rows)
  }catch(err){
    console.error(err);
    res.status(500).json({error: 'internal server error'})
  }
})


router.get('/', (req, res) => {
  res.send('hello world')
})

module.exports = router;

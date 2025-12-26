const express = require('express')
const app = express()
const routes = require('./routes.js')


app.use(express.json())
app.use(routes)

const port = process.env.PORT || 3000

app.listen(port, ()=>{
  console.log("server is running on PO RT: ", port)
})

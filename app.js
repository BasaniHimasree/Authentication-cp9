const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const bcrypt = require('bcrypt')
app.use(express.json())
let db = null
const dbPath = path.join(__dirname, 'userData.db')
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error:${error.message}`)
  }
}
initializeDbAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`
  let dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const postUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `select * FROM user where username='${username}';`
  let dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(checkUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('User not Registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      const lengthNewPassword = newPassword.length
      if (lengthNewPassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password='${encryptedPassword}' WHERE username='${username}';`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
        response.status(200)
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app

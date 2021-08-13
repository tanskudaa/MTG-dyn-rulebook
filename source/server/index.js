// require
const express = require('express')
const rfs = require('rotating-file-stream')
const morgan = require('morgan')
const path = require('path')
const axios = require('axios')
require('dotenv').config()

// Set up express
const app = express()
app.use(express.json())

// Set up logging
morgan.token('body', (req) => JSON.stringify(req.body))
const logStream = rfs.createStream('access.log', {
  interval: '1d',
  path: `${__dirname}/log`
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body :remote-addr'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body :remote-addr', { stream: logStream }))

/*
 * Send frontend build on request
 */
app.use(express.static(path.join(__dirname, '..', 'build')))

app.get('/api/read/:url(*)', (req, res) => {
  const url = req.params.url
  fetchPlainText(url)
    .then(ret => res.send(ret))
})

app.get('/*', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, '..', 'build')});
})

/*
 * Functions
 */
const fetchPlainText = async (url) => {
  const MAX_RESPONSE_SIZE = 1000000
  const defaultUrl = 'https://media.wizards.com/2021/downloads/MagicCompRules%2020210419.txt'

  try {
    const res = await axios({
      url: url, // TODO breaks without http:// prefix
      method: 'GET',
      maxContentLength: MAX_RESPONSE_SIZE,
      headers: {
        'Accept': 'text/plain',
      }
    })

    // TODO error handling

    return {data: res.data}
  }
  catch (e) {
    return {error: e.message}
  }
}


/*
 * Listen for connections
 */
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

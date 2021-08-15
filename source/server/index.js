//
// TODO Refactor into util scripts
//

// require
const express = require('express')
const rfs = require('rotating-file-stream')
const morgan = require('morgan')
const path = require('path')
const contentHelper = require('./utils/content_helper')
require('dotenv').config()

// Constants
const DEFAULT_CONTENT_URL = process.env.DEFAULT_CONTENT_URL || 'https://loripsum.net/api/20'

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
// app.use(express.static(path.join(__dirname, '..', 'build')))
app.use(express.static(path.join(__dirname, 'build')))

app.get(['/api/read', '/api/read/:url(*)'], (req, res) => {
  const url = (typeof req.params.url !== 'undefined' && req.params.url !== '')
    ? req.params.url
    : DEFAULT_CONTENT_URL

    contentHelper.fetchPlainText(url)
      .then(ret => res.send(ret))
  }
)


app.get('/*', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, '..', 'build')});
})


/*
 * Listen for connections
 */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

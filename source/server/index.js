//
// TODO Refactor into util scripts
//

// require
const express = require('express')
const rfs = require('rotating-file-stream')
const morgan = require('morgan')
const path = require('path')
const contentHelper = require('./utils/content_helper')
const { nextTick } = require('process')
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
app.use(express.static(path.join(__dirname, '..', 'build')))

app.get('/api/read/:url(*)', (req, res) => {
  const url = (req.params.url !== '')
    ? req.params.url
    : DEFAULT_CONTENT_URL

    // NOTE/TODO This will now break since I'm implementing proper parsing in utils/content_helper
    contentHelper.fetchPlainText(url)
      .then(ret => res.send(ret))
  }
)

// app.get('/api/read', (req, res) => {
//   // These will now break since I'm implementing proper parsing in utils/content_helper
//   contentHelper.fetchPlainText(DEFAULT_CONTENT_URL)
//     .then(ret => res.send(ret))
// })

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

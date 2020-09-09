'use strict'
//Setup for GCP Debugging
require('@google-cloud/debug-agent').start({serviceContext: {enableCanary: true}});

// Config Variables
require('dotenv').config()
const port = process.env.PORT

// External Dependencies
const express = require('express')
const server = express()
const bodyParser = require('body-parser')
server.use(bodyParser.json())

// Routes
var routes = require('./routes')
server.use('/', routes)

// Start Server
server.listen(port, () => console.log(`Events Service listening well at http://localhost:${port}`))

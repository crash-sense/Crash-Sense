'use strict'

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  crashId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crash',
    required: true,
    index: true
  },
  messages: [messageSchema],
}, { timestamps: true })

module.exports = mongoose.model('Session', sessionSchema)
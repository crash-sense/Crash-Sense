'use strict'

const mongoose = require('mongoose')

const packageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  version: String,
  description: String,
  content: {
    type: String,
    required: true, // The raw package.json content or source
  },
  analysis: {
    type: String, // AI analysis result of the package
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Package', packageSchema)

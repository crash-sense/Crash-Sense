'use strict'

const mongoose = require('mongoose')

const frameSchema = new mongoose.Schema({
  file: { type: String, default: 'unknown' },
  line: { type: Number },
  column: { type: Number },
  functionName: { type: String, default: '<anonymous>' },
  isNative: { type: Boolean, default: false },
  isConstructor: { type: Boolean, default: false },
}, { _id: false })

const requestSchema = new mongoose.Schema({
  method: { type: String, default: 'UNKNOWN' },
  url: { type: String, default: 'UNKNOWN' },
  headers: { type: Object, default: {} },
  body: { type: Object, default: {} },
  query: { type: Object, default: {} },
  params: { type: Object, default: {} },
  ip: { type: String, default: 'unknown' },
}, { _id: false })

const environmentSchema = new mongoose.Schema({
  nodeVersion: { type: String },
  platform: { type: String },
  arch: { type: String },
  uptime: { type: Number },
  memoryUsage: { type: Object },
}, { _id: false })

const crashSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  name: { type: String, default: 'Error' },
  stack: { type: String },
  frames: [frameSchema],
  request: requestSchema,
  environment: environmentSchema,
  aiAnalysis: { type: String, default: '' },
  occurrenceCount: { type: Number, default: 1 },
}, { timestamps: true })

module.exports = mongoose.model('Crash', crashSchema)
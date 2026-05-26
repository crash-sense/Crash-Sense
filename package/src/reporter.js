'use strict'

const axios = require('axios')

async function sendReport(payload, options) {
  const url = `${options.dashboardUrl}/api/crashes`

  await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    timeout: options.timeout || 3000,
    validateStatus: (status) => status >= 200 && status < 300,
  })
}

module.exports = { sendReport }
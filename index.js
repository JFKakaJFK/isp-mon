#!/usr/bin/env node
'use strict'

const fs = require('fs')
const { spawnSync } = require('child_process')
require('dotenv').config()
const mysqlx = require('@mysql/xdevapi')
const cron = require('node-cron')

const connect = async () => await mysqlx.getSession({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 33060,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD
})

const bps2Mbps = (bps) => (bps / (10 ** 6)).toFixed(2)

async function speedtest() {
  console.log('measuring speedtest.net performance ...')
  try {
    const json = JSON.parse(spawnSync('speedtest-cli', ['--json']).stdout.toString())

    const [timestamp, download, upload, latency, server] = [
      json.timestamp || null,
      bps2Mbps(json.download),
      bps2Mbps(json.upload),
      json.ping.toFixed(0),
      (json.server || { sponsor: 'unknown' }).sponsor
    ]

    console.log(`[${timestamp}@${server}]: Latency ${latency}ms, Down ${download}Mbps, Up ${upload}Mbps`)

    const session = await connect()
    try {
      await session
        .sql(`INSERT INTO \`measurements\`.\`speedtest\`
              (\`timestamp\`, \`latency\`, \`download\`, \`upload\`, \`server\`)
              VALUES
              (?, ?, ?, ?, ?);`)
        .bind(timestamp, latency, download, upload, server)
        .execute()
    } catch (error) {
      console.error('Writing to db failed: ' + error)
    } finally { session.close() }
  } catch (error) {
    console.error('Measurement failed: ' + error)
  }
}

const toMbps = (speed, unit) => {
  switch (unit) {
    case 'Gbps':
      return parseFloat(speed) * 1000
    case 'Mbps':
      return speed
    case 'Kbps':
      return parseFloat(speed) / 1000
    default:
      throw Error(`Unknown unit ("${unit}") check the log file!`)
  }
}

async function fast() {
  console.log('measuring fast.com performance ...')
  try {
    const res = spawnSync('fast', ['-u', '|', 'cat']).stdout.toString().replace('\n', ' ').split(' ').map(s => s.trim())

    fs.appendFileSync(__dirname + '/log.txt', new Date().toISOString().replace('Z', '') + ': ' + res.join(' ') + '\n')

    const [timestamp, download, upload] = [
      new Date().toISOString().replace('Z', ''),
      toMpbs(res[0], res[1]),
      toMpbs(res[2], res[3])
    ]

    console.log(`[${timestamp}]: Down ${download}Mbps, Up ${upload}Mbps`)

    const session = await connect()
    try {
      await session
        .sql(`INSERT INTO \`measurements\`.\`fast\`
              (\`timestamp\`, \`download\`, \`upload\`)
              VALUES
              (?, ?, ?);`)
        .bind(timestamp, download, upload)
        .execute()
    } catch (error) {
      console.error('Writing to db failed: ' + error)
    } finally { session.close() }
  } catch (error) {
    console.error('Measurement failed: ' + error)
  }
}

cron.schedule(`*/${process.env.TEST_INTERVAL || 5} * * * *`, () => {
  const msg = `[${new Date().toLocaleTimeString()}]: measuring internet speed`
  console.log(msg)
  speedtest()
  fast()
})
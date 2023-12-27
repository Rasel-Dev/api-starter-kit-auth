import { exec } from 'child_process'

export const runCmd = (command = 'ls -la') =>
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    const res = stdout.split(/\n/)
    res.forEach((cl, i) => {
      console.log(`${i}**`, cl)
    })
    console.log('res :', res.length)
    // console.log(`stdout: ${stdout.split(/\n/)}`)
  })

export const execAsync = (command = 'ls -la') =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`)
        return reject(error)
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`)
        return
      }
      const res = stdout.split(/\n/)
      resolve(res)
      res.forEach((cl, i) => {
        console.log(`${i}**`, cl)
      })
      console.log('res :', res.length)
      // console.log(`stdout: ${stdout.split(/\n/)}`)
    })
  })

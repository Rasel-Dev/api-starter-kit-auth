import { createTransport } from 'nodemailer'

// Create a Nodemailer transporter
const transporter = createTransport({
  //   service: 'maple.itnut.net', // e.g., 'Gmail', 'Outlook', etc.
  host: 'maple.itnut.net',
  port: 465,
  secure: true,
  auth: {
    user: 'support@gol1x.live',
    pass: '^vtc^ahLEAkO'
  }
})

// Email data
const mailOptions = {
  from: 'support@gol1x.live',
  to: 'creativedesigner329@gmail.com',
  subject: '00',
  text: 'Hello World'
}

// Send the email
export const sendForMail = () =>
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error)
    } else {
      console.log('Email sent:', info)
    }
  })

import nodemailer from 'nodemailer';

export default options => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  transporter.sendMail(options, (err, info) => {
    if (err) return err;
    return info;
  });
};

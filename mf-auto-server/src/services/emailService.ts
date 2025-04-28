// import nodemailer from 'nodemailer';
// import { readFileSync } from 'fs';
// import path from 'path';
// import Handlebars from 'handlebars';

// interface EmailOptions {
//   to: string;
//   subject: string;
//   template: string;
//   context: Record<string, any>;
// }

// class EmailService {
//   private transporter: nodemailer.Transporter;
//    private senderName: string;
//   private senderEmail: string;

//   constructor() {
//     console.log('Email service: Initializing...');
//     const host = process.env.EMAIL_HOST || 'w018933f.kasserver.com';
//     const port = parseInt(process.env.EMAIL_PORT || '465');
//     const user = process.env.EMAIL_USER || 'm071e9ad';
//     const pass = process.env.EMAIL_PASS || 'LWJb7PFgo63D4GKYofcv';
//     this.senderName = 'DentNet Kassenwechsel';
//     this.senderEmail = process.env.EMAIL_FROM || 'info@kassenwechsel.dentnet.de';

//     console.log(`Email service: Using host: ${host}, port: ${port}, user: ${user}`);

//     this.transporter = nodemailer.createTransport({
//       host: host,
//       port: port,
//       secure: true, // use SSL
//       auth: {
//         user: user,
//         pass: pass,
//       },
//       debug: true, // Enable debug logs
//     });

//     console.log('Email service: Transporter created');
//   }

//   async sendEmail({ to, subject, template, context }: EmailOptions): Promise<void> {
//     try {
//       console.log('Email service: Preparing to send email...');
//       console.log('Email service: Recipient:', to);
//       console.log('Email service: Subject:', subject);
//       console.log('Email service: Template:', template);

//       const templatePath = path.join(__dirname, '..', 'templates', `${template}.hbs`);
//       console.log('Email service: Template path:', templatePath);

//       let templateContent: string;
//       try {
//         templateContent = readFileSync(templatePath, 'utf-8');
//       } catch (error) {
//         console.error('Email service: Error reading template file:', error);
//         throw new Error('Failed to read email template');
//       }

//       const compiledTemplate = Handlebars.compile(templateContent);
//       const html = compiledTemplate(context);

//       const mailOptions = {
//         from: `"${this.senderName}" <${this.senderEmail}>`,
//         to,
//         subject,
//         html,
//       };

//      console.log('Email service: Mail options:', JSON.stringify(mailOptions, null, 2));

//       const info = await this.transporter.sendMail(mailOptions);
//       console.log('Email service: Email sent successfully. Message ID:', info.messageId);
//       console.log('Email service: Response:', info.response);
//     } catch (error) {
//       console.error('Email service: Error sending email:', error);
//       if (error instanceof Error) {
//         console.error('Email service: Error details:', error.message);
//         console.error('Email service: Error stack:', error.stack);
//       }
//       console.error('Email service: Additional error properties:', JSON.stringify(error, null, 2));
//       throw new Error('Failed to send email');
//     }
//   }

//   async verifyConnection(): Promise<void> {
//     try {
//       console.log('Email service: Verifying connection...');
//       await this.transporter.verify();
//       console.log('Email service: Connection verified successfully');
//     } catch (error) {
//       console.error('Email service: Connection verification failed:', error);
//       if (error instanceof Error) {
//         console.error('Email service: Error details:', error.message);
//         console.error('Email service: Error stack:', error.stack);
//       }
//       console.error('Email service: Additional error properties:', JSON.stringify(error, null, 2));
//       throw new Error('Failed to verify email connection');
//     }
//   }
// }

// export const emailService = new EmailService();

// // Verify the connection when the service is initialized
// emailService.verifyConnection().catch(console.error);

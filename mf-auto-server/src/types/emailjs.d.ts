// declare module '@emailjs/nodejs' {
//   interface EmailJSResponseStatus {
//     status: number;
//     text: string;
//   }

//   interface EmailJSInit {
//     publicKey: string;
//     privateKey: string;
//   }

//   function init(options: EmailJSInit): void;

//   function send(
//     serviceID: string,
//     templateID: string,
//     templateParams: Record<string, unknown>,
//     userID?: string
//   ): Promise<EmailJSResponseStatus>;

//   export { init, send, EmailJSResponseStatus, EmailJSInit };
// }
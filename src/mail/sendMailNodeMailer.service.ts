import nodemailer, { Transporter } from "nodemailer";
import ISendMail from "./sendMailPort.interface";
import ContentEmails from "./contentEmail";

class EmailSendNodeMailerService implements ISendMail {
  private transporter: Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  private mailOptions(
    emails: string,
    subjects: string,
    lien: string,
    textButton: string,
    text: string,
  ) {
    const options = {
      from: `Club IA-IMSP ${process.env.EMAIL_USERNAME}`,
      to: emails,
      subject: subjects,
      html: ContentEmails(lien, textButton, text),
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
    };
    return options;
  }

  private mailOptions2(
    email: string,
    subjects: string,
    yourName: string,
    texts: string,
  ) {
    const options = {
      from: `${process.env.EMAIL_USERNAME}`,
      to: `${process.env.EMAIL_USERNAME}`,
      subject: `${yourName}, ${email}, ${subjects}`,
      text: texts,
    };
    return options;
  }

  private mailOptions3(emails: string, subject: string, text: string) {
    const options = {
      from: `Club IA-IMSP ${process.env.EMAIL_USERNAME}`,
      to: "undisclosed-recipients:;",
      bcc: emails,
      subject: subject,
      text: text,
    };
    return options;
  }

  public async contactUs(
    userEmail: string,
    yourName: string,
    subject: string,
    message: string,
  ): Promise<void> {
    await this.transporter.sendMail(
      this.mailOptions2(userEmail, subject, yourName, message),
    );
  }

  public async sendMailToSubscriber(
    userEmail: string,
    subject: string,
    text: string,
  ): Promise<void> {
    await this.transporter.sendMail(
      this.mailOptions3(userEmail, subject, text),
    );
  }

  public async sendMailTo(
    userEmail: string,
    subject: string,
    lien: string,
    textButton: string,
    text: string,
  ): Promise<void> {
    await this.transporter.sendMail(
      this.mailOptions(userEmail, subject, lien, textButton, text),
    );
  }
}

export default EmailSendNodeMailerService;

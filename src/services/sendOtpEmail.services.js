import nodemailer from "nodemailer"
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.email")
});

const env = process.env;

const generateOtp = ()=>{
    return Math.floor(1000+Math.random()*9000);
}

const sendOtpEmail = async(email,otp)=>{


    const transporter = await nodemailer.createTransport({
        service:"gmail",
        auth :{
            user:env.EMAIL,
            pass:env.PASSWORD
        }
    })
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email Verification</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
            <td align="center" style="padding:40px 10px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
                
                <!-- Header -->
                <tr>
                    <td style="background:#0f172a; padding:20px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px;">CreatorHub</h1>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:30px;">
                    <h2 style="color:#111827; margin-top:0;">Verify your email address</h2>
                    <p style="color:#374151; font-size:15px; line-height:1.6;">
                        Thanks for signing up for <strong>CreatorHub</strong>.
                        To complete your registration, please use the verification code below.
                    </p>

                    <!-- OTP Box -->
                    <div style="margin:30px 0; text-align:center;">
                        <span style="
                        display:inline-block;
                        padding:15px 30px;
                        font-size:28px;
                        letter-spacing:6px;
                        color:#0f172a;
                        background:#f1f5f9;
                        border-radius:6px;
                        font-weight:bold;
                        ">
                        ${otp}
                        </span>
                    </div>

                    <p style="color:#374151; font-size:14px;">
                        This OTP is valid for <strong>10 minutes</strong>.
                        Please do not share this code with anyone.
                    </p>

                    <p style="color:#6b7280; font-size:13px; margin-top:30px;">
                        If you didn’t create a CreatorHub account, you can safely ignore this email.
                    </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#f9fafb; padding:20px; text-align:center;">
                    <p style="margin:0; font-size:12px; color:#9ca3af;">
                        © ${new Date().getFullYear()} CreatorHub. All rights reserved.
                    </p>
                    </td>
                </tr>

                </table>
            </td>
            </tr>
        </table>
        </body>
        </html>
        `;
    await  transporter.sendMail({
        from:"CreatorHub",
        to:email,
        subject:"Verification OTP",
        html:html
    })
}

export {sendOtpEmail,generateOtp};
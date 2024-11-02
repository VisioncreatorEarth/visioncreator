import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    id: z.string(),
    subject: z.string().min(3).max(75),
    body: z.string().min(10).max(2000),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, input, user }) => {
    if (input.id !== user?.customClaims?.id) {
      throw new AuthorizationError({ message: "User ID does not match." });
    }
    if (!user || !user.email) {
      return {
        success: false,
        message: "User not authenticated or email not available",
      };
    }

    // Query the username from Supabase profiles table
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("name")
      .eq("id", user.customClaims.id)
      .single();

    let name = "Visioncreator";
    if (error) {
      console.error("Error fetching user profile:", error);
    } else {
      name = profile.name || "Visioncreator";
    }

    try {
      const response = await context.postmark.sendEmail({
        From: "hello@visioncreator.earth",
        To: user.email,
        Cc: "hello@visioncreator.earth",
        Subject: input.subject,
        TextBody: input.body,
        HtmlBody: `
        <!DOCTYPE html>
        <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
        <head>
          <meta charset="utf-8">
          <meta name="x-apple-disable-message-reformatting">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <!--[if mso]>
              <noscript>
                <xml>
                  <o:OfficeDocumentSettings
                    xmlns:o="urn:schemas-microsoft-com:office:office"
                  >
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
                </xml>
              </noscript>
              <style>
                td,
                th,
                div,
                p,
                a,
                h1,
                h2,
                h3,
                h4,
                h5,
                h6 {
                  font-family: "Segoe UI", sans-serif;
                  mso-line-height-rule: exactly;
                }
              </style>
            <![endif]-->
          <style>
            @media screen and (max-width: 600px) {
              .mobile-width-full {
                width: 100% !important;
              }
            }
            .hover-underline:hover {
              text-decoration: underline !important;
            }
            @media (max-width: 600px) {
              .sm-w-75px {
                width: 75px !important;
              }
              .sm-p-6 {
                padding: 24px !important;
              }
              .sm-px-4 {
                padding-left: 16px !important;
                padding-right: 16px !important;
              }
              .sm-py-8 {
                padding-top: 32px !important;
                padding-bottom: 32px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; width: 100%; background-color: #0d1132; padding: 0; -webkit-font-smoothing: antialiased; word-break: break-word">
          <div role="article" aria-roledescription="email" aria-label lang="en">
            <div class="sm-py-8" style="padding-top: 48px; padding-bottom: 48px; text-align: center">
              <a href="https://visioncreator.earth">
                <img src="https://visioncreator.earth/logo.png" width="100" alt="Visioncreator" style="vertical-align: middle; max-width: 100%; height: auto; width: 100px" class="sm-w-75px">
              </a>
            </div>
            <div class="sm-px-4" style="text-align: center; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif">
              <table align="center" class="mobile-width-full" style="max-width: 600px" width="100%" cellpadding="0" cellspacing="0" role="none">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" style="width: 100%;" role="none">
                      <tr>
                        <td class="sm-p-6" style="border-radius: 24px; background-color: #10153d; padding: 48px; font-size: 16px; color: #f0ede5; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)">
                          <table style="width: 100%; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;" cellpadding="0" cellspacing="0" role="none">
                            <tr>
                              <td align="left">
                                <table style="width: 100%;" cellpadding="0" cellspacing="0" role="none">
                                  <tr>
                                    <td style="text-align: left">
                                      <table style="width: 100%;" cellpadding="0" cellspacing="0" role="none">
                                        <tr>
                                          <td style="padding-bottom: 24px">
                                            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #f6f4ef">
                                              Great to hear from you, ${name}!
                                            </h1>
                                          </td>
                                        </tr>
                                      </table>
                                      <p style="margin: 0 0 32px; font-size: 14px; color: #e5e0d2">
                                        Your message is important to us. We'll do our best to get back
                                        to you within the next 2 working days. Thank you for your
                                        patience.
                                      </p>
                                      <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; text-transform: uppercase; color: #c4beab">
                                        Your Message
                                      </p>
                                      <table style="width: 100%;" cellpadding="0" cellspacing="0" role="none">
                                        <tr>
                                          <td style="padding-bottom: 16px">
                                            <p style="margin: 0; font-size: 18px; color: #f0ede5">
                                              ${input.subject}
                                            </p>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding-bottom: 32px">
                                            <p style="margin: 0; font-size: 14px; color: #f0ede5;">
                                              ${input.body}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 24px; text-align: center; font-size: 12px; color: #a3a7c2">
                          <p style="margin: 0 0 8px; font-weight: 700; text-transform: uppercase">Powered by</p>
                          <p style="margin: 0 0 8px;">
                            Visioncreator GmbH <br>
                            Reifenstuelstr. 6, DE-80469 München
                          </p>
                          <div style="margin: 16px 0">
                            <p style="margin: 8px 0 0">+49 89 55926086</p>
                            <a href="mailto:hello@visioncreator.earth" class="hover-underline" style="color: #c6c8d9">hello@visioncreator.earth</a>
                          </div>
                          <br>
                          <p style="margin: 0 0 8px;">
                            Registration Court: <br>Amtsgericht München, HRB 292608<br><br>
                            CEO: Yvonne Müller, Samuel Andert
                            <br>
                            VAT-ID: DE368356417
                          </p>
                          <p style="margin: 16px 0 0">
                            <a href="https://visioncreator.earth/en/privacy-policy" class="hover-underline" style="color: #c6c8d9;">Privacy Policy - Datenschutz</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
        </html>
        `,
      });

      return {
        success: true,
        message: "Email sent successfully",
        messageId: response.MessageID,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: "Failed to send email",
        error: error.message || "An unknown error occurred",
      };
    }
  },
});

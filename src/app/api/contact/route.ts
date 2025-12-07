import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    // Send email notification to the team
    // Note: Update the 'to' email to your actual inbox
    await resend.emails.send({
      from: "GalaxyCo.ai <noreply@galaxyco.ai>",
      to: [process.env.CONTACT_EMAIL || "hello@galaxyco.ai"],
      replyTo: validated.email,
      subject: `[Contact Form] ${validated.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${validated.name} (${validated.email})</p>
        ${validated.company ? `<p><strong>Company:</strong> ${validated.company}</p>` : ""}
        <p><strong>Subject:</strong> ${validated.subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${validated.message.replace(/\n/g, "<br />")}</p>
      `,
    });

    // Send confirmation email to the user
    await resend.emails.send({
      from: "GalaxyCo.ai <noreply@galaxyco.ai>",
      to: [validated.email],
      subject: "We received your message - GalaxyCo.ai",
      html: `
        <h2>Thanks for reaching out!</h2>
        <p>Hi ${validated.name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>Here's a copy of what you sent:</p>
        <hr />
        <p><strong>Subject:</strong> ${validated.subject}</p>
        <p>${validated.message.replace(/\n/g, "<br />")}</p>
        <hr />
        <p>Best,<br />The GalaxyCo.ai Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

# Support System Setup

**Effective Date:** December 16, 2025  
**Primary Support:** support@galaxyco.ai  
**Response SLA:** 24 hours (beta period)

---

## Email Setup

### Primary Support Email

**Email:** support@galaxyco.ai  
**Forward To:** dalton@galaxyco.ai (or primary operational email)

### Configuration Steps

1. **Set Up Email Forwarding**
   - Configure support@galaxyco.ai in domain registrar
   - Forward all emails to primary operational email
   - Test by sending test email

2. **Create Email Filters** (Gmail/Outlook)
   - Label: `GalaxyCo Support`
   - Auto-star for visibility
   - Optional: Desktop notifications

3. **Set Up Auto-Reply**

```
Subject: Thanks for reaching out to GalaxyCo Support

Hi there,

Thanks for contacting GalaxyCo Support! I typically respond within 24 hours during the week.

In the meantime, you might find answers in our documentation:
→ https://galaxyco.ai/docs

For urgent issues, you can also reach out on Twitter: @galaxyco_ai

Best,
Dalton
Founder, GalaxyCo
```

---

## Email Templates

### 1. Welcome Email (Automated - sent after signup)

**Subject:** Welcome to GalaxyCo! 🚀

```
Hey [Name],

Welcome to GalaxyCo! You're part of our founding beta community.

Here's how to get started:

1. **Explore the Dashboard**
   Log in and check out Neptune AI, your intelligent assistant. Ask it anything!

2. **Add Your First Contact**
   Head to the CRM and create your first lead. Watch Neptune suggest next actions automatically.

3. **Upload a Document**
   Try the Knowledge Base. Upload a doc and see how semantic search works.

Quick Links:
• Documentation: https://galaxyco.ai/docs
• Community: [Discord/Slack link when available]
• Feature Requests: [Link to feedback form]

We're actively building based on beta feedback. Have ideas? Hit reply - I read every email.

Let's build something great together!

Dalton
Founder, GalaxyCo
support@galaxyco.ai
```

---

### 2. Bug Report Response

**Subject:** Re: [Issue Description]

```
Hey [Name],

Thanks for reporting this! Bugs are gold during beta.

Quick questions to help me reproduce and fix:
• What browser are you using? (Chrome, Firefox, Safari, etc.)
• Can you share a screenshot of what you're seeing?
• What were you trying to do when this happened?

I'm looking into it now and will update you within 24 hours.

If this is blocking you from using GalaxyCo, let me know and we'll prioritize getting you unblocked.

Thanks for your patience!

Dalton
support@galaxyco.ai
```

---

### 3. Feature Request Response

**Subject:** Re: Feature Request - [Feature Name]

```
Hey [Name],

Love this idea! [Specific comment on why it's interesting/valuable]

I'm adding it to our roadmap. Can I ask a few follow-up questions to understand your use case better?

1. [Specific question about their workflow]
2. [Question about priority]
3. [Question about alternatives they've tried]

Would you be open to a quick 15-minute call? Your insights would really help us build this right.

Also adding you to the list to beta test this when we build it.

Thanks for the feedback!

Dalton
support@galaxyco.ai
```

---

### 4. General Question Response

**Subject:** Re: Question about [Topic]

```
Hey [Name],

Great question! Here's how [Feature/Thing] works:

[Clear, step-by-step explanation]

We also have documentation on this here: [link]

Let me know if that helps or if you need me to clarify anything!

Dalton
support@galaxyco.ai
```

---

### 5. Account/Billing Issue

**Subject:** Re: Account Issue

```
Hey [Name],

I'm looking into this right now.

For context, during our public beta (through January 2026), everything is completely free. No credit card required, no hidden fees.

[Specific response to their issue]

Let me know if this resolves it or if you're still having trouble!

Dalton
support@galaxyco.ai
```

---

### 6. Integration Request

**Subject:** Re: Integration Request - [Integration Name]

```
Hey [Name],

Thanks for requesting [Integration]! This is exactly the kind of feedback we need.

Quick questions:
1. How would you use this integration in your workflow?
2. What's your priority: 1-10?
3. What tool are you currently using instead?

Right now we're focused on:
• [Integration 1]
• [Integration 2]
• [Integration 3]

But [Requested Integration] is on our list. If we get 5+ requests for it, we'll bump it up.

I'll keep you posted!

Dalton
support@galaxyco.ai
```

---

### 7. Positive Feedback / Testimonial

**Subject:** Re: [Positive Message]

```
Hey [Name],

This made my day! 🙏

Would you be open to me sharing this feedback (with your permission)?

Also - since you're finding value, would love to hop on a quick call to hear:
• What's working well
• What could be better
• What features you'd want next

Your insights would really help shape where we take the product.

Either way, thank you for the kind words and for being part of our beta!

Dalton
support@galaxyco.ai
```

---

### 8. Cancellation/Churn (When Applicable)

**Subject:** Sorry to see you go

```
Hey [Name],

Sorry to hear you're leaving GalaxyCo.

Before you go, would you mind sharing:
1. What led you to try GalaxyCo?
2. What didn't work for you?
3. What would have made you stay?

Your feedback is invaluable - even (especially) when things don't work out.

If you change your mind or want to give it another shot in the future, we'll be here.

Thanks for giving us a shot!

Dalton
support@galaxyco.ai
```

---

### 9. "How Do I..." Question

**Subject:** Re: How do I [Action]?

```
Hey [Name],

Here's how to [Action]:

Step 1: [Clear instruction]
Step 2: [Clear instruction]
Step 3: [Clear instruction]

[Optional: Screenshot or video walkthrough link]

Pro tip: [Helpful hint related to their question]

Let me know if you get stuck!

Dalton
support@galaxyco.ai
```

---

### 10. Press/Partnership Inquiry

**Subject:** Re: [Inquiry Type]

```
Hey [Name],

Thanks for reaching out!

For [press/partnership/business] inquiries, please email me directly at:
dalton@galaxyco.ai

I'll get back to you within 48 hours.

Looking forward to connecting!

Dalton
Founder, GalaxyCo
```

---

## In-App Feedback Widget

### Implementation

**Tool Options:**
- Canny (feedback boards)
- Tally (simple forms)
- Custom built with Radix Dialog

### Feedback Form Fields

```
Title: Quick Feedback

Description:
We're actively building based on your input. What should we know?

Fields:
1. Feedback Type (dropdown)
   - Bug Report
   - Feature Request
   - General Feedback
   - Something's Broken

2. Your Feedback (textarea)
   Placeholder: "Tell us what's on your mind..."

3. Email (optional, pre-filled if logged in)

4. Priority (optional, 1-5 stars)

Submit Button: Send Feedback
```

### Auto-Response After Submission

```
Thanks for your feedback! 🙏

We review every submission. If you included your email, we'll follow up if we need more details.

Keep the feedback coming - you're helping shape GalaxyCo!

- The Team
```

---

## Support Channels Priority

### 1. Email (Primary)
- support@galaxyco.ai
- 24-hour response time
- All inquiries welcome

### 2. Twitter/X (Secondary)
- @galaxyco_ai
- Quick questions only
- Public visibility

### 3. LinkedIn (Tertiary)
- Dalton's DMs
- Professional inquiries
- Partnership discussions

### 4. In-App Widget (When Built)
- Feature requests
- Bug reports
- Quick feedback

---

## Knowledge Base (Placeholder)

### High-Priority Help Articles to Write

1. **Getting Started**
   - Account setup
   - First login walkthrough
   - Dashboard overview

2. **Common Questions**
   - How to add contacts
   - How to use Neptune AI
   - How to upload documents
   - How to create workflows
   - How to connect integrations

3. **Troubleshooting**
   - Login issues
   - Browser compatibility
   - Performance problems
   - Data import errors

4. **Account Management**
   - Changing password
   - Updating profile
   - Managing team members
   - Workspace settings

---

## Support Metrics to Track

| Metric | Target | Notes |
|--------|--------|-------|
| First Response Time | <24 hours | Average time to first reply |
| Resolution Time | <48 hours | Average time to close ticket |
| Customer Satisfaction | >4.5/5 | Post-resolution survey |
| Email Volume | Track | Daily support emails received |
| Top Issues | Track | Most common support requests |
| Bug Reports | Track | Unique bugs reported per week |
| Feature Requests | Track | Unique features requested |

---

## Weekly Support Review

### Every Monday Morning

- [ ] Review last week's support volume
- [ ] Identify top 3 issues
- [ ] Check if any patterns emerging
- [ ] Update knowledge base if needed
- [ ] Prioritize bug fixes
- [ ] Add top feature requests to roadmap

### Questions to Ask

1. What broke most often?
2. What confused users most?
3. What features were requested most?
4. Any emergency situations?
5. Any particularly happy/unhappy users?

---

## Escalation Path

### Level 1: Email Support (Dalton)
- All initial inquiries
- General questions
- Feature requests
- Bug reports

### Level 2: Technical (When Needed)
- Complex technical issues
- Database problems
- Integration failures
- Security concerns

### Level 3: Emergency
- Site down
- Data loss
- Security breach
- Critical bug affecting all users

**Emergency Contact:** [Phone number]  
**Emergency Protocol:** [Link to incident response doc]

---

## Tools & Resources

### Email Management
- **Gmail Filters** for organization
- **Canned Responses** for common questions
- **Labels** for categorization

### Feedback Management
- **Notion** for tracking feedback (temporary)
- **Canny** for public roadmap (when ready)
- **GitHub Issues** for bug tracking

### Documentation
- **Notion** or **GitBook** for knowledge base
- **Loom** for video walkthroughs
- **Screenshots** with annotations

---

## Next Steps

1. [ ] Set up support@galaxyco.ai email forwarding
2. [ ] Configure auto-reply message
3. [ ] Create Gmail filters and labels
4. [ ] Save all email templates in Gmail
5. [ ] Set up feedback form (Tally or custom)
6. [ ] Create initial knowledge base articles
7. [ ] Test support email end-to-end
8. [ ] Document any additional support channels

---

**Remember:** During beta, support is a product development tool, not just customer service. Every email is an insight into what users need.

Treat every support interaction as an opportunity to:
- Build relationships
- Gather feedback
- Improve the product
- Create advocates

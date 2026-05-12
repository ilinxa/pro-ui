import type { FormSchema } from "./types";

// ─── 1. Registration form ────────────────────────────────────────────────────

export const registrationFormSchema: FormSchema = {
  meta: {
    id: "registration",
    version: "1",
    title: "Create your account",
    description:
      "All fields are required. We'll send a verification email to the address below.",
  },
  fields: [
    {
      name: "firstName",
      type: "text",
      label: "First name",
      placeholder: "Hessam",
      validators: { required: true, minLength: 2 },
      width: "half",
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      type: "text",
      label: "Last name",
      placeholder: "Hezaveh",
      validators: { required: true, minLength: 2 },
      width: "half",
      autoComplete: "family-name",
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      placeholder: "you@example.com",
      validators: { required: true },
      autoComplete: "email",
    },
    {
      name: "password",
      type: "password",
      label: "Password",
      validators: {
        required: true,
        minLength: { value: 8, message: "Use at least 8 characters" },
      },
      description: "8+ characters. Mix in a number or symbol for extra strength.",
      autoComplete: "new-password",
    },
    {
      name: "acceptTos",
      type: "checkbox",
      label: "I accept the Terms of Service and Privacy Policy.",
      validators: { required: "You must accept the terms to continue" },
    },
  ],
};

// ─── 2. Contact form ─────────────────────────────────────────────────────────

export const contactFormSchema: FormSchema = {
  meta: {
    title: "Contact us",
    description: "We respond within one business day.",
  },
  fields: [
    {
      name: "topic",
      type: "select",
      label: "Topic",
      placeholder: "Pick a topic",
      validators: { required: true },
      options: [
        { value: "support", label: "Technical support" },
        { value: "sales", label: "Sales" },
        { value: "billing", label: "Billing" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "email",
      type: "email",
      label: "Your email",
      placeholder: "you@example.com",
      validators: { required: true },
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      placeholder: "How can we help?",
      rows: 5,
      validators: { required: true, minLength: 20, maxLength: 2000 },
    },
    {
      name: "newsletter",
      type: "switch",
      label: "Also send me product updates (about one per month).",
    },
  ],
};

// ─── 3. Conditional form (showcases visibleWhen / enabledWhen / requiredWhen) ─

export const conditionalFormSchema: FormSchema = {
  meta: {
    title: "Tell us about your project",
    description:
      "Fields adapt to your answers — `Other` reveals a free-text reason, `Annually` requires billing details.",
  },
  fields: [
    {
      name: "_section_basics",
      type: "section",
      label: "Basics",
    },
    {
      name: "projectName",
      type: "text",
      label: "Project name",
      validators: { required: true },
    },
    {
      name: "kind",
      type: "radio-group",
      label: "Project type",
      validators: { required: true },
      options: [
        { value: "internal", label: "Internal tool" },
        { value: "public", label: "Public product" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "otherKindReason",
      type: "text",
      label: "Tell us more",
      placeholder: "Briefly describe the project",
      visibleWhen: { field: "kind", equals: "other" },
      requiredWhen: { field: "kind", equals: "other" },
    },
    {
      name: "_section_billing",
      type: "section",
      label: "Billing",
    },
    {
      name: "cadence",
      type: "select",
      label: "Billing cadence",
      defaultValue: "monthly",
      options: [
        { value: "monthly", label: "Monthly" },
        { value: "annually", label: "Annually (save 20%)" },
      ],
    },
    {
      name: "company",
      type: "text",
      label: "Company name",
      visibleWhen: { field: "cadence", equals: "annually" },
      requiredWhen: { field: "cadence", equals: "annually" },
    },
    {
      name: "vatId",
      type: "text",
      label: "VAT ID",
      placeholder: "Optional",
      enabledWhen: { field: "cadence", equals: "annually" },
    },
  ],
};

// ─── 4. Computed form + sections ─────────────────────────────────────────────

export const computedFormSchema: FormSchema = {
  meta: {
    title: "User profile",
    description: "`displayName` and `domain` update live as you type.",
  },
  fields: [
    {
      name: "_section_identity",
      type: "section",
      label: "Identity",
    },
    {
      name: "firstName",
      type: "text",
      label: "First name",
      defaultValue: "Hessam",
      width: "half",
    },
    {
      name: "lastName",
      type: "text",
      label: "Last name",
      defaultValue: "Hezaveh",
      width: "half",
    },
    {
      name: "displayName",
      type: "computed",
      label: "Display name",
      expression: "{firstName} {lastName}",
    },
    {
      name: "_divider1",
      type: "divider",
    },
    {
      name: "_section_contact",
      type: "section",
      label: "Contact",
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      defaultValue: "hessam@example.com",
    },
    {
      name: "domain",
      type: "computed",
      label: "Email domain",
      compute: ({ values }) => {
        const email = values.email;
        if (typeof email !== "string") return "";
        const at = email.indexOf("@");
        return at >= 0 ? email.slice(at + 1) : "";
      },
    },
  ],
};

// ─── 5. Rich-fields form (code + slider + rating) ────────────────────────────

export const richFieldsFormSchema: FormSchema = {
  meta: {
    title: "Submit a snippet",
    description:
      "Showcases the `code`, `richtext`, `slider`, and `rating` field types.",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Title",
      validators: { required: true, maxLength: 80 },
    },
    {
      name: "summary",
      type: "richtext",
      label: "Summary",
      placeholder: "Write a short description with bold, lists, links…",
      defaultValue: [
        {
          type: "p",
          children: [{ text: "" }],
        },
      ],
    },
    {
      name: "lang",
      type: "select",
      label: "Language",
      defaultValue: "typescript",
      options: [
        { value: "typescript", label: "TypeScript" },
        { value: "javascript", label: "JavaScript" },
        { value: "python", label: "Python" },
        { value: "json", label: "JSON" },
      ],
    },
    {
      name: "source",
      type: "code",
      label: "Source",
      lang: "typescript",
      defaultValue: "function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n",
      validators: { required: true },
    },
    {
      name: "complexity",
      type: "slider",
      label: "Complexity",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
    },
    {
      name: "rating",
      type: "rating",
      label: "Your rating",
      config: { rating: { stars: 5 } },
      defaultValue: 4,
    },
  ],
};

// ─── 6. Admin user form (mixed kitchen-sink) ─────────────────────────────────

export const adminUserFormSchema: FormSchema = {
  meta: {
    title: "Edit user",
    description: "All field families in a single form.",
  },
  fields: [
    {
      name: "_section_account",
      type: "section",
      label: "Account",
    },
    {
      name: "username",
      type: "text",
      label: "Username",
      validators: { required: true, pattern: "^[a-z0-9_-]{3,32}$" },
      description: "Lowercase letters, digits, underscores, and hyphens. 3–32 chars.",
      width: "half",
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      validators: { required: true },
      width: "half",
    },
    {
      name: "role",
      type: "radio-group",
      label: "Role",
      defaultValue: "member",
      options: [
        { value: "owner", label: "Owner" },
        { value: "admin", label: "Admin" },
        { value: "member", label: "Member" },
      ],
    },
    {
      name: "permissions",
      type: "checkbox-group",
      label: "Permissions",
      options: [
        { value: "read", label: "Read" },
        { value: "write", label: "Write" },
        { value: "publish", label: "Publish" },
        { value: "delete", label: "Delete" },
      ],
      defaultValue: ["read"],
    },
    {
      name: "_section_profile",
      type: "section",
      label: "Profile",
    },
    {
      name: "bio",
      type: "textarea",
      label: "Bio",
      rows: 3,
      validators: { maxLength: 280 },
    },
    {
      name: "joinedOn",
      type: "date",
      label: "Joined on",
      defaultValue: "2026-01-01",
      width: "half",
    },
    {
      name: "vacationRange",
      type: "date-range",
      label: "Next vacation",
      width: "half",
    },
    {
      name: "shiftStart",
      type: "time",
      label: "Shift start",
      defaultValue: "09:00",
      width: "half",
    },
    {
      name: "appointmentAt",
      type: "datetime",
      label: "Next appointment",
      width: "half",
    },
    {
      name: "notifications",
      type: "switch",
      label: "Email notifications",
      defaultValue: true,
    },
    {
      name: "csrf",
      type: "hidden",
      defaultValue: "csrf-token-abc123",
    },
  ],
};

// ─── Async resolver (for the backend-driven demo tab) ────────────────────────

/**
 * Mock backend that "fetches" a schema by id. Resolves after 800ms.
 * Used by the demo's "Backend-driven" tab.
 */
export async function mockFetchSchema(formId: string): Promise<FormSchema> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  switch (formId) {
    case "contact":
      return contactFormSchema;
    case "rich":
      return richFieldsFormSchema;
    case "admin":
      return adminUserFormSchema;
    case "registration":
    default:
      return registrationFormSchema;
  }
}

import type { JevState, JevQuestions } from "@/lib/jev";

type ExampleDefinition = {
  questions: JevQuestions;
  samples: { label: string; state: JevState }[];
};

const booleanExample = {
  questions: {
    requestsRefund: {
      type: "boolean",
      instructions:
        "Is the customer asking for money they have already paid to be returned?",
      criteria: {
        true: "Explicitly requests a refund or reversal of a duplicate charge",
        false:
          "A general billing question, plan change, or cancellation inquiry before payment",
      },
    },
  },
  samples: [
    {
      label: "Refund request",
      state:
        "I was charged twice for the same order. Please refund the duplicate charge.",
    },
    {
      label: "General inquiry",
      state:
        "I would like to switch to an annual plan starting next month. Please tell me how.",
    },
    {
      label: "Ambiguous wording",
      state:
        "Something seems wrong with yesterday's payment. Could you check it?",
    },
  ],
} satisfies ExampleDefinition;

const choiceExample = {
  questions: {
    department: {
      type: "choice",
      instructions:
        "Which department should handle this request first? Choose review if there is not enough information.",
      criteria: {
        billing: "Payments, invoices, duplicate charges, and refunds",
        technical: "Errors, connection failures, and features that do not work",
        account: "Account details, account deletion, and permission management",
        review:
          "Unclear requests or issues outside the scope of the other departments",
      },
    },
  },
  samples: [
    {
      label: "Billing",
      state:
        "This month's invoice includes a charge for an add-on I did not use.",
    },
    {
      label: "Technical support",
      state: "Uploading a file returns a 500 error and stops the task.",
    },
    {
      label: "Account",
      state:
        "I would like to change the email address and administrator permissions on my account.",
    },
    { label: "Insufficient information", state: "I need help." },
  ],
} satisfies ExampleDefinition;

const scoreExample = {
  questions: {
    severity: {
      type: "score",
      instructions:
        "Assess how much the reported issue prevents users from completing their main tasks. Use only the stated impact and available workarounds, without guessing.",
      criteria: [
        "A cosmetic issue only; all functionality remains available",
        "Some functionality is inconvenient, but users can complete their main tasks with a simple workaround",
        "Some users cannot complete their main tasks and have no workaround",
        "A full outage prevents all users from completing their main tasks",
      ],
    },
  },
  samples: [
    {
      label: "Cosmetic issue",
      state:
        "A button icon is slightly misaligned. All functionality, including clicks and payments, works normally.",
    },
    {
      label: "Workaround available",
      state:
        "The export button does not work, but all users can complete the task by downloading from the menu.",
    },
    {
      label: "Full outage",
      state:
        "Payments are failing for all users. There is no workaround, and no orders can be completed.",
    },
  ],
} satisfies ExampleDefinition;

const mixedExample = {
  questions: {
    ...booleanExample.questions,
    ...choiceExample.questions,
    ...scoreExample.questions,
  },
  samples: [
    {
      label: "Object state",
      state: {
        message:
          "I was charged twice, and my order did not complete. Please refund the duplicate charge.",
        incident: { affectedUsers: "Some users", workaround: "None" },
      },
    },
    {
      label: "Conversation array",
      state: [
        { role: "customer", text: "I cannot download the report." },
        {
          role: "agent",
          text: "You can download it as a CSV from the export menu.",
        },
        { role: "customer", text: "That worked. I downloaded it. Thank you." },
      ],
    },
    {
      label: "String state",
      state:
        "I would like to change my account email address. I have no problems using the service.",
    },
  ],
} satisfies ExampleDefinition;

export const examples = {
  boolean: booleanExample,
  choice: choiceExample,
  score: scoreExample,
  mixed: mixedExample,
} satisfies Record<string, ExampleDefinition>;

export type ExampleId = keyof typeof examples;
export const exampleIds = Object.keys(examples) as ExampleId[];

export function isExampleId(value: string): value is ExampleId {
  return Object.hasOwn(examples, value);
}

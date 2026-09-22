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

const citiesExample = {
  questions: {
    livability: {
      type: "score",
      instructions:
        "How good a place to live does the supplied city description suggest for a resident who values transport, work opportunities, everyday amenities, and access to nature or culture equally? Evaluate only the description, not the city's reputation or your outside knowledge. Treat missing information as unknown, not as a benefit or a problem. Do not invent housing costs, safety levels, or service quality. This is an illustrative assessment of a short description, not an official city ranking.",
      criteria: [
        "Very poor fit: the description shows severe barriers to everyday life with few compensating benefits",
        "Poor fit: the described drawbacks outweigh the practical benefits",
        "Mixed or unclear fit: benefits and drawbacks are balanced, or there is too little evidence for a strong judgment",
        "Good fit: the description provides concrete benefits across several priorities, with no stated major barrier",
        "Very good fit: the description provides strong, concrete benefits across all four priorities, with no stated major barrier",
      ],
    },
  },
  samples: [
    {
      label: "Seoul",
      state: {
        city: "Seoul",
        description:
          "Seoul is South Korea's capital. Subway connections link neighborhoods with markets, museums, and cultural venues. Hangang parks and Seoul Forest provide places for walking, cycling, and outdoor recreation within the city.",
      },
    },
    {
      label: "Busan",
      state: {
        city: "Busan",
        description:
          "Busan is a coastal port city in southeastern South Korea. Its metro, buses, and rail connections serve urban travel. Beaches, coastal walking routes, markets, and cultural neighborhoods offer a range of leisure activities alongside the port economy.",
      },
    },
    {
      label: "Daegu",
      state: {
        city: "Daegu",
        description:
          "Daegu is an inland city with a textile industry and textile research institutions. Industrial areas include Seongseo and Daegu Technopolis. City buses connect destinations including research facilities, supporting travel between parts of the city.",
      },
    },
    {
      label: "Incheon",
      state: {
        city: "Incheon",
        description:
          "Incheon is home to an international airport and the Songdo business and convention district. Subway and bus services connect destinations such as the Incheon Urban History Museum. Songdo Central Park provides walking paths, water activities, and cultural attractions near shopping and exhibition facilities.",
      },
    },
    {
      label: "Gwangju",
      state: {
        city: "Gwangju",
        description:
          "Gwangju is a southwestern city with a cultural industry and programs centered on arts and local history. Mudeungsan provides mountain scenery and walking destinations. Neighborhood markets, including Mudeung Market, combine everyday shopping with local cultural activities.",
      },
    },
    {
      label: "Daejeon",
      state: {
        city: "Daejeon",
        description:
          "Daejeon is a science and research city in central South Korea, home to KAIST and the Daedeok research area. Railway and expressway connections make it a transport hub. The National Science Museum offers exhibitions and educational activities in the city.",
      },
    },
    {
      label: "Ulsan",
      state: {
        city: "Ulsan",
        description:
          "Ulsan has an industrial economy centered on automotive manufacturing, shipbuilding, and petrochemicals. Taehwagang National Garden, Baengnidae Forest, and Ulsan Grand Park provide green spaces and outdoor recreation alongside the city's industrial areas.",
      },
    },
    {
      label: "Sejong",
      state: {
        city: "Sejong",
        description:
          "Sejong is a special self-governing city with a planned administrative district and central government offices. Bus rapid transit serves the government complex area. Sejong Lake Park and the National Sejong Arboretum provide outdoor spaces, while the city is expanding its cultural facilities.",
      },
    },
    {
      label: "Changwon",
      state: {
        city: "Changwon",
        description:
          "Changwon was formed by merging Changwon, Masan, and Jinhae in 2010. Its economy includes the Changwon National Industrial Complex and Masan Free Trade Zone. Machang Bridge links the Masan and Changwon areas, while Jinhae Marine Park provides a coastal recreation destination.",
      },
    },
    {
      label: "Cheongju",
      state: {
        city: "Cheongju",
        description:
          "Cheongju merged with Cheongwon County in 2014, bringing urban and surrounding rural areas into one city. It includes the Osong life-science and Ochang science complexes, Cheongju International Airport, and Osong KTX station. The Jikji Festival provides cultural activities linked to the city's printing heritage.",
      },
    },
  ],
} satisfies ExampleDefinition;

export const examples = {
  boolean: booleanExample,
  choice: choiceExample,
  score: scoreExample,
  mixed: mixedExample,
  cities: citiesExample,
} satisfies Record<string, ExampleDefinition>;

export type ExampleId = keyof typeof examples;
export const exampleIds = Object.keys(examples) as ExampleId[];

export function isExampleId(value: string): value is ExampleId {
  return Object.hasOwn(examples, value);
}

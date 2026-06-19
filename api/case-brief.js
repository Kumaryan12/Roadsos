const briefSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" }
    },
    severityRationale: { type: "string" },
    immediateChecklist: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" }
    },
    verificationQuestions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" }
    },
    dispatchMessage: { type: "string" },
    contactMessage: { type: "string" },
    riskFlags: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: { type: "string" }
    }
  },
  required: [
    "summary",
    "severityRationale",
    "immediateChecklist",
    "verificationQuestions",
    "dispatchMessage",
    "contactMessage",
    "riskFlags"
  ]
};

const allowedCaseFields = [
  "id",
  "triggerType",
  "detectionSource",
  "sosSource",
  "status",
  "severity",
  "victimIdentityStatus",
  "confidenceLevel",
  "confidenceScore",
  "verificationRequired",
  "victimSituationSummary",
  "situationSummary",
  "recommendedAction",
  "reportedVehicleNumber",
  "reportedVehicleNumberNormalized",
  "vehicleType",
  "approxAge",
  "gender",
  "victimsCount",
  "conditionAnswers",
  "severityAnswers",
  "sensorData",
  "location"
];

const maskPhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");

  if (digits.length < 4) return "";

  return `***${digits.slice(-4)}`;
};

const pick = (source, fields) => {
  return fields.reduce((acc, field) => {
    if (source?.[field] !== undefined && source?.[field] !== null) {
      acc[field] = source[field];
    }

    return acc;
  }, {});
};

const sanitizeCase = (rawCase = {}) => {
  const safeCase = pick(rawCase, allowedCaseFields);

  if (safeCase.location) {
    safeCase.location = {
      latitude: safeCase.location.latitude,
      longitude: safeCase.location.longitude,
      accuracy: safeCase.location.accuracy
    };
  }

  if (rawCase.user) {
    safeCase.victimProfile = {
      roadSosId: rawCase.user.roadSosId || "",
      name: rawCase.user.name || "Known victim",
      age: rawCase.user.age || "",
      gender: rawCase.user.gender || "",
      bloodGroup: rawCase.user.bloodGroup || "",
      emergencyContactMasked: maskPhone(rawCase.user.emergencyContact),
      medicalConditions: rawCase.user.medicalConditions || "",
      allergies: rawCase.user.allergies || "",
      vehicles: rawCase.user.vehicles?.map((vehicle) => ({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        primary: Boolean(vehicle.primary)
      }))
    };
  }

  if (rawCase.matchedVictim) {
    safeCase.matchedVictim = {
      roadSosId: rawCase.matchedVictim.roadSosId || "",
      name: rawCase.matchedVictim.name || "Matched victim",
      age: rawCase.matchedVictim.age || "",
      gender: rawCase.matchedVictim.gender || "",
      bloodGroup: rawCase.matchedVictim.bloodGroup || "",
      emergencyContactMasked: maskPhone(rawCase.matchedVictim.emergencyContact),
      medicalConditions: rawCase.matchedVictim.medicalConditions || "",
      allergies: rawCase.matchedVictim.allergies || ""
    };
  }

  if (rawCase.bystander) {
    safeCase.bystander = {
      name: rawCase.bystander.name || "Unknown reporter",
      profileSource: rawCase.bystander.profileSource || "",
      roadSosId: rawCase.bystander.roadSosId || "",
      phoneMasked: maskPhone(rawCase.bystander.phone)
    };
  }

  return safeCase;
};

const getSituationSummary = (safeCase) => {
  return (
    safeCase.victimSituationSummary ||
    safeCase.situationSummary ||
    safeCase.recommendedAction ||
    "No situation summary was supplied."
  );
};

const buildFallbackBrief = (safeCase, reason = "Groq is not configured.") => {
  const severity = safeCase.severity || "Unknown";
  const trigger = safeCase.triggerType || "Unknown trigger";
  const identity = safeCase.victimIdentityStatus || "Unknown";
  const hasVehicle = Boolean(safeCase.reportedVehicleNumber);
  const hasKnownVictim = Boolean(safeCase.victimProfile || safeCase.matchedVictim);

  return {
    summary: [
      `${trigger} case is currently marked ${severity}.`,
      getSituationSummary(safeCase),
      `Victim identity status is ${identity}; reporter confidence is ${safeCase.confidenceLevel || "not labelled"}.`
    ],
    severityRationale:
      "Fallback brief generated from RoadSoS rule-based fields. Treat the stored severity as the operational label and verify on scene.",
    immediateChecklist: [
      "Confirm exact location and route the nearest available responder.",
      "Check for fire, smoke, road blockage, unconsciousness, bleeding, or multiple victims.",
      hasKnownVictim
        ? "Review known medical profile and emergency contact details."
        : "Attempt victim identification through vehicle number or reporter callback.",
      "Update case status as soon as help is assigned."
    ],
    verificationQuestions: [
      "Is the victim conscious and breathing?",
      "Is the road blocked or unsafe for responders?",
      hasVehicle
        ? "Does the visible vehicle number match the reported vehicle number?"
        : "Can a vehicle number or other identity clue be collected?"
    ],
    dispatchMessage:
      `RoadSoS ${severity} case: ${getSituationSummary(safeCase)} Location and identity details require responder verification.`,
    contactMessage:
      "RoadSoS alert: a road emergency may involve your contact. Responders are reviewing the case and will verify details before action.",
    riskFlags: [
      reason,
      ...(severity === "Critical" ? ["Critical severity label"] : []),
      ...(safeCase.verificationRequired ? ["Verification required"] : [])
    ]
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const safeCase = sanitizeCase(req.body?.sosCase);

    if (!safeCase.id && !safeCase.triggerType) {
      return res.status(400).json({ error: "Missing SOS case payload." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        brief: buildFallbackBrief(safeCase),
        source: "fallback"
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0.2,
        max_completion_tokens: 1400,
        messages: [
          {
            role: "system",
            content:
              "You are an emergency response operations assistant for RoadSoS. " +
              "Use only the supplied case data. Do not diagnose, guarantee identity, " +
              "or replace responder judgment. Be concise, practical, and calm."
          },
          {
            role: "user",
            content:
              "Create a responder-facing AI case brief for this road emergency case. " +
              "Mention uncertainty clearly and keep all action language advisory.\n\n" +
              JSON.stringify(safeCase, null, 2)
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "roadsos_case_brief",
            strict: true,
            schema: briefSchema
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        brief: buildFallbackBrief(
          safeCase,
          data.error?.message || "Groq failed to generate the case brief."
        ),
        source: "fallback"
      });
    }

    const outputText = data.choices?.[0]?.message?.content;

    if (!outputText) {
      return res.status(200).json({
        brief: buildFallbackBrief(safeCase, "Groq returned an empty brief."),
        source: "fallback"
      });
    }

    return res.status(200).json({ brief: JSON.parse(outputText), source: "groq" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to generate case brief." });
  }
}

export interface ConsentTemplateSeed {
  key: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

// Signature lines are drawn by the PDF (digital seals, timestamp, SHA-256), not in the body.

export const consentTemplateSeeds: ConsentTemplateSeed[] = [
  {
    key: "general-treatment",
    title: "General Dental Treatment Consent",
    category: "general",
    description: "Broad consent covering examination, diagnosis and routine dental treatment.",
    content: `GENERAL DENTAL TREATMENT CONSENT

I, [PATIENT NAME], authorise the clinician and staff of [CLINIC NAME] to perform the dental examination, diagnostic procedures (including radiographs) and treatment that have been explained to me.

1. Diagnosis. I understand a full diagnosis may only be possible after examination and radiographs, and that the treatment plan may change once treatment begins.
2. Treatment discussed: [TREATMENT DESCRIPTION].
3. Alternatives. The alternatives, including no treatment at all, and their likely outcomes have been explained to me.
4. Risks. Common risks include discomfort, swelling, bruising, bleeding, sensitivity, infection, and the possibility that a tooth may require further treatment or removal.
5. Fees. The estimated fee is [AMOUNT]. I understand additional procedures may change this estimate and will be discussed with me where possible.
6. Questions. I have had the opportunity to ask questions and my questions have been answered to my satisfaction.
7. Withdrawal. I understand I may withdraw my consent at any time before or during treatment.`,
  },
  {
    key: "extraction",
    title: "Tooth Extraction Consent",
    category: "surgical",
    description: "Simple and surgical extraction, including wisdom teeth.",
    content: `CONSENT FOR TOOTH EXTRACTION

I consent to the removal of tooth / teeth [TOOTH NUMBER] by [CLINICIAN NAME].

Reason for extraction: [REASON].

I understand the following risks have been explained to me:
1. Pain, swelling and bruising for several days after the procedure.
2. Bleeding, which may require additional treatment.
3. Infection, including dry socket, which may need further visits.
4. Injury to adjacent teeth, fillings, crowns or bone.
5. Numbness or altered sensation of the lip, chin, tongue or gums, which is usually temporary but can rarely be permanent.
6. Sinus communication for upper back teeth, which may require additional treatment.
7. Jaw joint discomfort or limited mouth opening.
8. Fractured root tips that may be safer to leave in place.
9. Need for sectioning of the tooth or removal of bone (surgical extraction).

Post-operative instructions have been provided to me and I agree to follow them. I have disclosed all medications, allergies and medical conditions, including blood thinners and bisphosphonates.`,
  },
  {
    key: "root-canal",
    title: "Root Canal Treatment Consent",
    category: "endodontic",
    description: "Endodontic therapy, retreatment and possible complications.",
    content: `CONSENT FOR ROOT CANAL (ENDODONTIC) TREATMENT

I consent to root canal treatment of tooth [TOOTH NUMBER].

1. Purpose. Root canal treatment removes infected or damaged pulp tissue to try to save the tooth.
2. Success. The procedure has a high but not guaranteed success rate. Some teeth do not heal and may require retreatment, surgery (apicectomy) or extraction.
3. Number of visits. Treatment may require more than one visit: [NUMBER OF VISITS].
4. Risks include post-operative pain or swelling, instrument separation within the canal, perforation of the root, canals that cannot be located or fully cleaned, cracked or discoloured tooth structure, and irritation from irrigating solutions.
5. Restoration. A permanent restoration, often a crown, is required after treatment. Without it the tooth may fracture and be lost. This cost is separate: [AMOUNT].
6. Untreated infection. I understand that not treating the tooth may lead to spreading infection, pain and tooth loss.`,
  },
  {
    key: "implant",
    title: "Dental Implant Consent",
    category: "implant",
    description: "Implant placement, healing period and restorative phase.",
    content: `CONSENT FOR DENTAL IMPLANT TREATMENT

I consent to the placement of [NUMBER] dental implant(s) at site(s) [TOOTH NUMBER], with any necessary bone or soft tissue grafting.

1. Procedure. An implant is placed in the jaw bone and, after healing of approximately [HEALING PERIOD], restored with an abutment and crown, bridge or denture.
2. Risks include infection, implant failure or loosening requiring removal, bone loss, gum recession, injury to nerves resulting in temporary or permanent numbness, sinus involvement, damage to adjacent teeth, and fracture of the implant or restoration.
3. Grafting. Additional bone or membrane material of human, animal or synthetic origin may be required. This has been explained and accepted.
4. Maintenance. Long-term success depends on oral hygiene, regular reviews and refraining from smoking. Failure to maintain the implant may void any warranty.
5. Fees. Surgical fee: [AMOUNT]. Restorative fee: [AMOUNT]. I understand the total treatment spans several appointments.
6. No guarantee. I understand no guarantee of outcome has been given.`,
  },
  {
    key: "orthodontic",
    title: "Orthodontic Treatment Consent",
    category: "orthodontic",
    description: "Braces or aligner therapy, duration and retention requirements.",
    content: `CONSENT FOR ORTHODONTIC TREATMENT

I consent to orthodontic treatment using [APPLIANCE TYPE] for [PATIENT NAME].

1. Duration. The estimated treatment time is [DURATION]. Poor cooperation, missed appointments, broken appliances or unusual growth may lengthen treatment.
2. Risks include discomfort, mouth ulceration, decalcification or decay if hygiene is poor, gum inflammation and recession, root shortening, tooth or root resorption, non-vital teeth, jaw joint symptoms, relapse of tooth position and, rarely, the need for surgery or extractions.
3. Extractions. Treatment may require the removal of teeth: [TOOTH NUMBER].
4. Retention. I understand that retainers must be worn as instructed, indefinitely in most cases, and that teeth will move if retainers are not worn.
5. Hygiene and diet. I agree to maintain excellent oral hygiene, attend recall visits and avoid hard or sticky foods.
6. Fees. Total fee: [AMOUNT], payable as agreed. Additional fees apply to replacement of lost or broken appliances and retainers.`,
  },
  {
    key: "anaesthesia",
    title: "Local Anaesthesia & Sedation Consent",
    category: "anaesthesia",
    description: "Local anaesthetic and conscious sedation risks and instructions.",
    content: `CONSENT FOR LOCAL ANAESTHESIA AND / OR SEDATION

I consent to the administration of local anaesthesia and, where indicated, conscious sedation for the procedure: [TREATMENT DESCRIPTION].

1. Local anaesthesia risks include pain on injection, prolonged numbness, bruising or haematoma, trismus (limited opening), self-inflicted trauma to the numb lip or tongue, rapid heartbeat, and rarely allergic reaction or nerve injury.
2. Sedation risks include nausea, vomiting, headache, drowsiness, over-sedation requiring reversal, breathing difficulty and, very rarely, serious cardiorespiratory events.
3. Pre-operative instructions. I confirm I have followed the fasting instructions given: [FASTING INSTRUCTIONS].
4. Escort and driving. If sedated, I confirm a responsible adult will accompany me home and that I will not drive, operate machinery or sign legal documents for 24 hours.
5. Disclosure. I have disclosed all medical conditions, pregnancy, allergies, recreational drug and alcohol use, and all medications I take.`,
  },
  {
    key: "whitening",
    title: "Teeth Whitening Consent",
    category: "cosmetic",
    description: "In-office or home whitening, sensitivity and result expectations.",
    content: `CONSENT FOR TEETH WHITENING

I consent to tooth whitening using [WHITENING SYSTEM], performed in the clinic and/or at home as instructed.

1. Results vary. The final shade cannot be guaranteed. Teeth with grey, tetracycline or intrinsic staining respond less well.
2. Restorations. Fillings, crowns, veneers and bridges do not whiten and may need replacing at additional cost to match the new shade.
3. Risks include tooth sensitivity, gum or lip irritation and short-term white patches on the enamel, which usually settle within a few days.
4. Longevity. Whitening fades over time. Tea, coffee, red wine and tobacco accelerate relapse. Top-up treatment may be required at additional cost.
5. Not suitable. Whitening is not recommended during pregnancy or breastfeeding, or for patients under 18 without specific advice.
6. Home kits. I agree to follow the wear-time instructions and to keep the gel out of reach of children.`,
  },
  {
    key: "minors",
    title: "Consent for Treatment of a Minor",
    category: "minors",
    description: "Parent or guardian authorisation, including treatment in their absence.",
    content: `PARENTAL / GUARDIAN CONSENT FOR TREATMENT OF A MINOR

I, [GUARDIAN NAME], confirm that I am the parent or legal guardian of [PATIENT NAME], date of birth [DATE OF BIRTH], and that I have the legal authority to consent to their dental treatment.

1. I consent to examination, radiographs, preventive care and the treatment explained to me: [TREATMENT DESCRIPTION].
2. Behaviour management. I understand techniques such as tell-show-do, voice control, distraction and, where agreed, protective stabilisation or sedation may be used, and these have been explained to me.
3. Treatment in my absence. I authorise / do not authorise (delete as applicable) treatment when the child attends accompanied by [AUTHORISED ADULT].
4. Emergency care. In an emergency where I cannot be reached, I authorise necessary treatment to relieve pain or control infection.
5. Fees. I accept responsibility for the fees arising from this treatment.`,
  },
  {
    key: "photography-data",
    title: "Clinical Photography & Data Consent",
    category: "privacy",
    description: "Records, photographs and their use for teaching or marketing.",
    content: `CONSENT FOR CLINICAL PHOTOGRAPHY, RECORDS AND DATA PROCESSING

I consent to [CLINIC NAME] taking and storing clinical photographs, radiographs, scans and video of my teeth, mouth and face as part of my dental record.

1. Clinical use. These records are used for diagnosis, treatment planning, monitoring progress and communication with laboratories and other clinicians involved in my care.
2. Additional use. I agree / do not agree (delete as applicable) to my anonymised images being used for teaching, publication and clinic marketing including social media and the clinic website.
3. Identification. I understand that images of the face may make me identifiable and that consent for marketing use may be withdrawn at any time, although material already published may not be retrievable.
4. Data protection. My personal and health data is processed lawfully, stored securely and retained for the period required by law. I may request access to or correction of my records.
5. Third parties. Data may be shared with insurers, referral clinicians or regulators only where I have authorised it or where required by law.`,
  },
  {
    key: "financial",
    title: "Financial Agreement & Payment Plan Consent",
    category: "financial",
    description: "Fees, deposits, instalments, cancellations and outstanding balances.",
    content: `FINANCIAL AGREEMENT AND PAYMENT POLICY

Patient: [PATIENT NAME]   Treatment: [TREATMENT DESCRIPTION]   Estimated total: [AMOUNT]

1. Estimates. Fees quoted are estimates based on the current treatment plan. Any change to the plan will be discussed and re-quoted where possible.
2. Payment terms. A deposit of [AMOUNT] is payable before treatment begins. The balance is payable [PAYMENT TERMS].
3. Payment plan. Where agreed, instalments of [AMOUNT] are payable on [SCHEDULE]. Missed instalments may pause treatment and attract a late fee of [LATE FEE].
4. Cancellations. Appointments cancelled with less than [NOTICE PERIOD] notice, or missed without notice, may attract a fee of [CANCELLATION FEE].
5. Insurance. Any insurance or HMO benefit is an arrangement between me and my provider. I remain responsible for the full balance if a claim is declined or partly paid.
6. Outstanding balances. Unpaid balances may be referred for recovery, and I accept responsibility for reasonable recovery costs.
7. Refunds. Laboratory work and materials already made for me are non-refundable.`,
  },
];

/** Maps a booked procedure name to the keyword of the consent template that fits it. */
const consentKeywordRules: { match: RegExp; keyword: string }[] = [
  { match: /extract|wisdom|surgical|removal/i, keyword: "extraction" },
  { match: /root canal|endo|rct|pulp/i, keyword: "root canal" },
  { match: /implant/i, keyword: "implant" },
  { match: /ortho|brace|aligner/i, keyword: "orthodontic" },
  { match: /whiten|bleach/i, keyword: "whitening" },
  { match: /sedation|anaesth|anesth/i, keyword: "anaesthesia" },
  { match: /payment plan|financ/i, keyword: "financial" },
];

export function suggestConsentTemplate(procedure: string): string | null {
  if (!procedure) return null;
  return consentKeywordRules.find((r) => r.match.test(procedure))?.keyword || null;
}

import type { ConsentTemplateSeed } from "@/data/consentTemplates";

const sig = `\nPatient / Guardian name: [PATIENT NAME]\nSignature: ______________________   Date: [DATE]\nClinician name: [CLINICIAN NAME]\nSignature: ______________________   Date: [DATE]\nWitness (if applicable): ______________________`;

export const eyeConsentTemplateSeeds: ConsentTemplateSeed[] = [
  {
    key: "general-eye-treatment",
    title: "General Eye Examination & Treatment Consent",
    category: "general",
    description: "Broad consent covering eye examination, diagnostic testing and routine eye care.",
    content: `GENERAL EYE EXAMINATION & TREATMENT CONSENT

I, [PATIENT NAME], authorise the clinician and staff of [CLINIC NAME] to perform the eye examination, diagnostic procedures (including imaging, visual field testing and photography) and treatment that have been explained to me.

1. Diagnosis. I understand a full diagnosis may only be possible after examination and investigations, and that the plan may change as results become available.
2. Treatment discussed: [TREATMENT DESCRIPTION].
3. Alternatives. The alternatives, including no treatment at all, and their likely outcomes have been explained to me.
4. Risks. Common risks include temporary blurred vision, light sensitivity, redness, discomfort and, rarely, infection or a change in vision.
5. Fees. The estimated fee is [AMOUNT]. Additional procedures may change this estimate and will be discussed with me where possible.
6. Questions. I have had the opportunity to ask questions and my questions have been answered to my satisfaction.
7. Withdrawal. I understand I may withdraw my consent at any time.
${sig}`,
  },
  {
    key: "dilation",
    title: "Pupil Dilation Consent",
    category: "diagnostic",
    description: "Consent for dilating eye drops used to examine the retina and optic nerve.",
    content: `PUPIL DILATION CONSENT

I, [PATIENT NAME], consent to the instillation of dilating eye drops so that the inside of my eye(s) can be examined.

1. Purpose. Dilation allows a thorough view of the retina, optic nerve and lens.
2. Effects. My vision will be blurred (especially for reading) and unusually sensitive to light for approximately 4-6 hours.
3. Driving. I understand I should not drive or operate machinery until my vision returns to normal, and I have arranged transport if needed.
4. Risks. Rarely, dilation can raise eye pressure (acute angle closure), causing pain, redness and blurred vision. I will seek urgent care if this happens.
5. Allergy. I have disclosed any known allergy to eye drops or medications.
${sig}`,
  },
  {
    key: "cataract-surgery",
    title: "Cataract Surgery Consent",
    category: "surgical",
    description: "Consent for phacoemulsification with intraocular lens implantation.",
    content: `CATARACT SURGERY CONSENT

I, [PATIENT NAME], consent to cataract surgery on my [EYE: RIGHT / LEFT] eye with implantation of an intraocular lens.

1. Procedure. The cloudy natural lens will be removed and replaced with an artificial lens, usually under local anaesthesia.
2. Expected benefit. Improved clarity of vision. Glasses may still be required after surgery.
3. Risks. Infection (endophthalmitis), bleeding, raised eye pressure, swelling of the retina or cornea, posterior capsule rupture, retinal detachment, lens dislocation, need for further surgery and, rarely, loss of vision.
4. Lens choice discussed: [TREATMENT DESCRIPTION].
5. Alternatives. Continuing with glasses and no surgery has been explained to me.
6. Aftercare. I agree to use prescribed drops and attend all follow-up visits.
7. Fees. The estimated fee is [AMOUNT].
${sig}`,
  },
  {
    key: "refractive-surgery",
    title: "Refractive Surgery (LASIK / PRK) Consent",
    category: "surgical",
    description: "Consent for laser vision correction procedures.",
    content: `REFRACTIVE SURGERY (LASIK / PRK) CONSENT

I, [PATIENT NAME], consent to laser vision correction on my [EYE: RIGHT / LEFT / BOTH].

1. Procedure. The corneal shape will be altered with a laser to reduce dependence on glasses or contact lenses.
2. Outcome. Perfect vision cannot be guaranteed; an enhancement procedure may be required, and reading glasses may still be needed with age.
3. Risks. Dry eye, glare and haloes at night, undercorrection or overcorrection, flap complications, infection, corneal haze, ectasia and, rarely, loss of best-corrected vision.
4. Eligibility. I confirm I have disclosed my full medical and ocular history, including any autoimmune disease or pregnancy.
5. Aftercare. I agree to use prescribed drops, avoid rubbing my eyes and attend all follow-up visits.
6. Fees. The estimated fee is [AMOUNT].
${sig}`,
  },
  {
    key: "intravitreal-injection",
    title: "Intravitreal Injection Consent",
    category: "procedure",
    description: "Consent for anti-VEGF or steroid injections into the eye.",
    content: `INTRAVITREAL INJECTION CONSENT

I, [PATIENT NAME], consent to an injection of [TREATMENT DESCRIPTION] into my [EYE: RIGHT / LEFT] eye.

1. Purpose. To treat retinal disease such as macular degeneration, diabetic macular oedema or retinal vein occlusion.
2. Course. Repeated injections are usually required; the schedule will be reviewed at each visit.
3. Risks. Discomfort, floaters, subconjunctival haemorrhage, raised eye pressure, cataract, retinal detachment and, rarely, endophthalmitis (serious infection) which can cause loss of vision.
4. Warning signs. I will seek urgent care for increasing pain, redness or reduced vision after the injection.
5. Fees. The estimated fee is [AMOUNT] per injection.
${sig}`,
  },
  {
    key: "contact-lens",
    title: "Contact Lens Fitting & Wear Consent",
    category: "optical",
    description: "Consent and safe-wear agreement for contact lens fitting.",
    content: `CONTACT LENS FITTING & WEAR CONSENT

I, [PATIENT NAME], consent to contact lens fitting and agree to the wear and care instructions provided.

1. Fitting. Trial lenses, measurements and follow-up assessments form part of the fitting process.
2. Hygiene. I will wash my hands before handling lenses, use only recommended solutions, and never use tap water or saliva.
3. Wear schedule. I will observe the wear time and replacement schedule prescribed: [TREATMENT DESCRIPTION].
4. Risks. Corneal abrasion, infection (microbial keratitis), neovascularisation, allergy and dryness — risks increase with overnight wear and poor hygiene.
5. Warning signs. I will remove my lenses and contact the clinic for pain, redness, discharge or blurred vision.
6. Reviews. I agree to attend aftercare appointments before prescription renewal.
${sig}`,
  },
  {
    key: "ophthalmic-imaging-data",
    title: "Ophthalmic Imaging & Data Consent",
    category: "records",
    description: "Consent for retinal photography, OCT and use of images for records or teaching.",
    content: `OPHTHALMIC IMAGING & DATA CONSENT

I, [PATIENT NAME], consent to ophthalmic imaging (including retinal photography, OCT, topography and visual field records) at [CLINIC NAME].

1. Purpose. Images form part of my clinical record and support diagnosis and monitoring.
2. Storage. Images and data are stored securely and handled in line with applicable data protection law.
3. Additional use. I [DO / DO NOT] consent to anonymised use of my images for teaching, audit or publication.
4. Access. I may request a copy of my records at any time.
${sig}`,
  },
  {
    key: "minors-eye",
    title: "Consent for Eye Care of a Minor",
    category: "general",
    description: "Parent or guardian consent for examination and treatment of a child.",
    content: `CONSENT FOR EYE CARE OF A MINOR

I, [PATIENT NAME], am the parent or legal guardian of the child named below and consent to eye examination and treatment at [CLINIC NAME].

1. Procedures may include vision testing, cycloplegic refraction (dilating drops), imaging and prescription of spectacles.
2. Cycloplegic drops cause blurred near vision and light sensitivity for several hours, occasionally up to 24 hours.
3. I have disclosed the child's medical history, medications and allergies.
4. Estimated fee: [AMOUNT].
${sig}`,
  },
  {
    key: "financial-eye",
    title: "Financial Agreement & Payment Plan Consent",
    category: "financial",
    description: "Payment terms for eye care, spectacles and optical orders.",
    content: `FINANCIAL AGREEMENT & PAYMENT PLAN CONSENT

I, [PATIENT NAME], agree to the fees and payment terms for care at [CLINIC NAME].

1. Estimate. The estimated cost of treatment and any optical order is [AMOUNT].
2. Custom orders. Spectacles and custom contact lenses are made to my prescription and may be non-refundable once ordered.
3. Instalments. Where a payment plan is agreed, I will keep to the agreed schedule.
4. Outstanding balances. Collection of items may be withheld until the balance is settled.
${sig}`,
  },
];

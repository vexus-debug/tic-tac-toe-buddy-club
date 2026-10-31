/**
 * Long-form continuations appended to each article body (by slug).
 * Style rule: no em dashes in article copy.
 */
import type { ArticleBlock } from "./articles";

export const articleExtensions: Record<string, ArticleBlock[]> = {
  "why-patients-abandon-root-canal-treatment": [
    { type: "h2", text: "The conversation that changes everything" },
    { type: "p", text: "Most dentists explain the procedure. Very few explain the consequence. The patient hears words like \"canal\", \"dressing\" and \"crown\", nods politely, and walks out with only one clear idea in his head: the pain will stop. That is the only promise he remembers, so when it comes true, he believes the job is done." },
    { type: "p", text: "Try a different conversation. Before you even pick up the file, tell him plainly: \"Today we stop the pain. Next week we seal the tooth so the infection cannot return. Then we protect it with a crown, because a tooth without its nerve becomes brittle, like dry wood. If you stop after today, there is a real chance we will be removing this tooth in a few months.\" That one honest paragraph does more for completion rates than any reminder system." },
    { type: "p", text: "Patients are not careless. They are busy, stretched and often afraid of the next bill. When they understand that stopping halfway is the expensive option, most of them choose to finish." },
    { type: "h2", text: "Who owns the patient between visits?" },
    { type: "p", text: "Ask your team this question and watch the silence. In many clinics, the gap between visit one and visit two belongs to nobody. The dentist thinks the front desk is handling it. The front desk thinks the patient will call. The patient thinks the clinic will remind him. Three people waiting on each other, and the tooth quietly getting worse." },
    { type: "p", text: "Give the gap an owner. One named person reviews every open treatment plan each morning, calls the patients who have drifted past their date, and writes down what was said. It takes fifteen minutes a day. Over a year it can be the difference between a clinic that finishes its work and one that keeps starting it." },
    { type: "list", items: [
      "Monday: review every plan with a missed stage from the previous week.",
      "Wednesday: call patients whose next stage is due within seven days and confirm.",
      "Friday: close plans that are truly abandoned, with a note explaining why, so your numbers stay honest.",
    ] },
    { type: "h2", text: "When the patient finally comes back" },
    { type: "p", text: "Some will return months later with a broken tooth and a little embarrassment. How you receive them matters. A lecture sends them away again; warmth brings them back for good. Acknowledge that life gets in the way, show them on the chart exactly where they stopped, and give them a fresh, realistic plan. You are not just saving a tooth. You are rebuilding trust that will carry the rest of their family to your chair." },
    { type: "h2", text: "The bigger picture" },
    { type: "p", text: "Unfinished root canals are rarely a clinical problem. They are a communication and follow-up problem dressed up as one. Fix the conversation on day one, give the gap an owner, make payment manageable and keep every pending stage visible. Do those four things consistently and you will find that the patients who used to disappear start coming back, finishing their treatment, and telling their friends about the dentist who actually followed through." },
  ],

  "dental-lab-cases-lost-in-lagos-traffic": [
    { type: "h2", text: "What the patient actually experiences" },
    { type: "p", text: "From the inside, a late crown feels like a scheduling hiccup. From the patient's side it feels very different. She has explained to her manager why she needs another morning off. She has paid for transport twice. She has walked around for weeks with a temporary that feels strange on her tongue. When she arrives and the crown is not ready, she is not thinking about lab logistics. She is wondering whether she chose the right clinic." },
    { type: "p", text: "That is why lab chaos is not just an operational nuisance. It is one of the quietest ways a good clinic loses its reputation. The dentistry can be excellent and the patient will still remember the wasted trip more than the perfect margin." },
    { type: "h2", text: "Build a working relationship with your technician" },
    { type: "p", text: "Many clinics treat the lab like a vendor to be blamed. The best clinics treat it like a partner to be equipped. Your technician cannot read a smudged slip, guess a shade from a phone photo taken under fluorescent light, or meet a deadline nobody told them about." },
    { type: "list", items: [
      "Send clear, complete instructions every time: tooth, material, shade, margin, opposing model, and any special notes.",
      "Agree on standard turnaround times per case type, written down, so nobody negotiates from memory.",
      "Share a single shared status for each case, so both sides see the same truth.",
      "Review late cases together once a month, without blame, and fix the cause.",
    ] },
    { type: "p", text: "When the technician feels respected and informed, the quality of work rises along with the reliability. Remakes drop, because fewer cases start with missing information." },
    { type: "h2", text: "Plan for the bad days" },
    { type: "p", text: "Lagos will always have traffic, rain, fuel scarcity and the occasional dispatch rider who simply does not show up. You cannot remove those risks, but you can plan around them. Build buffer days into fitting appointments. Call the patient the day before to confirm the case has arrived. If it has not, reschedule early and kindly, before she leaves home, rather than apologising when she is already in your waiting room." },
    { type: "quote", text: "Patients forgive delays they were warned about. They rarely forgive delays they discover on arrival." },
    { type: "h2", text: "Records turn frustration into improvement" },
    { type: "p", text: "Once every case has a timeline, patterns appear. Perhaps one lab is consistently three days late on zirconia. Perhaps impressions sent on Fridays always arrive on Tuesdays. Perhaps a particular material has a higher remake rate. None of this is visible when everything lives on paper and memory. With a clear record, you stop arguing about what happened and start deciding what to change." },
    { type: "p", text: "The goal is simple: every patient who books a fitting finds her crown waiting for her. Get there, and the lab stops being a source of stress and becomes part of the reason patients trust you." },
  ],

  "stop-front-desk-leakage-dental-clinic": [
    { type: "h2", text: "Leakage is usually a system problem, not a people problem" },
    { type: "p", text: "It is tempting to think of revenue leakage as theft. Occasionally it is. But far more often, money slips away through gaps nobody designed on purpose: a treatment done but never billed because the dentist forgot to write it down, a discount given out of kindness and never recorded, a transfer that came in but was never matched to a patient, a balance that was meant to be collected next visit and simply forgotten." },
    { type: "p", text: "Each of these is small. Together, over a year, they can quietly equal the salary of a full staff member. And because nobody sees them happen, the clinic owner only feels the effect: busy chairs, but a bank balance that never seems to match how hard everyone is working." },
    { type: "h2", text: "Close the day properly" },
    { type: "p", text: "The single most powerful habit is a proper end-of-day close. Not a quick glance at the drawer, but a short, consistent routine that compares what was done clinically with what was billed and what was received." },
    { type: "list", items: [
      "Every patient seen today has an invoice, even if the amount is zero.",
      "Every invoice shows how it was paid: cash, transfer, POS or balance owing.",
      "Cash in the drawer matches cash recorded, and differences are written down with a reason.",
      "Transfers are matched to the right patient before the day is closed, not at month end.",
    ] },
    { type: "p", text: "This takes ten to fifteen minutes. It also takes away almost all the confusion that builds up when reconciliation is left until the end of the month, when nobody remembers who paid what." },
    { type: "h2", text: "Make discounts visible, not forbidden" },
    { type: "p", text: "Discounts are part of how clinics care for people. A widow, a long-standing family, a staff relative. The problem is not the discount itself. The problem is the discount nobody can see. When every reduction is recorded with who approved it and why, generosity stays a choice instead of becoming a leak." },
    { type: "h2", text: "Talk to your team before you change anything" },
    { type: "p", text: "New controls can feel like an accusation. Introduce them as protection. Explain that clear records mean nobody honest will ever be blamed for a missing ₦20,000. Most front desk staff are relieved, because they have been carrying the anxiety of a messy system for years. When they understand that the system is there to support them, they become its strongest supporters." },
    { type: "p", text: "Leakage does not stop because you shouted at it. It stops because, day after day, every treatment becomes a bill and every bill finds its payment. Build that rhythm, and the money you have already earned will finally arrive where it belongs." },
  ],

  "patients-take-prescription-buy-glasses-elsewhere": [
    { type: "h2", text: "Understand what the patient is really choosing" },
    { type: "p", text: "When a patient walks out with your prescription and buys frames from a roadside seller, it is easy to feel insulted. You did the careful work, and someone else collects the reward. But step back and look at the decision from her side. She is not choosing a worse optician. She is choosing what feels cheaper, faster and less intimidating." },
    { type: "p", text: "Many patients have never been shown the difference between a properly centred lens and a cheap one cut by guesswork. They do not know that the wrong pupillary distance causes headaches, or that poor coatings scratch within weeks. Nobody told them, so price becomes the only thing they can compare." },
    { type: "h2", text: "Educate without selling" },
    { type: "p", text: "The most effective dispensaries never feel like shops. They feel like the second half of the consultation. While the patient is still in the chair, explain in simple words what her prescription means for her daily life: reading on her phone, driving at night, long hours on a laptop. Then show how the right lens solves the exact problem she described to you." },
    { type: "p", text: "This is not a sales trick. It is care. When she understands why the details matter, she starts to value the person who can get them right." },
    { type: "h2", text: "Remove the reasons to walk away" },
    { type: "list", items: [
      "Have options at several price points, so nobody leaves because the only frames on display felt too expensive.",
      "Give a clear collection date and honour it. Speed is part of the value.",
      "Offer a simple adjustment and fitting guarantee, so she knows you will stand behind the glasses.",
      "Make the walk from consulting room to dispensary short, both physically and in the conversation.",
    ] },
    { type: "h2", text: "Respect the patient who still leaves" },
    { type: "p", text: "Some patients will still take the prescription elsewhere, and that is their right. Give it to them clearly and graciously. Then follow up a week later to ask how the new glasses feel. If they are struggling with headaches or blurred vision, you will be the first person they think of. Many of your most loyal dispensary customers will be people who tried somewhere cheaper first and came back to the clinic that treated them with respect." },
    { type: "p", text: "The goal is not to trap patients. It is to make your dispensary the obvious, trusted choice, so that going elsewhere simply never feels necessary." },
  ],

  "tracking-glaucoma-patients-over-years": [
    { type: "h2", text: "Glaucoma is a story told across many visits" },
    { type: "p", text: "A single pressure reading tells you almost nothing. A trend across five years tells you nearly everything. Glaucoma care is fundamentally about change over time: whether pressures are stable on the current drops, whether the visual field is slowly narrowing, whether the optic disc looks different from the last time someone examined it carefully." },
    { type: "p", text: "When those readings live in paper files, scattered across folders, written by different hands with different methods, the story falls apart. The clinician in front of the patient today sees a number, not a trajectory. Decisions get made on snapshots instead of history." },
    { type: "h2", text: "The patient is carrying more than you see" },
    { type: "p", text: "Many glaucoma patients feel nothing. Their vision seems fine. They are asked to buy drops every month, often expensive ones, for a disease they cannot feel, and to come back again and again for tests that seem to show nothing new. It is not surprising that so many drift away." },
    { type: "p", text: "This is where good records become a tool of compassion. When you can show a patient their own chart, the pressure that was high before treatment and is now controlled, or the field test that has stayed stable because they kept using their drops, the disease becomes real and the effort becomes worth it. People stay committed to what they can see working." },
    { type: "h2", text: "Build habits that protect the patient" },
    { type: "list", items: [
      "Record pressures with the same method and note the time of day, so readings are comparable.",
      "Keep visual fields and disc images attached to the patient, not filed in a separate drawer.",
      "Set recall intervals deliberately for each patient and follow up when they are missed.",
      "Ask about drop adherence every visit, gently, and write down the answer.",
    ] },
    { type: "h2", text: "Continuity even when staff change" },
    { type: "p", text: "Optometrists move, doctors rotate, and receptionists resign. A glaucoma patient may be seen by four different clinicians over a decade. The record is the one thing that stays. When it is complete, clear and easy to read, every new clinician inherits the full picture, and the patient never has to start again from zero." },
    { type: "p", text: "Glaucoma steals sight quietly. Careful, continuous records are one of the few ways a clinic can fight back just as quietly, visit after visit, year after year." },
  ],

  "contact-lens-stock-and-reorders": [
    { type: "h2", text: "Loyalty is fragile when the shelf is empty" },
    { type: "p", text: "Contact lens wearers are creatures of habit. They found a lens that feels comfortable, a solution that does not sting, and a clinic that understands their eyes. Most of them would happily buy from you for years. But the first time they come in and hear \"we are out of stock, check back next week\", the habit breaks. They search online, find the lens somewhere else, and you may never see them again." },
    { type: "p", text: "The painful part is that the patient was not looking to leave. You simply gave them a reason." },
    { type: "h2", text: "Predict the reorder before the patient does" },
    { type: "p", text: "Every fitting tells you something valuable: the lens type, the replacement schedule and how many boxes the patient took home. From that, you can estimate almost exactly when they will run out. A monthly lens wearer who bought a six-month supply will need you again in about six months. That is not a guess. It is a date." },
    { type: "list", items: [
      "Note the supply dispensed at every visit, not just the prescription.",
      "Send a friendly reminder a few weeks before the supply should run out.",
      "Hold or pre-order stock for regular wearers, so their lenses are waiting.",
      "Recheck fit and eye health at sensible intervals, rather than simply reselling.",
    ] },
    { type: "h2", text: "Stock is money sitting on the shelf" },
    { type: "p", text: "The opposite problem is just as real. Overstocking unusual powers ties up cash, and lenses expire. The answer is not to buy more, but to buy smarter. When you can see which brands and powers actually move, and which patients are due, ordering becomes a clear calculation instead of a nervous guess before the supplier's deadline." },
    { type: "h2", text: "Care beyond the box" },
    { type: "p", text: "Contact lens wear carries real risk when hygiene slips or lenses are overworn. A regular reorder conversation is a chance to ask how the eyes feel, check that the patient is not sleeping in daily lenses, and remind them about case hygiene. That small moment of care is something no online store can offer, and it is the real reason patients stay with a clinic that knows them." },
  ],

  "clinic-whatsapp-on-receptionist-phone": [
    { type: "h2", text: "The day she leaves" },
    { type: "p", text: "Picture the morning your longest-serving receptionist hands in her resignation. She is kind, reliable and has been with you for years. On her personal phone sit thousands of conversations: patients asking about appointments, sending pictures of swollen gums, confirming payments, sharing private worries about their health. When she walks out of the door, all of it walks out with her." },
    { type: "p", text: "Nobody did anything wrong. This is simply what happens when a clinic's most important communication channel belongs to an individual instead of the business." },
    { type: "h2", text: "Why it matters more than it seems" },
    { type: "list", items: [
      "Continuity: new staff start with no history and patients have to repeat themselves.",
      "Privacy: sensitive health information sits on a personal device you do not control.",
      "Accountability: you cannot see what was promised, quoted or agreed in your name.",
      "Fairness: staff are pulled into patient messages late at night on their own phones.",
    ] },
    { type: "p", text: "That last point is often overlooked. Many receptionists feel they can never truly switch off, because patients message them directly at all hours. Moving communication to the clinic protects your staff's personal time as much as it protects your business." },
    { type: "h2", text: "Moving without upsetting patients" },
    { type: "p", text: "Patients do not want to learn a new app. They want to keep using WhatsApp and reach someone who can help. So the change should feel invisible to them. Introduce a clinic number, print it on cards and receipts, and have staff gently guide conversations there: \"Please save our clinic line, so anyone on the team can help you even when I am off.\" Within a few months, most patients will have made the switch naturally." },
    { type: "h2", text: "Your clinic's memory belongs to your clinic" },
    { type: "p", text: "Every message a patient sends you is part of their care and part of your clinic's relationship with them. When those conversations live inside the clinic's own system, alongside appointments and records, the relationship survives staff changes, lost phones and busy seasons. That is not about control. It is about making sure every patient is remembered, whoever happens to answer." },
  ],

  "running-multiple-clinic-branches-nigeria": [
    { type: "h2", text: "The hidden cost of being everywhere" },
    { type: "p", text: "Opening a second branch is a sign of success. Running it often feels like punishment. Owners find themselves spending hours in traffic, moving between locations just to check that the day is going well, approve purchases, count cash, or settle a disagreement. The business grows, but the owner's life shrinks." },
    { type: "p", text: "The underlying problem is visibility. If you can only know what is happening by being physically present, you will always have to be present. And you cannot be in Ikeja and Lekki at the same time." },
    { type: "h2", text: "Trust needs structure" },
    { type: "p", text: "Every multi-branch owner eventually has to trust a branch manager. That trust is much easier to give when it rests on clear information rather than hope. When each branch's appointments, collections, expenses and stock are visible from anywhere, you can support your managers instead of supervising them." },
    { type: "list", items: [
      "Agree on the same daily routine at every branch, so numbers mean the same thing everywhere.",
      "Review a short summary each morning instead of making surprise visits.",
      "Use visits for coaching, patient experience and relationships, not counting cash.",
      "Compare branches fairly, and learn from the one that is doing something well.",
    ] },
    { type: "h2", text: "Consistency is the real brand" },
    { type: "p", text: "Patients do not see your branches as separate businesses. They see one name. If the welcome, pricing and quality of care feel different from one branch to the next, the brand weakens. Shared records, shared price lists and shared ways of working mean a family that visits both locations gets the same experience and the same history, wherever they walk in." },
    { type: "h2", text: "Get your time back" },
    { type: "p", text: "The goal is not simply efficiency. It is getting your evenings, your weekends and your energy back, so you can think about the future of the business instead of putting out fires across the city. Growth should give you more freedom, not less. With the right visibility, a second or third branch can finally feel like progress instead of pressure." },
  ],

  "patient-data-protection-nigeria-clinics": [
    { type: "h2", text: "Privacy is part of care" },
    { type: "p", text: "Patients share things with clinics they would not tell their closest friends. A diagnosis they are afraid of. A pregnancy they have not announced. A test result that could affect their job. When a file is left open on the counter, or a list of names sits beside the visitor's register, that trust is quietly put at risk." },
    { type: "p", text: "Under the Nigeria Data Protection Act, health information is treated as sensitive personal data, and clinics are expected to protect it. But the strongest reason to care is not regulation. It is that patients who feel safe are patients who tell you the truth, and patients who tell you the truth get better care." },
    { type: "h2", text: "Where the everyday risks hide" },
    { type: "list", items: [
      "Folders stacked in public view at reception.",
      "Shared logins, so nobody knows who opened which record.",
      "Results sent to the wrong phone number or forwarded through personal chats.",
      "Old files stored in an unlocked room, with no record of who removes them.",
      "Former staff whose access was never removed.",
    ] },
    { type: "p", text: "None of these feel dramatic. That is exactly why they are dangerous. Small habits, repeated daily, create the conditions for a serious breach." },
    { type: "h2", text: "Simple steps that make a real difference" },
    { type: "p", text: "Give every staff member their own login and only the access their role needs. Keep a record of who viewed and changed each file. Remove access on the day someone leaves. Send results through secure links instead of open messages. Ask for consent clearly and store it with the patient's record. These are not expensive measures. They are habits, and good software makes them easy to keep." },
    { type: "h2", text: "Build a culture, not just a policy" },
    { type: "p", text: "A privacy policy in a drawer protects nobody. What protects patients is a team that understands why it matters. Talk about it at staff meetings. Share real examples. Praise the receptionist who turns a screen away from a waiting patient. When respect for privacy becomes part of how your clinic behaves, patients feel it, even if they never read a single policy." },
  ],

  "clinic-software-power-and-network-outages": [
    { type: "h2", text: "Plan for the reality, not the brochure" },
    { type: "p", text: "Software demonstrations always happen with perfect electricity and fast internet. Real Nigerian clinics do not work that way. Power cuts arrive in the middle of a consultation. The generator takes a few minutes to start. The network drops just as the receptionist is about to save a payment. Any system that falls apart under these conditions will be abandoned within weeks, no matter how impressive it looked on day one." },
    { type: "p", text: "The right question is not whether outages will happen, but what your team does when they do." },
    { type: "h2", text: "Build a calm outage routine" },
    { type: "list", items: [
      "Keep key devices on a UPS, so a power cut never wipes an unsaved record.",
      "Have a backup internet option, such as a mobile hotspot, ready at reception.",
      "Agree on a short paper fallback for the few minutes when nothing works, and enter it as soon as systems return.",
      "Use software that saves work as you go, so nothing depends on one final click.",
    ] },
    { type: "p", text: "When everybody knows the routine, an outage becomes a small pause instead of a crisis. Patients notice the calm more than they notice the darkness." },
    { type: "h2", text: "Why cloud records are safer, not riskier" },
    { type: "p", text: "Some owners worry that putting records online makes them vulnerable to network problems. In practice, the opposite is often true. A computer at reception can be stolen, flooded or fail without warning, taking years of records with it. Records stored securely in the cloud survive all of that, and can be reached from a phone when the main computer is down." },
    { type: "p", text: "Technology in a clinic should feel like a dependable colleague: steady on good days and patient on bad ones. Choose tools built for the conditions you actually work in, and your team will trust them enough to use them every day." },
  ],

  "getting-patients-to-leave-google-reviews": [
    { type: "h2", text: "Silence is not the same as satisfaction being invisible" },
    { type: "p", text: "Most happy patients never write a review. Not because they do not appreciate you, but because nobody asked, and because the moment of gratitude passes quickly once they are back in traffic. Meanwhile, the one patient who had a bad day is far more motivated to write. Left alone, your online reputation becomes a record of your worst moments rather than your everyday care." },
    { type: "p", text: "New patients searching for a clinic nearby read those reviews carefully. For many families, a handful of honest, warm comments is the deciding factor between you and the clinic down the road." },
    { type: "h2", text: "Ask with sincerity" },
    { type: "p", text: "The best time to ask is when the patient expresses relief or thanks. A child who was nervous and left smiling. A mother who can finally see clearly with her new glasses. In that moment, a simple, genuine request lands naturally: \"It would really help other families find us if you shared your experience.\" Follow it with a direct link, so it takes them less than a minute." },
    { type: "list", items: [
      "Ask in person first, then send the link by message the same day.",
      "Keep it optional and never offer payment or discounts for reviews.",
      "Make the link easy: one tap, no searching for your clinic's name.",
    ] },
    { type: "h2", text: "Respond to every review" },
    { type: "p", text: "Thank people who leave kind words, by name where appropriate, without revealing any health details. When a review is negative, respond calmly, acknowledge the experience and invite the person to speak with you privately. Future patients read your replies as closely as the reviews themselves. A thoughtful response to criticism often builds more trust than a page of five stars." },
    { type: "p", text: "Your reputation already exists in the hearts of the patients you have helped. Asking for reviews is simply giving that goodwill a place to be seen." },
  ],

  "diagnostic-lab-result-turnaround": [
    { type: "h2", text: "Behind every call is an anxious person" },
    { type: "p", text: "It is easy for a busy lab to see repeated calls as an interruption. But the person on the other end is usually worried. They may be waiting to know whether they have malaria, whether a pregnancy is progressing well, or whether a lump is something serious. Every hour of uncertainty feels much longer to them than it does to you." },
    { type: "p", text: "Reducing calls is not only about efficiency. It is about replacing anxiety with clarity." },
    { type: "h2", text: "Find where time is really lost" },
    { type: "p", text: "Turnaround time is often blamed on the bench, but delays usually hide in the handovers: samples waiting to be logged, results waiting to be approved, approved results waiting to be printed and collected. When each step is recorded with a time, you can see exactly where samples sit idle and fix that step, rather than pushing your scientists to rush." },
    { type: "list", items: [
      "Log samples immediately at collection, with a clear label and expected ready time.",
      "Set target turnaround times for common tests and monitor them weekly.",
      "Make approval a visible step, so results never wait unseen for a signature.",
      "Release results digitally as soon as they are approved.",
    ] },
    { type: "h2", text: "Results that reach the right person safely" },
    { type: "p", text: "Handing printed results across a crowded counter, or sending them through personal chats, puts sensitive information at risk. A secure link sent to the patient's registered number lets them view their result privately, at home, and share it with their doctor when they are ready. It also means fewer trips back to the centre just to collect a piece of paper." },
    { type: "p", text: "When patients know when to expect their results and receive them quickly and securely, the phone goes quiet. Your front desk can focus on the people in front of them, and your lab earns a reputation as the place where answers arrive on time." },
  ],
};

/** Rough reading time at ~200 words per minute. */
export const estimateReadMinutes = (blocks: ArticleBlock[]) => {
  const words = blocks
    .map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : ""))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
};

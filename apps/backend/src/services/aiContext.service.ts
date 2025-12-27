import { DocumentType } from "../lib/generated";
import { prisma } from "../lib/prisma";

const aiContextService = {
  /**
   * Builds a text context for the LLM based on the user's profile in the DB.
   * Includes: Profile, Experience, Education, Skills, and Resume summary (if avail).
   */
  async buildUserContextFromDb(profileId: string): Promise<string> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        experiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
        skills: { include: { skill: true } },
      },
    });

    // Also try to fetch the most recent resume text
    const resume = await prisma.document.findFirst({
      where: { profile: { id: profileId }, type: DocumentType.RESUME },
      orderBy: { createdAt: "desc" },
      select: { content: true, summary: true },
    });

    if (!profile) {
      return "User has no profile data yet.";
    }

    const parts: string[] = [];

    // 1. Basic Info
    parts.push(`HEADLINE: ${profile.headline || "N/A"}`);
    parts.push(`SUMMARY: ${profile.summary || "N/A"}`);
    parts.push(`LOCATION: ${profile.location || "N/A"}`);
    parts.push(`YEARS EXPERIENCE: ${profile.yearsExperience ?? 0}`);
    if (profile.targetRoles.length > 0) {
      parts.push(`TARGET ROLES: ${profile.targetRoles.join(", ")}`);
    }

    // 2. Skills
    if (profile.skills.length > 0) {
      const skillList = profile.skills
        .map((s) => `${s.skill.name}${s.level ? ` (${s.level})` : ""}`)
        .join(", ");
      parts.push(`SKILLS: ${skillList}`);
    }

    // 3. Experience
    if (profile.experiences.length > 0) {
      parts.push("\nEXPERIENCE:");
      for (const exp of profile.experiences) {
        const start = exp.startDate.toISOString().split("T")[0];
        const end = exp.current
          ? "Present"
          : exp.endDate?.toISOString().split("T")[0] ?? "N/A";
        parts.push(
          `- ${exp.title} at ${exp.company} (${start} to ${end})\n  ${
            exp.summary ?? ""
          }`
        );
        if (exp.highlights.length > 0) {
          parts.push(`  Highlights: ${exp.highlights.join("; ")}`);
        }
      }
    }

    // 4. Education
    if (profile.educations.length > 0) {
      parts.push("\nEDUCATION:");
      for (const edu of profile.educations) {
        parts.push(
          `- ${edu.degree ?? "Degree"} in ${edu.fieldOfStudy ?? "Field"} at ${
            edu.school
          }`
        );
      }
    }

    // 5. Resume Content (Truncated/Summarized)
    if (resume) {
      const content = resume.summary || resume.content;
      // Simple truncation to avoid token overflow, keeping first 1000 chars as a signal
      const safeContent = content.slice(0, 1000).replace(/\n+/g, " ");
      parts.push(`\nRESUME EXCERPT: ${safeContent}...`);
    }

    return parts.join("\n");
  },
};

export default aiContextService;

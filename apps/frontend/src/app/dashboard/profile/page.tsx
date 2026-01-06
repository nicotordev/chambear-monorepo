import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Target,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import backend from "@/lib/backend";

// Helper to format experience/education dates
const formatDateRange = (
  start: Date | null,
  end: Date | null,
  current?: boolean,
) => {
  if (!start) return "";
  const startDate = format(new Date(start), "MMM yyyy", { locale: enUS });
  if (current) return `${startDate} - Present`;
  if (!end) return startDate;
  return `${startDate} - ${format(new Date(end), "MMM yyyy", { locale: enUS })}`;
};

// Helper to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default async function ProfilePage() {
  const user = await backend.user.getMe();

  if (!user) {
    return <div>Error loading user</div>;
  }

  // Take the first available profile or undefined
  const profile = user.profiles?.[0];

  // --- EMPTY STATE: User without profile ---
  if (!profile) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <UserIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your Professional Profile
          </h1>
          <p className="text-muted-foreground max-w-125">
            So that our AI can find you the best jobs and prepare you for
            interviews, we need to know your experience and skills.
          </p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Profile Now
        </Button>
      </div>
    );
  }

  // --- PROFILE LAYOUT ---
  return (
    <div className="flex flex-col space-y-6 p-8 pb-16 animate-in fade-in duration-500">
      {/* 1. PROFILE HEADER */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <Avatar className="h-24 w-24 border-2 border-foreground shadow-md">
            <AvatarImage src={profile.avatar || ""} alt={user.name || ""} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getInitials(user.name || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-lg font-medium text-primary">
              {profile.headline || "No professional headline"}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-1">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {profile.yearsExperience !== null && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {profile.yearsExperience} years exp.
                </div>
              )}
            </div>
          </div>
        </div>

        <Button variant="outline" className="shrink-0 gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN (Main) --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {profile.summary && (
            <Card>
              <CardHeader>
                <CardTitle>About me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experience
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp, index) => (
                  <div key={exp.id} className="relative pl-2">
                    {/* Simple visual connector if not the last */}
                    {index !== profile.experiences!.length - 1 && (
                      <div className="absolute left-0.75 top-2 h-full w-0.5 bg-border ml-1.5 mt-2" />
                    )}

                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base">
                            {exp.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm font-medium text-foreground/80">
                            <Building2 className="h-3.5 w-3.5" />
                            {exp.company}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {formatDateRange(
                            exp.startDate,
                            exp.endDate,
                            exp.current,
                          )}
                        </Badge>
                      </div>

                      {exp.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {exp.location}
                        </span>
                      )}

                      {exp.summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {exp.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  You have not added work experience.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.educations && profile.educations.length > 0 ? (
                profile.educations.map((edu, index) => (
                  <div key={edu.id} className="flex flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">
                          {edu.school}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {edu.description}
                      </p>
                    )}
                    {index !== profile.educations!.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  You have not added education.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (Sidebar) --- */}
        <div className="space-y-6">
          {/* Skills */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" /> Skills
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((ps) => (
                    <Badge
                      key={ps.skillId}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {ps.skill?.name}
                      {ps.level && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground opacity-70 uppercase">
                          • {ps.level}
                        </span>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No skills registered.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Target Roles */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" /> Target Roles
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {profile.targetRoles && profile.targetRoles.length > 0 ? (
                  profile.targetRoles.map((role, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {role}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    You have not defined target roles.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription className="text-xs">
                CVs and Letters visible on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {user.documents?.slice(0, 3).map((doc) => (
                <Link
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-all"
                >
                  <div className="p-1.5 bg-background border rounded-md">
                    {/* Small icon based on type */}
                    <span className="text-xs font-bold text-primary">
                      {doc.type === "RESUME" ? "CV" : "DOC"}
                    </span>
                  </div>
                  <span className="truncate">{doc.label}</span>
                </Link>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                Manage Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

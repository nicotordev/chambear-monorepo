import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CreateProfileInput } from "@/schemas/user";
import { SkillLevel } from "@/types";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";

// 1. Defined a list of popular technical skills for the "Quick Add" feature
const SUGGESTED_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Next.js",
  "Python",
  "AWS",
  "Docker",
  "PostgreSQL",
  "Tailwind CSS",
  "GraphQL",
];

export interface OnboardingFlowStep2Props {
  form: UseFormReturn<CreateProfileInput>;
  appendSkill: (skill: { skillName: string; level: SkillLevel }) => void;
  removeSkill: (index: number) => void;
  skillFields: FieldArrayWithId<CreateProfileInput, "skills", "id">[];
}

export default function OnboardingFlowStep2({
  form,
  appendSkill,
  removeSkill,
  skillFields,
}: OnboardingFlowStep2Props) {
  const [roleInput, setRoleInput] = useState("");

  // Helper to check if a skill is already added (case-insensitive)
  const isSkillAdded = (skillName: string) => {
    return skillFields.some(
      (field) => field.skillName.toLowerCase() === skillName.toLowerCase()
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- TARGET ROLES SECTION --- */}
      <FormField
        control={form.control}
        name="targetRoles"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Roles</FormLabel>
            <FormControl>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {field.value?.map((role, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => {
                        const newRoles = field.value?.filter(
                          (_, i) => i !== index
                        );
                        field.onChange(newRoles);
                      }}
                    >
                      {role}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                <Input
                  placeholder="Type a role and press Enter (e.g. 'Frontend')"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = roleInput.trim();
                      if (val && !field.value?.includes(val)) {
                        field.onChange([...(field.value || []), val]);
                        setRoleInput("");
                      }
                    }
                  }}
                  onBlur={() => {
                    const val = roleInput.trim();
                    if (val && !field.value?.includes(val)) {
                      field.onChange([...(field.value || []), val]);
                      setRoleInput("");
                    }
                  }}
                />
              </div>
            </FormControl>
            <FormDescription>
              Press Enter or Comma to add a role.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- TECHNICAL SKILLS SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel className="text-base">Technical Skills</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendSkill({ skillName: "", level: SkillLevel.BEGINNER })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Custom Skill
          </Button>
        </div>

        {/* 2. New "Quick Add" Section */}
        <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Popular Skills (Quick Add)
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SKILLS.map((skill) => {
              const added = isSkillAdded(skill);
              if (added) return null; // Hide if already added

              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                  onClick={() =>
                    appendSkill({
                      skillName: skill,
                      level: SkillLevel.INTERMEDIATE, // Default to Intermediate for quick add
                    })
                  }
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {skill}
                </Badge>
              );
            })}
            {/* Fallback if all suggested skills are added */}
            {SUGGESTED_SKILLS.every(isSkillAdded) && (
              <span className="text-xs text-muted-foreground italic">
                All suggested skills added! Use the button above for more.
              </span>
            )}
          </div>
        </div>

        {/* Skill List Inputs */}
        <div className="grid gap-3">
          {skillFields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <FormField
                control={form.control}
                name={`skills.${index}.skillName` as const}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Ex. Rust, Go..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`skills.${index}.level`}
                render={({ field }) => (
                  <FormItem className="w-36">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SkillLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(index)}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

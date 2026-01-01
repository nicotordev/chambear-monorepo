"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateProfileInput } from "@/schemas/user";
import { Upload } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

export interface OnboardingFlowStep1Props {
  form: UseFormReturn<CreateProfileInput>;
  profilePic: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function OnboardingFlowStep1({
  form,
  profilePic,
  handleFileUpload,
  fileInputRef,
}: OnboardingFlowStep1Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-center mb-8">
        <FormField
          control={form.control}
          name="avatar"
          render={({}) => (
            <FormItem className="flex flex-col items-center">
              <FormControl>
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="w-32 h-32 border-4 border-muted group-hover:border-primary transition-colors">
                    <AvatarImage
                      src={profilePic || "/avatar.png"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
              </FormControl>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Tap to upload photo
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <Input
              placeholder="San Francisco, CA"
              {...field}
              value={field.value ?? ""}
            />
          )}
        />
        <FormField
          control={form.control}
          name="yearsExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Exp.</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="headline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Headline</FormLabel>
            <FormControl>
              <Input
                placeholder="Senior Full Stack Developer"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>About you</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief professional summary..."
                className="min-h-32"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

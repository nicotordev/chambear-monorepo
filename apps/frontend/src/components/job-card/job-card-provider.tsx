"use client";

import {
  IconBuilding,
  IconClock,
  IconCoin,
  IconExternalLink,
  IconMapPin,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useJobStore } from "@/stores/job/job.store";
import Typography from "../ui/typography";

export interface JobCardProviderProps {
  children: React.ReactNode;
}

export default function JobCardProvider({ children }: JobCardProviderProps) {
  const { selectedJobDetail, isSheetOpen, setSheetOpen } = useJobStore();

  const handleOpenChange = (isOpen: boolean) => {
    setSheetOpen(isOpen);
  };

  return (
    <>
      {children}
      <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          {selectedJobDetail && (
            <>
              <SheetHeader className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16 rounded-lg border">
                    <AvatarImage
                      src={selectedJobDetail?.company?.logo || ""}
                      alt={selectedJobDetail?.company?.name}
                    />
                    <AvatarFallback className="rounded-lg bg-background">
                      <IconBuilding className="w-8 h-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <SheetTitle className="text-2xl font-bold">
                      {selectedJobDetail.title}
                    </SheetTitle>
                    <SheetDescription className="text-lg">
                      {selectedJobDetail?.company?.name || "N/A"}
                    </SheetDescription>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="secondary" className="flex items-center">
                        <IconMapPin className="w-4 h-4 mr-1.5" />
                        {selectedJobDetail?.location || "N/A"}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <IconCoin className="w-4 h-4 mr-1.5" />
                        {selectedJobDetail?.salary || "N/A"}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center">
                        <IconClock className="w-4 h-4 mr-1.5" />
                        {selectedJobDetail?.employmentType.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <Separator />
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Typography variant="h4" className="font-semibold">
                      Job Description
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-muted-foreground whitespace-pre-wrap text-sm"
                    >
                      {selectedJobDetail.description}
                    </Typography>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="h4" className="font-semibold">
                      Tags
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobDetail.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <Separator />
              <SheetFooter className="p-6 flex sm:justify-between items-center">
                <Typography
                  variant="p"
                  className="text-muted-foreground text-sm"
                >
                  Posted on{" "}
                  {selectedJobDetail.postedAt
                    ? new Date(selectedJobDetail.postedAt).toLocaleDateString()
                    : "N/A"}
                </Typography>
                <Button size="lg" className="flex items-center gap-2">
                  <span>Apply Now</span>
                  <IconExternalLink className="w-4 h-4" />
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

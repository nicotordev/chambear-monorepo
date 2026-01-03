"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  File,
  FileText,
  Grid,
  List as ListIcon,
  MoreVertical,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useProfile } from "@/contexts/user-context";
import api from "@/lib/api";
import type { Document, DocumentType } from "@/types";

interface DocumentsViewProps {
  initialDocuments: Document[];
}

export function DocumentsView({ initialDocuments }: DocumentsViewProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const { currentProfile } = useProfile();

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", currentProfile?.id],
    queryFn: () =>
      currentProfile
        ? api.getDocuments(currentProfile.id)
        : Promise.resolve([]),
    initialData: initialDocuments,
    enabled: !!currentProfile,
  });

  const filteredDocuments = documents.filter((doc) =>
    doc.label.toLowerCase().includes(search.toLowerCase()),
  );

  const getIconForType = (type: DocumentType) => {
    switch (type) {
      case "RESUME":
        return <FileText className="h-10 w-10 text-blue-500" />;
      case "COVER_LETTER":
        return <FileText className="h-10 w-10 text-green-500" />;
      case "NOTE":
        return <StickyNote className="h-10 w-10 text-yellow-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "grid" | "list")}
            className="border rounded-md p-1"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" size="sm">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button disabled={!currentProfile}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredDocuments.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50">
          <div className="rounded-full bg-muted p-4 mb-4">
            <File className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            {search
              ? "Try adjusting your search terms."
              : "Upload your first document to get started."}
          </p>
          {!search && (
            <Button
              variant="outline"
              className="mt-4"
              disabled={!currentProfile}
            >
              Upload Document
            </Button>
          )}
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} getIcon={getIconForType} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Modified</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getIconForType(doc.type)}
                          <span>{doc.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {doc.type.replace("_", " ").toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(doc.updatedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <DocumentActions doc={doc} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  getIcon,
}: {
  doc: Document;
  getIcon: (t: DocumentType) => React.ReactNode;
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-muted/60">
      <CardContent className="flex flex-col items-center justify-center p-8 bg-muted/10 group-hover:bg-muted/20 transition-colors h-[180px]">
        <div className="transform transition-transform group-hover:scale-110 duration-300">
          {getIcon(doc.type)}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-3 bg-card">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="truncate font-medium text-sm" title={doc.label}>
            {doc.label}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
          </span>
        </div>
        <DocumentActions doc={doc} />
      </CardFooter>
    </Card>
  );
}

function DocumentActions({ doc }: { doc: Document }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(doc.url, "_blank")}>
          Open
        </DropdownMenuItem>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

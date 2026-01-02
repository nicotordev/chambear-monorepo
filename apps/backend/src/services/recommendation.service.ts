import { JobSource, Prisma, UrlKind } from "@/lib/generated";
import { prisma } from "../lib/prisma";
import {
  mapEmploymentType,
  mapSeniority,
  mapWorkMode,
} from "../lib/utils/mapping";
import { brightdataClient, jobLlmClient } from "../scraping/clients";
import type { JobPosting } from "../types/ai";
import billingService from "./billing.service";
import jobsService from "./jobs.service";

const recommendationService = {

};

export default recommendationService;

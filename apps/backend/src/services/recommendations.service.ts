import recommendationOrchestrator from "@/services/recommendationOrchestrator.service";
import { searchAndRecommendWorkflow } from "@/workflows/searchAndRecommend";

const recommendationsService = {
  async getSmartRecommendations(userId: string) {
    return recommendationOrchestrator.getSmartRecommendations(userId);
  },

  triggerSearch(userId: string) {
    searchAndRecommendWorkflow.runSearchAndRecommend(userId).catch((err) => {
      console.error("Workflow failed", err);
    });
  },
};

export default recommendationsService;

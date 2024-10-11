import { FindMatchProvider } from "@/contexts/FindMatchContext";

import ControlButton from "./ControlButton";
import ConfigurationPanel from "./ConfigurationPanel";
import ConfirmationDialog from "./ConfirmationDialog";
import CheatPanel from "./CheatPanel";
import { getQuestionCategories } from "@/services/questionService";
import { DifficultyEnum } from "@/types/Question";

export default async function FindMatchButton() {
  const categoriesResponse = await getQuestionCategories();

  let categories = [];

  if (categoriesResponse.statusCode === 200 && categoriesResponse.data) {
    categories = categoriesResponse.data.categories;
  }

  return (
    <FindMatchProvider>
      <CheatPanel />
      <ControlButton />
      <ConfigurationPanel
        difficulties={DifficultyEnum.options}
        topics={categories}
      />
      <ConfirmationDialog />
    </FindMatchProvider>
  );
}

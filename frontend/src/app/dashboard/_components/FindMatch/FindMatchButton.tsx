import { FindMatchProvider } from "@/contexts/FindMatchContext";

import ControlButton from "./ControlButton";
import ConfigurationPanel from "./ConfigurationPanel";
import ConfirmationDialog from "./ConfirmationDialog";
import CheatPanel from "./CheatPanel";
import { getQuestionCategories } from "@/services/questionService";
import { DifficultyEnum } from "@/types/Question";
import { getCurrentUser } from "@/services/userService";
import { UserProfileResponse, UserProfileSchema } from "@/types/User";

export default async function FindMatchButton() {
  const user: UserProfileResponse = await getCurrentUser();
  const categoriesResponse = await getQuestionCategories();

  if (!user || !user.data) {
    return <div>You are not signed in</div>;
  }

  const userData = UserProfileSchema.parse(user.data);

  let categories = [];

  if (categoriesResponse.statusCode === 200 && categoriesResponse.data) {
    categories = categoriesResponse.data.categories;
  }

  return (
    // Not the right way to parse the user data
    <FindMatchProvider
      socketUrl={`ws://localhost:4000/match`}
      userId={userData.id}
    >
      <CheatPanel />
      <ControlButton />
      <ConfigurationPanel
        difficulties={DifficultyEnum.options}
        topics={categories}
      />
      <ConfirmationDialog user={userData} />
    </FindMatchProvider>
  );
}

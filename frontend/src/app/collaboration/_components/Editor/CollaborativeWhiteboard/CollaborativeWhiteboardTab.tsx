import { getCurrentUser } from "@/services/userService";
import { UserProfileResponse, UserProfileSchema } from "@/types/User";
import CollaborativeWhiteboard from "./CollaborativeWhiteboard";

export default async function CollaborativeEditorTab({
  sessionId,
}: {
  sessionId: string;
}) {
  const userProfileResponse: UserProfileResponse = await getCurrentUser();

  if (userProfileResponse.statusCode !== 200) {
    return <div>Something went wrong...</div>;
  }

  const userProfile = UserProfileSchema.parse(userProfileResponse.data);

  const socketUrl = process.env.PUBLIC_Y_WEBSOCKET_URL || "ws://localhost:4001";

  return (
    <CollaborativeWhiteboard
      sessionId={sessionId}
      currentUser={userProfile}
      socketUrl={socketUrl}
    />
  );
}

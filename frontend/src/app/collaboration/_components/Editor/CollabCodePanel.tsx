import { Code, Pencil } from "lucide-react";
import TabPanel, { Tab } from "@/app/collaboration/_components/TabPanel";
import CollaborativeEditorTab from "./CollaborativeEditor/CollaborativeEditorTab";
import CollaborativeWhiteboardTab from "./CollaborativeWhiteboard/CollaborativeWhiteboardTab";

export function CollabCodePanel({ sessionId }: { sessionId: string }) {
  const tabs: Tab[] =
    process.env.NEXT_PUBLIC_WHITEBOARD_FEATURE === "true"
      ? [
          {
            value: "code",
            label: "Code",
            Icon: Code,
            content: <CollaborativeEditorTab sessionId={sessionId} />,
          },
          {
            value: "whiteboard",
            label: "Whiteboard",
            Icon: Pencil,
            content: <CollaborativeWhiteboardTab sessionId={sessionId} />,
          },
        ]
      : [
          {
            value: "code",
            label: "Code",
            Icon: Code,
            content: <CollaborativeEditorTab sessionId={sessionId} />,
          },
        ];

  return <TabPanel tabs={tabs} defaultValue={"code"} />;
}

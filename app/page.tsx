import { ChatAssistant } from "@/components/ChatAssistant";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <ChatAssistant />
    </div>
  );
}

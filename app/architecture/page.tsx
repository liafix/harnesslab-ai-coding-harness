import type { Metadata } from "next";
import { ArchitectureStory } from "../../components/ArchitectureStory";

export const metadata: Metadata = {
  title: "Architecture",
  description: "Developer, AI and shared ownership boundaries inside the HarnessLab coding harness.",
};

export default function ArchitecturePage() {
  return <ArchitectureStory />;
}

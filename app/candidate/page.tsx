import type { Metadata } from "next";
import { CandidateStory } from "../../components/CandidateStory";

export const metadata: Metadata = {
  title: "Candidate Story",
  description: "Eight Apertia AI-first hiring questions mapped to visible HarnessLab engineering evidence.",
};

export default function CandidatePage() {
  return <CandidateStory />;
}

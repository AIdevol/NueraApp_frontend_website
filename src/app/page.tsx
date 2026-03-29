import type { Metadata } from "next";
import { LandingView } from "./LandingView";

export const metadata: Metadata = {
  title: "NeuraApp – Welcome | Master AI & Machine Learning",
  description:
    "Unlock the power of Artificial Intelligence. Join our platform to master Machine Learning, Neural Networks, and shape the future of technology.",
};

export default function HomePage() {
  return <LandingView />;
}

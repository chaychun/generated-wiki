import { Article } from "@/components/Article";
import { HOME_SLUG } from "@/lib/types";

export default function Home() {
  return <Article slug={HOME_SLUG} />;
}

import AngelFlixApp from "../angelflix/App";

interface AngelFlixProps {
  onBackToHub?: () => void;
  onOpenLetter?: () => void;
  onLogout?: () => void;
}

export function AngelFlix(_props: AngelFlixProps) {
  return <AngelFlixApp />;
}

import AngelFlixApp from "../angelflix/App";

interface AngelFlixProps {
  onBackToHub?: () => void;
  onOpenLetter?: () => void;
  onLogout?: () => void;
}

export function AngelFlix(props: AngelFlixProps) {
  return <AngelFlixApp onBackToHub={props.onBackToHub} onOpenLetter={props.onOpenLetter} onLogout={props.onLogout} />;
}

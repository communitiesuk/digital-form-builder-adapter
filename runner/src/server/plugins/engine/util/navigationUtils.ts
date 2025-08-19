import {UtilHelper, BackLinkType} from "../../utils/UtilHelper";

interface BackLinkParams {
  progress: string[];
  thisPath: string;
  currentPath: string;
  startPage: string;
  backLinkFallback?: string;
  returnUrl?: string;
  isWelsh: boolean;
}

export function updateProgress(progress: any, currentPath: string): void {
  const lastVisited = progress[progress.length - 1];
  if (!lastVisited || lastVisited !== currentPath) {
    if (progress[progress.length - 2] === currentPath) {
      progress.pop();
    } else {
      progress.push(currentPath);
    }
  }
}

export function getBackLink({
  progress,
  thisPath,
  currentPath,
  startPage,
  backLinkFallback = '/',
  returnUrl,
  isWelsh
}: BackLinkParams) {
  const isFirstPage = thisPath === startPage;

  if (isFirstPage && returnUrl) {
    return {
      backLink: returnUrl,
      backLinkText: UtilHelper.getBackLinkText(BackLinkType.ApplicationOverview, isWelsh)
    };
  }

  const currentIndex = progress.lastIndexOf(currentPath);
  const previousPage = currentIndex > 0 ? progress[currentIndex - 1] : undefined;
  const safeBackLink = previousPage ?? backLinkFallback;

  return {
    backLink: safeBackLink,
    backLinkText: UtilHelper.getBackLinkText(BackLinkType.PreviousPage, isWelsh)
  };
}

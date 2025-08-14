export enum BackLinkType {
  Eligibility,
  PreviousPage,
  ApplicationOverview
}

export class UtilHelper {
  // Helper class to add translations in runner
  public static getBackLinkText(type: BackLinkType, isWelsh: boolean): string {
    switch (type) {
      case BackLinkType.Eligibility:
        return isWelsh ? "Yn ôl at eich ceisiadau" : "Back to your applications";
      case BackLinkType.PreviousPage:
        // TODO: Add Welsh translation for "Go back to previous page"
        return isWelsh ? "" : "Go back to previous page";
      case BackLinkType.ApplicationOverview:
        return isWelsh ? "Yn ôl i'r trosolwg o'r cais" : "Go back to application overview";
      default:
        return "";
    }
  }
}

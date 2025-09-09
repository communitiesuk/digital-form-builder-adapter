
export function buildWindowTitle(pageTitle: string, serviceName: string): string {
    // Build the full page title
    const parts = [pageTitle, serviceName, "GOV.UK"].filter(
        part => part !== undefined && part !== null && part.trim() !== ""
    );
    return parts.join(" - ");
}
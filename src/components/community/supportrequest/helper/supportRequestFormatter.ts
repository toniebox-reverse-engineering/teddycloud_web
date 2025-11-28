export interface SupportRequestFormValues {
    subject: string;
    description: string;
    actions: string;
    expected: string;
    actual: string;
    os: string;
    docker?: string;
    teddycloudVersion?: string;
    logs?: string;
    stepsTaken?: string;
    additionalInfo?: string;
}

export function formatSupportRequest(values: SupportRequestFormValues): string {
    const {
        subject,
        description,
        actions,
        expected,
        actual,
        os,
        docker,
        teddycloudVersion,
        logs,
        stepsTaken,
        additionalInfo,
    } = values;

    return [
        `Subject: ${subject}`,
        ``,
        `Description:`,
        `${description}`,
        ``,
        `1. Actions performed:`,
        `${actions}`,
        ``,
        `2. Expected outcome:`,
        `${expected}`,
        ``,
        `3. Actual outcome:`,
        `${actual}`,
        ``,
        `4. Environment details:`,
        `- OS: ${os}`,
        docker ? `- Docker version: ${docker}` : undefined,
        teddycloudVersion ? `- TeddyCloud version: ${teddycloudVersion}` : undefined,
        ``,
        stepsTaken ? [`5. Steps already taken to resolve the issue:`, `${stepsTaken}`, ``].join("\n") : undefined,
        logs ? [`6. Logs:`, `${logs}`, ``].join("\n") : undefined,
        additionalInfo ? [`7. Additional information (notes):`, `${additionalInfo}`, ``].join("\n") : undefined,
    ]
        .filter((line) => line !== undefined)
        .join("\n");
}

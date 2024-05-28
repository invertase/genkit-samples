export const getPrompt = (source: string, issueText: string) => {
  return `
    <source-material>
    ${source}
    </source-material>
    <github-issue>
    ${issueText}
    </github-issue>
    <instruction>
    Your job is to reply to the provided github-issue.

    Search the source-material for any information relevant to the provided issue.

    Use your findings to best respond to the users issue.
    </instruction>
    `;
};

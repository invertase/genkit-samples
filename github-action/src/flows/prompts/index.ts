export const getPrompt = ({
  content,
  issueBody,
  issueTitle,
}: {
  content: string;
  issueBody: string;
  issueTitle: string;
}) => {
  return `
    <source-material>
    ${content}
    </source-material>
    <github-issue>
    <github-issue-title>
    ${issueTitle}
    </github-issue-title>
    <github-issue-body>
    ${issueBody}
    </github-issue-body>
    </github-issue>
    <instruction>
    Your job is to reply to the provided github-issue.

    Search the source-material for any information relevant to the provided issue.

    Use your findings to best respond to the users issue.
    </instruction>
    `;
};
